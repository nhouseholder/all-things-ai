import { MONITOR_SOURCES } from '../config/sources.js';
import { extractModelCandidatesFromText, ingestModelCandidate } from '../services/model-intake.js';
import { fetchWithTimeout } from '../utils/fetch.js';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const ACCEPT_LANG = 'en-US,en;q=0.9';

/**
 * AI Industry Monitor — daily pipeline that checks official AI vendor blogs,
 * pricing pages, and aggregators for new products, plans, models, and pricing changes.
 * Uses SHA-256 content hashing to detect changes, then Workers AI to classify them.
 */
export async function monitorAIIndustry(env, options = {}) {
  const sourceKeys = Array.isArray(options.sourceKeys) ? options.sourceKeys : [];
  const selectedSources = sourceKeys.length > 0
    ? MONITOR_SOURCES.filter((source) => sourceKeys.includes(source.key))
    : MONITOR_SOURCES;

  console.log(`[MONITOR] Starting AI industry check across ${selectedSources.length} sources`);
  let changesDetected = 0;
  let alertsCreated = 0;
  let errored = 0;

  for (const source of selectedSources) {
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
      try {
        await env.DB.prepare(`
          INSERT INTO monitor_fetch_failures (source_key, error_message, failed_at)
          VALUES (?, ?, datetime('now'))
        `).bind(source.key, String(err.message).slice(0, 500)).run();
      } catch { /* table may not exist yet */ }
    }
  }

  console.log(`[MONITOR] Done: ${changesDetected} changes detected, ${alertsCreated} alerts created, ${errored} errors`);
  return { sourcesChecked: selectedSources.length, changesDetected, alertsCreated, errored };
}

export function buildMonitorClassificationPrompt(source, diffText) {
  return `You are an AI industry analyst. Analyze this content change from "${source.name}" (${source.type} page).

NEW/CHANGED CONTENT:
${diffText.slice(0, 3000)}

Extract ALL noteworthy announcements. For each, output a JSON object on its own line with these fields:
- event_type: one of "coding-model", "coding-plan", "new-model", "pricing-change", "new-plan", "new-feature", "new-product", "announcement"
- title: concise headline (max 100 chars)
- summary: 2-3 sentence summary with specific details (prices, limits, dates, model names)
- importance: "high" (major coding model launch, major plan/pricing change), "medium" (new feature/plan), "low" (minor update)
- metadata: JSON object with extracted specifics (e.g. {"vendor": "Anthropic", "model": "Claude Sonnet", "plan": "Pro+", "price": "$200/mo", "limits": "daily: 100 messages"})

Use "coding-model" when the update is primarily about a coding-focused model, coding agent, code generation upgrade, software engineering benchmark jump, or developer-facing model capability from vendors/tools like Claude, GPT, Gemini, Copilot, GLM, Kimi, MiniMax, Claude Code, Codex, or Gemini Code Assist.
Use "coding-plan" when the update is primarily about a coding-related plan, pricing tier, seat model, usage cap, quota, package, or subscription change for those tools/vendors.
Use the older generic types only when the update is noteworthy but not specifically coding-model or coding-plan oriented.
Prioritize coding-model and coding-plan whenever both a general and coding-specific label could fit, especially for vibe coding, app design, agentic coding, CLI coding tools, and developer workflows.

If no noteworthy AI industry events, output: NONE
Output ONLY the JSON lines or NONE, no other text.`;
}

function signalTypeFromMonitorSource(source) {
  if (source.trust === 'official' || source.trust === 'catalog' || source.trust === 'community') {
    return source.trust;
  }
  if (source.type === 'aggregator' || source.type === 'hn-api') return 'news';
  return 'official';
}

function shouldExtractDirectCandidates(source) {
  return source.trust === 'official'
    && Array.isArray(source.vendorHints)
    && source.vendorHints.length > 0;
}

export function extractDirectSourceModelSignals(source, diffText) {
  if (!shouldExtractDirectCandidates(source)) {
    return [];
  }

  const candidates = extractModelCandidatesFromText(diffText, {
    vendorHints: source.vendorHints,
  });

  return candidates.slice(0, source.directCandidateLimit || 6).map((candidate) => ({
    ...candidate,
    sourceKey: source.key,
    sourceLabel: source.name,
    sourceUrl: source.url,
    contentUrl: source.url,
    discoverySource: source.key,
    discoveryUrl: source.url,
    signalType: signalTypeFromMonitorSource(source),
    title: candidate.name,
    summary: null,
    vendorHints: source.vendorHints,
    metadata: {
      extraction: 'direct-source-candidate',
    },
  }));
}

function extractAlertModelSignals(source, alert, diffText) {
  if (!['coding-model', 'new-model'].includes(alert.event_type)) {
    return [];
  }

  const metadata = alert.metadata && typeof alert.metadata === 'object' ? alert.metadata : {};
  const vendorHints = [metadata.vendor, ...(source.vendorHints || [])].filter(Boolean);
  const directNames = [metadata.model, metadata.model_name, metadata.name]
    .filter((value) => typeof value === 'string' && value.trim());

  const extracted = directNames.length > 0
    ? directNames.map((name) => ({ name, vendor: metadata.vendor || null, family: metadata.family || null }))
    : extractModelCandidatesFromText(
      [alert.title, alert.summary, diffText].filter(Boolean).join(' '),
      { vendorHints }
    );

  const deduped = new Map();
  for (const candidate of extracted.slice(0, 3)) {
    if (!candidate?.slug && !candidate?.name) continue;
    const dedupeKey = candidate.slug || candidate.name.toLowerCase();
    if (deduped.has(dedupeKey)) continue;

    deduped.set(dedupeKey, {
      ...candidate,
      sourceKey: source.key,
      sourceLabel: source.name,
      sourceUrl: source.url,
      contentUrl: metadata.source_url || metadata.url || source.url,
      discoverySource: source.key,
      discoveryUrl: metadata.source_url || metadata.url || source.url,
      signalType: signalTypeFromMonitorSource(source),
      title: alert.title,
      summary: alert.summary,
      releaseDate: metadata.release_date || null,
      description: metadata.description || null,
      vendorHints,
      metadata: {
        ...metadata,
        event_type: alert.event_type,
        importance: alert.importance,
      },
    });
  }

  return [...deduped.values()];
}

async function ingestAlertModelSignals(source, alerts, diffText, env) {
  let processed = 0;

  for (const alert of alerts) {
    const candidates = extractAlertModelSignals(source, alert, diffText);
    for (const candidate of candidates) {
      const result = await ingestModelCandidate(env, candidate);
      if (result.outcome !== 'skipped') {
        processed += 1;
      }
    }
  }

  return processed;
}

async function ingestDirectSourceCandidates(source, diffText, env) {
  let processed = 0;

  for (const candidate of extractDirectSourceModelSignals(source, diffText)) {
    const result = await ingestModelCandidate(env, candidate);
    if (result.outcome !== 'skipped') {
      processed += 1;
    }
  }

  return processed;
}

/**
 * Fetch a source and compare content hash to detect changes.
 */
async function checkSource(source, env) {
  let content;

  if (source.type === 'hn-api') {
    // HN Algolia API returns JSON — extract titles
    const resp = await fetchWithTimeout(source.url, { headers: { 'User-Agent': UA } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const titles = (data.hits || []).map(h => `${h.title} | ${h.url || ''}`);
    content = titles.join('\n');
  } else {
    // HTML pages — fetch and extract text content
    const resp = await fetchWithTimeout(source.url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': ACCEPT_LANG,
        'Cache-Control': 'no-cache',
      },
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
    if (env.CACHE) {
      await env.CACHE.put(`monitor:content:${source.key}`, content, { expirationTtl: 172800 });
    }
    console.log(`[MONITOR] ${source.key}: baseline hash stored${source.bootstrapCapture ? ' (bootstrap capture enabled)' : ''}`);
    return { changed: Boolean(source.bootstrapCapture), content, previousContent: null };
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
  const cachedContent = env.CACHE ? await env.CACHE.get(`monitor:content:${source.key}`) : null;

  // Cache new content
  if (env.CACHE) {
    await env.CACHE.put(`monitor:content:${source.key}`, content, { expirationTtl: 172800 }); // 48h
  }

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
    // No previous — use a larger bootstrap slice for catalog-like pages.
    diffText = content.slice(0, source.bootstrapSliceChars || 2000);
  }

  if (!diffText || diffText.length < 20) {
    console.log(`[MONITOR] ${source.key}: change too small to classify`);
    return 0;
  }

  const prompt = buildMonitorClassificationPrompt(source, diffText);

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

  const ingestedSignals = await ingestAlertModelSignals(source, alerts, diffText, env);
  if (ingestedSignals > 0) {
    console.log(`[MONITOR] ${source.key}: processed ${ingestedSignals} model candidate signals`);
  }

  const directSignals = await ingestDirectSourceCandidates(source, diffText, env);
  if (directSignals > 0) {
    console.log(`[MONITOR] ${source.key}: processed ${directSignals} direct source candidates`);
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
