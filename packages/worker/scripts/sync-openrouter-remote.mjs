import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLocalModelIndex, extractOpenRouterSignals, fetchOpenRouterActivity, mapModelsToOpenRouter } from '../src/services/openrouter-utils.js';

const WORKDIR = new URL('..', import.meta.url).pathname;
const DB_NAME = 'all-things-ai-db';

function runWrangler(args) {
  return execFileSync('npx', ['wrangler', ...args], {
    cwd: WORKDIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function queryRemote(sql) {
  const raw = runWrangler(['d1', 'execute', DB_NAME, '--remote', '--json', '--command', sql]);
  const parsed = JSON.parse(raw);
  return parsed[0]?.results || [];
}

function execRemoteFile(file) {
  return runWrangler(['d1', 'execute', DB_NAME, '--remote', '--file', file]);
}

function sqlValue(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function fetchActivities(matches) {
  const results = [];
  const concurrency = 6;

  for (let i = 0; i < matches.length; i += concurrency) {
    const batch = matches.slice(i, i + concurrency);
    const settled = await Promise.all(batch.map(async (match) => {
      try {
        const activity = await fetchOpenRouterActivity(match.openrouter.id);
        return { ...match, activity };
      } catch (error) {
        console.warn(`[remote-sync] Activity fetch failed for ${match.openrouter.id}: ${error.message}`);
        return { ...match, activity: {} };
      }
    }));
    results.push(...settled);
  }

  return results;
}

function buildStatements(matches) {
  const statements = [];
  const hydratedIds = [];

  for (const match of matches) {
    const signals = extractOpenRouterSignals(match.openrouter, match.activity);
    statements.push(`
INSERT INTO model_openrouter_stats (
  model_id, openrouter_id, canonical_slug, openrouter_name, description,
  context_length, max_completion_tokens, modality, input_modalities,
  output_modalities, tokenizer, instruct_type, supports_reasoning,
  supports_tools, supports_files, supports_images, supports_structured_outputs,
  is_moderated, knowledge_cutoff, prompt_price_per_mtok,
  completion_price_per_mtok, cache_read_price_per_mtok, cache_write_price_per_mtok,
  web_search_price_per_k, prompt_tokens_daily, reasoning_tokens_daily,
  completion_tokens_daily, match_score, hydrates_core_model,
  source_url, activity_source_url, last_synced_at
) VALUES (
  ${sqlValue(match.local.id)}, ${sqlValue(signals.openrouter_id)}, ${sqlValue(signals.canonical_slug)}, ${sqlValue(signals.openrouter_name)}, ${sqlValue(signals.description)},
  ${sqlValue(signals.context_length)}, ${sqlValue(signals.max_completion_tokens)}, ${sqlValue(signals.modality)}, ${sqlValue(signals.input_modalities)},
  ${sqlValue(signals.output_modalities)}, ${sqlValue(signals.tokenizer)}, ${sqlValue(signals.instruct_type)}, ${sqlValue(signals.supports_reasoning)},
  ${sqlValue(signals.supports_tools)}, ${sqlValue(signals.supports_files)}, ${sqlValue(signals.supports_images)}, ${sqlValue(signals.supports_structured_outputs)},
  ${sqlValue(signals.is_moderated)}, ${sqlValue(signals.knowledge_cutoff)}, ${sqlValue(signals.prompt_price_per_mtok)},
  ${sqlValue(signals.completion_price_per_mtok)}, ${sqlValue(signals.cache_read_price_per_mtok)}, ${sqlValue(signals.cache_write_price_per_mtok)},
  ${sqlValue(signals.web_search_price_per_k)}, ${sqlValue(signals.prompt_tokens_daily)}, ${sqlValue(signals.reasoning_tokens_daily)},
  ${sqlValue(signals.completion_tokens_daily)}, ${sqlValue(match.match_score)}, ${sqlValue(match.hydrate_core_model ? 1 : 0)},
  ${sqlValue(signals.source_url)}, ${sqlValue(signals.activity_source_url)}, datetime('now')
)
ON CONFLICT(model_id) DO UPDATE SET
  openrouter_id = excluded.openrouter_id,
  canonical_slug = excluded.canonical_slug,
  openrouter_name = excluded.openrouter_name,
  description = excluded.description,
  context_length = excluded.context_length,
  max_completion_tokens = excluded.max_completion_tokens,
  modality = excluded.modality,
  input_modalities = excluded.input_modalities,
  output_modalities = excluded.output_modalities,
  tokenizer = excluded.tokenizer,
  instruct_type = excluded.instruct_type,
  supports_reasoning = excluded.supports_reasoning,
  supports_tools = excluded.supports_tools,
  supports_files = excluded.supports_files,
  supports_images = excluded.supports_images,
  supports_structured_outputs = excluded.supports_structured_outputs,
  is_moderated = excluded.is_moderated,
  knowledge_cutoff = excluded.knowledge_cutoff,
  prompt_price_per_mtok = excluded.prompt_price_per_mtok,
  completion_price_per_mtok = excluded.completion_price_per_mtok,
  cache_read_price_per_mtok = excluded.cache_read_price_per_mtok,
  cache_write_price_per_mtok = excluded.cache_write_price_per_mtok,
  web_search_price_per_k = excluded.web_search_price_per_k,
  prompt_tokens_daily = excluded.prompt_tokens_daily,
  reasoning_tokens_daily = excluded.reasoning_tokens_daily,
  completion_tokens_daily = excluded.completion_tokens_daily,
  match_score = excluded.match_score,
  hydrates_core_model = excluded.hydrates_core_model,
  source_url = excluded.source_url,
  activity_source_url = excluded.activity_source_url,
  last_synced_at = datetime('now');
`);

    if (match.hydrate_core_model) {
      hydratedIds.push(match.local.id);
      statements.push(`
UPDATE models
SET description = COALESCE(${sqlValue(signals.description)}, description),
  input_price_per_mtok = COALESCE(${sqlValue(signals.prompt_price_per_mtok)}, input_price_per_mtok),
  output_price_per_mtok = COALESCE(${sqlValue(signals.completion_price_per_mtok)}, output_price_per_mtok),
  cache_hit_price_per_mtok = COALESCE(${sqlValue(signals.cache_read_price_per_mtok)}, cache_hit_price_per_mtok),
  context_window = COALESCE(${sqlValue(signals.context_length)}, context_window),
  updated_at = datetime('now')
WHERE id = ${sqlValue(match.local.id)};
`);
    }
  }

  if (hydratedIds.length) {
    statements.push(`
UPDATE model_task_estimates
SET cost_per_task_estimate = ROUND(
  avg_messages_to_complete * (
    COALESCE((SELECT avg_input_tokens FROM task_profiles WHERE id = model_task_estimates.task_profile_id), 0)
      * COALESCE((SELECT input_price_per_mtok FROM models WHERE id = model_task_estimates.model_id), 0)
    +
    COALESCE((SELECT avg_output_tokens FROM task_profiles WHERE id = model_task_estimates.task_profile_id), 0)
      * COALESCE((SELECT output_price_per_mtok FROM models WHERE id = model_task_estimates.model_id), 0)
  ) / 1000000,
  6
),
time_value_per_task = ROUND(avg_minutes_to_complete * 1.25, 2)
WHERE model_id IN (${hydratedIds.join(',')});
`);
  }

  return statements.join('\n');
}

async function main() {
  console.log('[remote-sync] Loading local models from remote D1');
  const localRows = queryRemote(`
    SELECT m.id, m.slug, m.name, m.vendor, m.family, a.alias
    FROM models m
    LEFT JOIN model_aliases a ON a.model_slug = m.slug
    WHERE m.is_active = 1
    ORDER BY m.slug
  `);
  const localModels = buildLocalModelIndex(localRows);

  console.log('[remote-sync] Matching models against OpenRouter catalog');
  const { matches } = await mapModelsToOpenRouter(localModels);
  console.log(`[remote-sync] Matched ${matches.length} models`);

  const withActivity = await fetchActivities(matches);
  const sql = buildStatements(withActivity);

  const tempDir = mkdtempSync(join(tmpdir(), 'all-things-ai-openrouter-'));
  const sqlFile = join(tempDir, 'sync.sql');
  writeFileSync(sqlFile, sql);

  try {
    console.log('[remote-sync] Applying remote SQL');
    const output = execRemoteFile(sqlFile);
    process.stdout.write(output);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }

  console.log(`[remote-sync] Synced ${withActivity.length} models`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error('[remote-sync] Failed:', error);
    process.exit(1);
  });
}
