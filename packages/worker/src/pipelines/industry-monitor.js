import { MONITOR_SOURCES } from '../config/sources.js';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * AI Industry Monitor — daily pipeline that checks official AI vendor blogs,
 * pricing pages, and aggregators for new products, plans, models, and pricing changes.
 * Uses SHA-256 content hashing to detect changes, then Workers AI to classify them.
 */
export async function monitorAIIndustry(env) {
  console.log(`[MONITOR] Starting AI industry check across ${MONITOR_SOURCES.length} sources`);
  let changesDetected = 0;
  let alertsCreated = 0;
  let errored = 0;

  for (const source of MONITOR_SOURCES) {
    try {
      const result = await checkSource(source, env);
      if (result.changed) {
        changesDetected++;
        const alerts = await classifyAndStore(source, result, env);
        alertsCreated += alerts;
      }
    } catch (err) {
      console.error(`[MONITOR] ${source.key}: error:`, err.message);
      errored++;
    }
  }

  console.log(`[MONITOR] Done: ${changesDetected} changes detected, ${alertsCreated} alerts created, ${errored} errors`);
  return { sourcesChecked: MONITOR_SOURCES.length, changesDetected, alertsCreated, errored };
}

/**
 * Fetch a source and compare content hash to detect changes.
 */
async function checkSource(source, env) {
  let content;

  if (source.type === 'hn-api') {
    // HN Algolia API returns JSON — extract titles
    const resp = await fetch(source.url, { headers: { 'User-Agent': UA } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const titles = (data.hits || []).map(h => `${h.title} | ${h.url || ''}`);
    content = titles.join('\n');
  } else {
    // HTML pages — fetch and extract text content
    const resp = await fetch(source.url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();
    content = extractTextContent(html);
  }

  if (!content || content.length < 50) {
    console.log(`[MONITOR] ${source.key}: insufficient content (${content?.length || 0} chars)`);
    return { changed: false };
  }

  // Compute SHA-256 hash
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(content));
  const newHash = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');

  // Compare with stored hash
  const existing = await env.DB.prepare(
    'SELECT content_hash FROM content_hashes WHERE source_key = ?'
  ).bind(source.key).first();

  const now = new Date().toISOString();

  if (!existing) {
    // First time seeing this source — store hash, no alert (baseline)
    await env.DB.prepare(
      'INSERT INTO content_hashes (source_key, content_hash, last_checked) VALUES (?, ?, ?)'
    ).bind(source.key, newHash, now).run();
    console.log(`[MONITOR] ${source.key}: baseline hash stored`);
    return { changed: false };
  }

  if (existing.content_hash === newHash) {
    // No change
    await env.DB.prepare(
      'UPDATE content_hashes SET last_checked = ? WHERE source_key = ?'
    ).bind(now, source.key).run();
    return { changed: false };
  }

  // Content changed!
  await env.DB.prepare(
    'UPDATE content_hashes SET content_hash = ?, last_checked = ?, last_changed = ? WHERE source_key = ?'
  ).bind(newHash, now, now, source.key).run();

  console.log(`[MONITOR] ${source.key}: content change detected`);

  // Get previous content from cache for diffing
  const cachedContent = await env.CACHE.get(`monitor:content:${source.key}`);

  // Cache new content
  await env.CACHE.put(`monitor:content:${source.key}`, content, { expirationTtl: 172800 }); // 48h

  return { changed: true, content, previousContent: cachedContent };
}

/**
 * Use Workers AI to classify the change and create alerts.
 */
async function classifyAndStore(source, result, env) {
  const { content, previousContent } = result;

  // Build a diff summary — new lines not in previous content
  let diffText;
  if (previousContent) {
    const prevLines = new Set(previousContent.split('\n').map(l => l.trim()).filter(Boolean));
    const newLines = content.split('\n').map(l => l.trim()).filter(Boolean)
      .filter(l => !prevLines.has(l));
    diffText = newLines.slice(0, 50).join('\n'); // cap to prevent huge prompts
  } else {
    // No previous — use first 2000 chars of content
    diffText = content.slice(0, 2000);
  }

  if (!diffText || diffText.length < 20) {
    console.log(`[MONITOR] ${source.key}: change too small to classify`);
    return 0;
  }

  // Classify with Workers AI
  const prompt = `You are an AI industry analyst. Analyze this content change from "${source.name}" (${source.type} page).

NEW/CHANGED CONTENT:
${diffText.slice(0, 3000)}

Extract ALL noteworthy announcements. For each, output a JSON object on its own line with these fields:
- event_type: one of "new-model", "pricing-change", "new-plan", "new-feature", "new-product", "announcement"
- title: concise headline (max 100 chars)
- summary: 2-3 sentence summary with specific details (prices, limits, dates, model names)
- importance: "high" (new model/major pricing change), "medium" (new feature/plan), "low" (minor update)
- metadata: JSON object with extracted specifics (e.g. {"model": "GPT-5", "price": "$200/mo", "limits": "daily: 100 messages"})

If no noteworthy AI industry events, output: NONE
Output ONLY the JSON lines or NONE, no other text.`;

  let alerts = [];
  try {
    const aiResp = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.1,
    });

    const text = (aiResp.response || '').trim();
    if (text === 'NONE' || !text) return 0;

    // Parse JSON lines
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'NONE') continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.event_type && parsed.title) {
          alerts.push(parsed);
        }
      } catch {
        // Try extracting JSON from markdown code block
        const jsonMatch = trimmed.match(/\{.*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.event_type && parsed.title) alerts.push(parsed);
          } catch { /* skip unparseable */ }
        }
      }
    }
  } catch (aiErr) {
    console.error(`[MONITOR] ${source.key}: AI classification failed:`, aiErr.message);
    // Fallback: create a generic alert
    alerts.push({
      event_type: 'announcement',
      title: `Change detected on ${source.name}`,
      summary: `Content on ${source.name} has changed. Check ${source.url} for details.`,
      importance: 'medium',
      metadata: {},
    });
  }

  // Store alerts
  let stored = 0;
  const now = new Date().toISOString();
  for (const alert of alerts) {
    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO industry_alerts
        (source, source_url, event_type, title, summary, raw_snippet, importance, detected_at, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        source.key,
        source.url,
        alert.event_type || 'announcement',
        alert.title,
        alert.summary || null,
        diffText.slice(0, 500),
        alert.importance || 'medium',
        now,
        JSON.stringify(alert.metadata || {}),
      ).run();
      stored++;
    } catch (e) {
      // UNIQUE constraint = duplicate, skip
      if (!e.message.includes('UNIQUE')) {
        console.error(`[MONITOR] ${source.key}: insert error:`, e.message);
      }
    }
  }

  if (stored > 0) {
    console.log(`[MONITOR] ${source.key}: created ${stored} new alerts`);
  }
  return stored;
}

/**
 * Strip HTML tags and extract meaningful text content.
 * Keeps headings, paragraphs, list items — strips nav, scripts, styles.
 */
function extractTextContent(html) {
  // Remove script, style, nav, header, footer tags and their content
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Replace block elements with newlines
  text = text.replace(/<\/?(?:div|p|h[1-6]|li|br|tr|td|th|article|section)[^>]*>/gi, '\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();

  return text;
}
