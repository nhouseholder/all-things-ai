/**
 * Benchmark scraping pipeline.
 * Fetches scores from authoritative leaderboards and upserts into benchmarks table.
 * Each source is isolated — one failure doesn't block others.
 * Runs weekly on Mondays via cron.
 */

const USER_AGENT = 'AllThingsAI-BenchmarkScraper/1.0 (+https://all-things-ai.pages.dev)';
const FETCH_TIMEOUT = 10000; // 10 seconds

export async function scrapeBenchmarks(env) {
  const results = {};

  // Load model slug lookup (name → slug mapping)
  const slugMap = await buildSlugMap(env);

  const scrapers = [
    { name: 'lmarena', fn: () => scrapeArenaELO(env, slugMap) },
    { name: 'livebench', fn: () => scrapeLiveBench(env, slugMap) },
  ];

  for (const scraper of scrapers) {
    try {
      const result = await scraper.fn();
      results[scraper.name] = { status: 'ok', ...result };
    } catch (e) {
      console.error(`[BENCHMARK] ${scraper.name} failed:`, e.message);
      results[scraper.name] = { status: 'error', message: e.message };
    }
  }

  console.log('[BENCHMARK] Scraping complete:', JSON.stringify(results));
  return results;
}

/**
 * Build a mapping from model name variations to our slugs.
 * Uses both models table names and model_aliases table.
 */
async function buildSlugMap(env) {
  const map = {};

  // From models table
  const { results: models } = await env.DB.prepare(
    'SELECT name, slug FROM models WHERE is_active = 1'
  ).all();
  for (const m of models) {
    map[m.name.toLowerCase()] = m.slug;
    map[m.slug] = m.slug;
    // Also without vendor: "Claude Opus 4.6" → "opus 4.6"
    const parts = m.name.split(' ');
    if (parts.length >= 2) {
      map[parts.slice(1).join(' ').toLowerCase()] = m.slug;
    }
  }

  // From model_aliases table
  const { results: aliases } = await env.DB.prepare(
    'SELECT model_slug, alias FROM model_aliases'
  ).all();
  for (const a of aliases) {
    map[a.alias.toLowerCase()] = a.model_slug;
  }

  return map;
}

/**
 * Fuzzy-match a leaderboard model name to our slug.
 */
function matchModel(externalName, slugMap) {
  const lower = externalName.toLowerCase().trim();

  // Exact match
  if (slugMap[lower]) return slugMap[lower];

  // Strip common suffixes/prefixes
  const cleaned = lower
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical
    .replace(/\s*-\s*preview\s*/g, '')
    .replace(/\s*-\s*latest\s*/g, '')
    .trim();
  if (slugMap[cleaned]) return slugMap[cleaned];

  // Try each key as a substring
  for (const [key, slug] of Object.entries(slugMap)) {
    if (key.length >= 4 && lower.includes(key)) return slug;
  }

  return null;
}

/**
 * Scrape Chatbot Arena ELO from lmarena.ai
 * They publish a JSON endpoint with the leaderboard.
 */
async function scrapeArenaELO(env, slugMap) {
  // Check KV cache (7-day TTL)
  const cacheKey = 'benchmark:arena:raw';
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    console.log('[BENCHMARK] Arena: using cached data');
    return await processArenaData(env, cached, slugMap);
  }

  // The Arena leaderboard data is available at this endpoint
  const resp = await fetchWithTimeout(
    'https://huggingface.co/spaces/lmarena-ai/chatbot-arena-leaderboard/resolve/main/results.json',
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!resp.ok) {
    // Fallback: try the HF API
    const resp2 = await fetchWithTimeout(
      'https://huggingface.co/api/spaces/lmarena-ai/chatbot-arena-leaderboard',
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (!resp2.ok) throw new Error(`Arena fetch failed: ${resp.status} / ${resp2.status}`);
    // HF API returns space metadata, not leaderboard data — skip gracefully
    console.log('[BENCHMARK] Arena: API returned space metadata, skipping');
    return { matched: 0, unmatched: 0, source: 'arena-api-metadata' };
  }

  const data = await resp.json();
  await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 }); // 7 days
  return await processArenaData(env, data, slugMap);
}

async function processArenaData(env, data, slugMap) {
  let matched = 0;
  const unmatched = [];

  // Arena data format varies — handle both array and object formats
  const entries = Array.isArray(data) ? data : (data.rows || data.data || []);

  for (const entry of entries) {
    const name = entry.model || entry.name || entry.Model || '';
    const elo = entry.elo || entry.rating || entry.Arena_Elo || entry['Arena Elo'] || null;
    if (!name || elo == null) continue;

    const slug = matchModel(name, slugMap);
    if (!slug) {
      unmatched.push(name);
      continue;
    }

    const model = await env.DB.prepare('SELECT id FROM models WHERE slug = ?').bind(slug).first();
    if (!model) continue;

    await env.DB.prepare(`
      INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score, source_url)
      VALUES (?, 'Chatbot Arena ELO', 'nuance', ?, 2000, 'https://lmarena.ai')
      ON CONFLICT(model_id, benchmark_name) DO UPDATE SET
        score = excluded.score, measured_at = datetime('now')
    `).bind(model.id, elo).run();
    matched++;
  }

  if (unmatched.length > 0) {
    console.log(`[BENCHMARK] Arena: ${unmatched.length} unmatched models:`, unmatched.slice(0, 10).join(', '));
  }

  return { matched, unmatched: unmatched.length, source: 'arena' };
}

/**
 * Scrape LiveBench scores from livebench.ai
 */
async function scrapeLiveBench(env, slugMap) {
  const cacheKey = 'benchmark:livebench:raw';
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    console.log('[BENCHMARK] LiveBench: using cached data');
    return await processLiveBenchData(env, cached, slugMap);
  }

  // LiveBench publishes results on GitHub
  const resp = await fetchWithTimeout(
    'https://raw.githubusercontent.com/LiveBench/LiveBench/main/docs/results.json',
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!resp.ok) {
    console.log(`[BENCHMARK] LiveBench: fetch returned ${resp.status}, skipping`);
    return { matched: 0, unmatched: 0, source: 'livebench-unavailable' };
  }

  const data = await resp.json();
  await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
  return await processLiveBenchData(env, data, slugMap);
}

async function processLiveBenchData(env, data, slugMap) {
  let matched = 0;
  const unmatched = [];

  const entries = Array.isArray(data) ? data : (data.results || data.models || []);

  for (const entry of entries) {
    const name = entry.model || entry.name || '';
    const score = entry.global_avg || entry.score || entry.coding || null;
    if (!name || score == null) continue;

    const slug = matchModel(name, slugMap);
    if (!slug) {
      unmatched.push(name);
      continue;
    }

    const model = await env.DB.prepare('SELECT id FROM models WHERE slug = ?').bind(slug).first();
    if (!model) continue;

    await env.DB.prepare(`
      INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score, source_url)
      VALUES (?, 'LiveCodeBench', 'coding', ?, 100, 'https://livebench.ai')
      ON CONFLICT(model_id, benchmark_name) DO UPDATE SET
        score = excluded.score, measured_at = datetime('now')
    `).bind(model.id, score).run();
    matched++;
  }

  if (unmatched.length > 0) {
    console.log(`[BENCHMARK] LiveBench: ${unmatched.length} unmatched:`, unmatched.slice(0, 10).join(', '));
  }

  return { matched, unmatched: unmatched.length, source: 'livebench' };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
