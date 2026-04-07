/**
 * Benchmark scraping pipeline.
 * Fetches scores from authoritative leaderboards and upserts into benchmarks table.
 * Each source is isolated — one failure doesn't block others.
 * Runs weekly on Mondays via cron.
 */

import { fetchWithTimeout } from '../utils/fetch.js';

const USER_AGENT = 'AllThingsAI-BenchmarkScraper/1.0 (+https://all-things-ai.pages.dev)';

export async function scrapeBenchmarks(env) {
  const results = {};

  // Load model slug lookup (name → slug mapping)
  const slugMap = await buildSlugMap(env);

  const scrapers = [
    { name: 'lmarena', fn: () => scrapeArenaELO(env, slugMap) },
    { name: 'livebench', fn: () => scrapeLiveBench(env, slugMap) },
    { name: 'swebench', fn: () => scrapeSWEBench(env, slugMap) },
    { name: 'gpqa', fn: () => scrapeGPQA(env, slugMap) },
    { name: 'taubench', fn: () => scrapeTAUBench(env, slugMap) },
    { name: 'hle', fn: () => scrapeHLE(env, slugMap) },
    { name: 'mmlu', fn: () => scrapeMMLU(env, slugMap) },
    { name: 'humaneval', fn: () => scrapeHumanEval(env, slugMap) },
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

/**
 * Scrape SWE-bench Verified scores from the official leaderboard.
 * SWE-bench publishes results on GitHub (princeton-nlp/SWE-bench).
 */
async function scrapeSWEBench(env, slugMap) {
  const cacheKey = 'benchmark:swebench:raw';
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    console.log('[BENCHMARK] SWE-bench: using cached data');
    return await processGenericBenchmark(env, cached, slugMap, 'SWE-bench Verified', 'coding', 100, 'https://www.swebench.com');
  }

  // SWE-bench leaderboard data on GitHub
  const resp = await fetchWithTimeout(
    'https://raw.githubusercontent.com/princeton-nlp/SWE-bench/main/docs/leaderboard.json',
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!resp.ok) {
    // Fallback: try the HF dataset
    const resp2 = await fetchWithTimeout(
      'https://huggingface.co/api/datasets/princeton-nlp/SWE-bench_Verified',
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (!resp2.ok) {
      console.log(`[BENCHMARK] SWE-bench: fetch returned ${resp.status}, skipping`);
      return { matched: 0, unmatched: 0, source: 'swebench-unavailable' };
    }
    // HF API returns metadata, not scores — skip gracefully
    console.log('[BENCHMARK] SWE-bench: only metadata available from HF, skipping');
    return { matched: 0, unmatched: 0, source: 'swebench-hf-metadata' };
  }

  const data = await resp.json();
  await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
  return await processGenericBenchmark(env, data, slugMap, 'SWE-bench Verified', 'coding', 100, 'https://www.swebench.com');
}

/**
 * Scrape GPQA Diamond scores.
 * GPQA is published via academic papers; scores are often on GitHub or PapersWithCode.
 */
async function scrapeGPQA(env, slugMap) {
  const cacheKey = 'benchmark:gpqa:raw';
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    console.log('[BENCHMARK] GPQA: using cached data');
    return await processGenericBenchmark(env, cached, slugMap, 'GPQA Diamond', 'reasoning', 100, 'https://arxiv.org/abs/2311.12022');
  }

  // Try PapersWithCode API for GPQA Diamond leaderboard
  const resp = await fetchWithTimeout(
    'https://paperswithcode.com/api/v1/get-leaderboard/?task=gpqa-diamond',
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!resp.ok) {
    console.log(`[BENCHMARK] GPQA: fetch returned ${resp.status}, skipping`);
    return { matched: 0, unmatched: 0, source: 'gpqa-unavailable' };
  }

  const data = await resp.json();
  await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
  return await processGenericBenchmark(env, data, slugMap, 'GPQA Diamond', 'reasoning', 100, 'https://arxiv.org/abs/2311.12022');
}

/**
 * Scrape TAU-bench Retail scores.
 * TAU-bench results are published on GitHub by Sierra Research.
 */
async function scrapeTAUBench(env, slugMap) {
  const cacheKey = 'benchmark:taubench:raw';
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    console.log('[BENCHMARK] TAU-bench: using cached data');
    return await processGenericBenchmark(env, cached, slugMap, 'TAU-bench Retail', 'agent', 100, 'https://github.com/sierra-research/tau-bench');
  }

  const resp = await fetchWithTimeout(
    'https://raw.githubusercontent.com/sierra-research/tau-bench/main/results/leaderboard.json',
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!resp.ok) {
    console.log(`[BENCHMARK] TAU-bench: fetch returned ${resp.status}, skipping`);
    return { matched: 0, unmatched: 0, source: 'taubench-unavailable' };
  }

  const data = await resp.json();
  await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
  return await processGenericBenchmark(env, data, slugMap, 'TAU-bench Retail', 'agent', 100, 'https://github.com/sierra-research/tau-bench');
}

/**
 * Generic benchmark processor — handles varied JSON formats from leaderboards.
 * Tries multiple common field names for model name and score.
 */
async function processGenericBenchmark(env, data, slugMap, benchmarkName, category, maxScore, sourceUrl) {
  let matched = 0;
  const unmatched = [];

  // Handle multiple JSON shapes: array, {results: [...]}, {data: [...]}, {rows: [...]}
  const entries = Array.isArray(data)
    ? data
    : (data.results || data.data || data.rows || data.models || data.leaderboard || []);

  for (const entry of entries) {
    // Try multiple field names for model name
    const name = entry.model || entry.name || entry.Model || entry.model_name || entry.agent || '';
    // Try multiple field names for score
    const score = entry.score || entry.accuracy || entry.resolved || entry.pass_rate
      || entry.global_avg || entry.avg_score || entry.result || entry.success_rate || null;

    if (!name || score == null) continue;

    // Normalize score to 0-100 range if needed
    const normalizedScore = score > 1 ? score : score * 100;

    const slug = matchModel(name, slugMap);
    if (!slug) {
      unmatched.push(name);
      continue;
    }

    const model = await env.DB.prepare('SELECT id FROM models WHERE slug = ?').bind(slug).first();
    if (!model) continue;

    await env.DB.prepare(`
      INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score, source_url)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(model_id, benchmark_name) DO UPDATE SET
        score = excluded.score, measured_at = datetime('now')
    `).bind(model.id, benchmarkName, category, normalizedScore, maxScore, sourceUrl).run();
    matched++;
  }

  if (unmatched.length > 0) {
    console.log(`[BENCHMARK] ${benchmarkName}: ${unmatched.length} unmatched:`, unmatched.slice(0, 10).join(', '));

    // Auto-alias: try to fuzzy-match unmatched names to existing models
    const allSlugs = Object.values(slugMap);
    const allNames = Object.keys(slugMap);
    for (const name of unmatched.slice(0, 20)) {
      const lower = name.toLowerCase().trim();
      // Try substring match: if an existing model name contains this name or vice versa
      const match = allNames.find(existing => {
        const el = existing.toLowerCase();
        return (el.includes(lower) || lower.includes(el)) && el !== lower;
      });
      if (match) {
        const targetSlug = slugMap[match];
        try {
          await env.DB.prepare(
            'INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES (?, ?)'
          ).bind(targetSlug, lower).run();
          console.log(`[BENCHMARK] Auto-alias: "${lower}" → ${targetSlug}`);
        } catch {}
      }
    }
  }

  return { matched, unmatched: unmatched.length, source: benchmarkName };
}

/**
 * Scrape Humanity's Last Exam (HLE) scores.
 * HLE is published by Scale AI / CAIS on Hugging Face.
 */
async function scrapeHLE(env, slugMap) {
  const cacheKey = 'benchmark:hle:raw';
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    console.log('[BENCHMARK] HLE: using cached data');
    return await processGenericBenchmark(env, cached, slugMap, "Humanity's Last Exam", 'reasoning', 100, 'https://lastexam.ai');
  }

  // Try the HLE leaderboard data from Hugging Face
  const resp = await fetchWithTimeout(
    'https://huggingface.co/api/spaces/cais/hle-leaderboard',
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!resp.ok) {
    // Fallback: try GitHub-hosted results
    const resp2 = await fetchWithTimeout(
      'https://raw.githubusercontent.com/centerforaisafety/hle-leaderboard/main/results.json',
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (!resp2.ok) {
      console.log(`[BENCHMARK] HLE: fetch returned ${resp.status}, skipping`);
      return { matched: 0, unmatched: 0, source: 'hle-unavailable' };
    }
    const data = await resp2.json();
    await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
    return await processGenericBenchmark(env, data, slugMap, "Humanity's Last Exam", 'reasoning', 100, 'https://lastexam.ai');
  }

  const data = await resp.json();
  await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
  return await processGenericBenchmark(env, data, slugMap, "Humanity's Last Exam", 'reasoning', 100, 'https://lastexam.ai');
}

/**
 * Scrape MMLU (Massive Multitask Language Understanding) scores.
 * MMLU results are widely published — try PapersWithCode first.
 */
async function scrapeMMLU(env, slugMap) {
  const cacheKey = 'benchmark:mmlu:raw';
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    console.log('[BENCHMARK] MMLU: using cached data');
    return await processGenericBenchmark(env, cached, slugMap, 'MMLU', 'knowledge', 100, 'https://paperswithcode.com/sota/multi-task-language-understanding-on-mmlu');
  }

  const resp = await fetchWithTimeout(
    'https://paperswithcode.com/api/v1/get-leaderboard/?task=multi-task-language-understanding-on-mmlu',
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!resp.ok) {
    console.log(`[BENCHMARK] MMLU: fetch returned ${resp.status}, skipping`);
    return { matched: 0, unmatched: 0, source: 'mmlu-unavailable' };
  }

  const data = await resp.json();
  await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
  return await processGenericBenchmark(env, data, slugMap, 'MMLU', 'knowledge', 100, 'https://paperswithcode.com/sota/multi-task-language-understanding-on-mmlu');
}

/**
 * Scrape HumanEval / EvalPlus scores for code generation.
 * EvalPlus publishes results on GitHub.
 */
async function scrapeHumanEval(env, slugMap) {
  const cacheKey = 'benchmark:humaneval:raw';
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached) {
    console.log('[BENCHMARK] HumanEval: using cached data');
    return await processGenericBenchmark(env, cached, slugMap, 'HumanEval+', 'coding', 100, 'https://evalplus.github.io/leaderboard.html');
  }

  const resp = await fetchWithTimeout(
    'https://raw.githubusercontent.com/evalplus/evalplus/master/results/results.json',
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!resp.ok) {
    console.log(`[BENCHMARK] HumanEval: fetch returned ${resp.status}, skipping`);
    return { matched: 0, unmatched: 0, source: 'humaneval-unavailable' };
  }

  const data = await resp.json();
  await env.CACHE.put(cacheKey, JSON.stringify(data), { expirationTtl: 604800 });
  return await processGenericBenchmark(env, data, slugMap, 'HumanEval+', 'coding', 100, 'https://evalplus.github.io/leaderboard.html');
}

// fetchWithTimeout imported from ../utils/fetch.js
