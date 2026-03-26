import { KNOWN_VENDORS } from '../config/sources.js';

/**
 * Scans recent news items for model release announcements and creates
 * pending_models entries for review. Conservative — never auto-promotes.
 */
export async function discoverNewModels(env) {
  // 1. Fetch recent news items tagged as model releases (last 48h)
  const { results: newsItems } = await env.DB.prepare(`
    SELECT id, title, summary, source, content_url, published_at
    FROM news_items
    WHERE published_at > datetime('now', '-48 hours')
      AND (relevance_tags LIKE '%model-release%'
        OR relevance_tags LIKE '%new-model%'
        OR title LIKE '%launches%'
        OR title LIKE '%announces%'
        OR title LIKE '%releases%'
        OR title LIKE '%introduces%')
    ORDER BY published_at DESC
    LIMIT 50
  `).all();

  if (newsItems.length === 0) {
    console.log('[DISCOVERY] No recent model-release news items found');
    return { discovered: 0 };
  }

  // 2. Get existing model slugs to deduplicate
  const { results: existingModels } = await env.DB.prepare('SELECT slug FROM models').all();
  const { results: pendingModels } = await env.DB.prepare("SELECT slug FROM pending_models WHERE status = 'pending'").all();
  const knownSlugs = new Set([
    ...existingModels.map(m => m.slug),
    ...pendingModels.map(m => m.slug),
  ]);

  // 3. Scan each news item for model name patterns
  let discovered = 0;
  for (const item of newsItems) {
    const text = `${item.title} ${item.summary || ''}`.toLowerCase();
    const candidates = extractModelCandidates(text);

    for (const candidate of candidates) {
      if (knownSlugs.has(candidate.slug)) continue;

      try {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO pending_models
          (name, slug, vendor, family, discovery_source, discovery_url, status)
          VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
          candidate.name,
          candidate.slug,
          candidate.vendor,
          candidate.family,
          item.source,
          item.content_url
        ).run();

        knownSlugs.add(candidate.slug);
        discovered++;
        console.log(`[DISCOVERY] New model candidate: "${candidate.name}" from ${item.source}`);
      } catch (e) {
        // UNIQUE constraint = already pending, skip
      }
    }
  }

  console.log(`[DISCOVERY] Scanned ${newsItems.length} items, discovered ${discovered} new candidates`);
  return { discovered, scanned: newsItems.length };
}

/**
 * Extract model name candidates from text using known vendor patterns.
 * Returns array of { name, slug, vendor, family }
 */
function extractModelCandidates(text) {
  const candidates = [];
  const seen = new Set();

  for (const [vendor, config] of Object.entries(KNOWN_VENDORS)) {
    for (const prefix of config.prefixes) {
      // Match pattern: prefix + version/name (e.g., "gemini 3.2", "claude opus 5", "gpt-6")
      const patterns = [
        new RegExp(`${prefix}[\\s-]*(\\d+\\.?\\d*(?:\\s*(?:pro|ultra|flash|mini|plus|max|turbo|scout|maverick|large|medium|small|high|xhigh))?)`, 'gi'),
        new RegExp(`${prefix}[\\s-]*([a-z]+\\s*\\d+\\.?\\d*)`, 'gi'),
      ];

      for (const regex of patterns) {
        let match;
        while ((match = regex.exec(text)) !== null) {
          const fullMatch = match[0].trim();
          const slug = fullMatch
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

          if (slug.length < 4 || seen.has(slug)) continue;
          seen.add(slug);

          // Title-case the name
          const name = fullMatch.replace(/\b\w/g, c => c.toUpperCase());

          candidates.push({
            name,
            slug,
            vendor,
            family: config.family,
          });
        }
      }
    }
  }

  return candidates;
}
