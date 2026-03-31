import {
  buildLocalModelIndex,
  extractOpenRouterSignals,
  fetchOpenRouterActivity,
  mapModelsToOpenRouter,
} from '../services/openrouter-utils.js';
import { computeTaskCosts } from '../services/task-cost-calculator.js';

async function loadLocalModels(env) {
  const { results } = await env.DB.prepare(`
    SELECT m.id, m.slug, m.name, m.vendor, m.family, a.alias
    FROM models m
    LEFT JOIN model_aliases a ON a.model_slug = m.slug
    WHERE m.is_active = 1
    ORDER BY m.slug
  `).all();

  return buildLocalModelIndex(results);
}

async function mapWithActivity(matches) {
  const enriched = [];
  const concurrency = 6;

  for (let i = 0; i < matches.length; i += concurrency) {
    const batch = matches.slice(i, i + concurrency);
    const settled = await Promise.all(batch.map(async (match) => {
      try {
        const activity = await fetchOpenRouterActivity(match.openrouter.id);
        return { ...match, activity };
      } catch (error) {
        console.warn(`[OPENROUTER] Activity fetch failed for ${match.openrouter.id}: ${error.message}`);
        return { ...match, activity: {} };
      }
    }));
    enriched.push(...settled);
  }

  return enriched;
}

export async function syncOpenRouterStats(env) {
  const localModels = await loadLocalModels(env);
  const { matches } = await mapModelsToOpenRouter(localModels);

  if (!matches.length) {
    console.warn('[OPENROUTER] No local models matched OpenRouter catalog');
    return { matched_models: 0, synced_models: 0, hydrated_core_models: 0 };
  }

  const withActivity = await mapWithActivity(matches);
  const upsertStats = env.DB.prepare(`
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
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
      last_synced_at = datetime('now')
  `);

  const updateModel = env.DB.prepare(`
    UPDATE models
    SET description = COALESCE(?, description),
      input_price_per_mtok = COALESCE(?, input_price_per_mtok),
      output_price_per_mtok = COALESCE(?, output_price_per_mtok),
      cache_hit_price_per_mtok = COALESCE(?, cache_hit_price_per_mtok),
      context_window = COALESCE(?, context_window),
      updated_at = datetime('now')
    WHERE id = ?
  `);

  const batch = [];
  let hydratedCoreModels = 0;

  for (const match of withActivity) {
    const signals = extractOpenRouterSignals(match.openrouter, match.activity);
    batch.push(upsertStats.bind(
      match.local.id,
      signals.openrouter_id,
      signals.canonical_slug,
      signals.openrouter_name,
      signals.description,
      signals.context_length,
      signals.max_completion_tokens,
      signals.modality,
      signals.input_modalities,
      signals.output_modalities,
      signals.tokenizer,
      signals.instruct_type,
      signals.supports_reasoning,
      signals.supports_tools,
      signals.supports_files,
      signals.supports_images,
      signals.supports_structured_outputs,
      signals.is_moderated,
      signals.knowledge_cutoff,
      signals.prompt_price_per_mtok,
      signals.completion_price_per_mtok,
      signals.cache_read_price_per_mtok,
      signals.cache_write_price_per_mtok,
      signals.web_search_price_per_k,
      signals.prompt_tokens_daily,
      signals.reasoning_tokens_daily,
      signals.completion_tokens_daily,
      match.match_score,
      match.hydrate_core_model ? 1 : 0,
      signals.source_url,
      signals.activity_source_url,
    ));

    if (match.hydrate_core_model) {
      hydratedCoreModels += 1;
      batch.push(updateModel.bind(
        signals.description,
        signals.prompt_price_per_mtok,
        signals.completion_price_per_mtok,
        signals.cache_read_price_per_mtok,
        signals.context_length,
        match.local.id,
      ));
    }
  }

  if (batch.length) {
    await env.DB.batch(batch);
  }

  if (hydratedCoreModels > 0) {
    await computeTaskCosts(env);
  }

  if (env.CACHE) {
    await env.CACHE.delete('rankings:v1');
    await env.CACHE.delete('rankings:v2-vibe');
  }

  console.log(`[OPENROUTER] Synced ${withActivity.length} models (${hydratedCoreModels} core hydrations)`);

  return {
    matched_models: matches.length,
    synced_models: withActivity.length,
    hydrated_core_models: hydratedCoreModels,
  };
}
