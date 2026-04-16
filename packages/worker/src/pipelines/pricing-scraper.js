import { PRICING_TARGETS } from '../config/sources.js';
import { fetchWithTimeout } from '../utils/fetch.js';

/**
 * Regex patterns to extract monthly prices from HTML.
 * Ordered from most specific to least specific.
 */
const PRICE_PATTERNS = [
  // $XX/month, $XX/mo, $XX per month (with optional decimals)
  /\$\s*([\d,]+(?:\.\d{1,2})?)\s*\/\s*(?:month|mo)\b/gi,
  /\$\s*([\d,]+(?:\.\d{1,2})?)\s+per\s+month/gi,
  // $XX/user/month, $XX/seat/month
  /\$\s*([\d,]+(?:\.\d{1,2})?)\s*\/\s*(?:user|seat)\s*\/\s*(?:month|mo)\b/gi,
  /\$\s*([\d,]+(?:\.\d{1,2})?)\s*\/\s*(?:month|mo)\s*\/\s*(?:user|seat)\b/gi,
  // USD XX/month
  /USD\s*([\d,]+(?:\.\d{1,2})?)\s*\/\s*(?:month|mo)\b/gi,
];

/**
 * Extract all monthly prices from HTML text.
 * Returns deduplicated array of price numbers.
 */
function extractPrices(html) {
  const prices = new Set();

  for (const pattern of PRICE_PATTERNS) {
    // Reset regex lastIndex since we're reusing patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price > 0 && price < 10000) {
        prices.add(price);
      }
    }
  }

  return [...prices].sort((a, b) => a - b);
}

/**
 * Scrape pricing pages for configured AI tools and detect price changes.
 * This is inherently fragile — each target is wrapped in try/catch.
 */
export async function scrapePricing(env, options = {}) {
  const now = new Date().toISOString();
  let targetsChecked = 0;
  let priceChanges = 0;

  for (const target of PRICING_TARGETS) {
    try {
      // Fetch pricing page HTML
      const resp = await fetchWithTimeout(target.url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });

      if (!resp.ok) {
        console.error(`[PRICING] ${target.tool_slug}: HTTP ${resp.status}`);
        continue;
      }

      const html = await resp.text();
      const extractedPrices = extractPrices(html);

      if (extractedPrices.length === 0) {
        console.log(`[PRICING] ${target.tool_slug}: no prices extracted`);
        // Still cache the HTML for debugging
        await env.CACHE.put(`pricing:html:${target.tool_slug}`, html, {
          expirationTtl: 86400,
        });
        targetsChecked++;
        continue;
      }

      // Look up the tool in DB
      const tool = await env.DB.prepare('SELECT id FROM tools WHERE slug = ?')
        .bind(target.tool_slug)
        .first();

      if (!tool) {
        console.log(`[PRICING] ${target.tool_slug}: tool not found in DB, skipping price comparison`);
        targetsChecked++;
        continue;
      }

      // Get current pricing plans for this tool
      const currentPlans = await env.DB.prepare(
        'SELECT id, plan_name, price_monthly FROM pricing_plans WHERE tool_id = ? AND is_current = 1'
      )
        .bind(tool.id)
        .all();

      const existingPrices = (currentPlans.results || []).map((p) => p.price_monthly).filter(Boolean);

      // Detect changes: compare extracted prices against stored prices
      for (const extractedPrice of extractedPrices) {
        const matchingPlan = (currentPlans.results || []).find(
          (p) => p.price_monthly === extractedPrice
        );

        if (matchingPlan) {
          // Price unchanged — no action needed
          continue;
        }

        // Check if this is a known price that changed
        // Find the closest existing plan by price (heuristic: smallest absolute difference)
        let closestPlan = null;
        let smallestDiff = Infinity;
        for (const plan of currentPlans.results || []) {
          if (plan.price_monthly) {
            const diff = Math.abs(plan.price_monthly - extractedPrice);
            if (diff < smallestDiff) {
              smallestDiff = diff;
              closestPlan = plan;
            }
          }
        }

        if (closestPlan && smallestDiff > 0) {
          // Price changed on an existing plan
          const oldPrice = closestPlan.price_monthly;

          await env.DB.prepare(
            'UPDATE pricing_plans SET previous_price = ?, price_monthly = ?, changed_at = ? WHERE id = ?'
          )
            .bind(oldPrice, extractedPrice, now, closestPlan.id)
            .run();

          const changeType = extractedPrice > oldPrice ? 'increase' : 'decrease';

          await env.DB.prepare(
            `INSERT INTO price_changes (tool_id, plan_id, old_price, new_price, change_type, detected_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
            .bind(tool.id, closestPlan.id, oldPrice, extractedPrice, changeType, now)
            .run();

          console.log(
            `[PRICING] ${target.tool_slug}: price change detected $${oldPrice} -> $${extractedPrice} (${changeType})`
          );
          priceChanges++;
        } else if (!closestPlan && existingPrices.length > 0) {
          // New price tier detected that wasn't in DB before — log but don't insert
          // (we can't determine the plan_name from HTML alone)
          console.log(
            `[PRICING] ${target.tool_slug}: new price tier detected $${extractedPrice}/mo (not in DB)`
          );
        }
      }

      // Cache raw HTML for debugging
      await env.CACHE.put(`pricing:html:${target.tool_slug}`, html, {
        expirationTtl: 86400,
      });

      targetsChecked++;
    } catch (targetErr) {
      console.error(`[PRICING] ${target.tool_slug}: scrape error:`, targetErr.message);
      targetsChecked++;
    }
  }

  console.log(`[PRICING] Checked ${targetsChecked} targets, found ${priceChanges} price changes`);
  return { targetsChecked, priceChanges };
}
