import { syncOpenRouterStats } from '../pipelines/openrouter-sync.js';
import { scrapePricing } from '../pipelines/pricing-scraper.js';

export async function processEnrichmentQueue(env, options = {}) {
  const limit = options.limit || 10;
  const { results } = await env.DB.prepare(`
    SELECT id, model_id, slug FROM model_enrichment_queue
    WHERE status = 'pending'
    ORDER BY queued_at ASC
    LIMIT ?
  `).bind(limit).all();

  if (!results.length) {
    console.log('[ENRICH] queue empty');
    return { processed: 0 };
  }

  let processed = 0;

  for (const entry of results) {
    const model = await env.DB.prepare(
      'SELECT id, name, slug, vendor, input_price_per_mtok, context_window, release_date FROM models WHERE id = ?'
    ).bind(entry.model_id).first();

    if (!model) {
      await markProcessed(env, entry.id, 'missing-model');
      continue;
    }

    const missing = [];
    if (model.input_price_per_mtok == null) missing.push('pricing');
    if (model.context_window == null) missing.push('context');
    if (!model.release_date) missing.push('release-date');

    if (missing.length === 0) {
      await markProcessed(env, entry.id, 'already-complete');
      processed++;
      continue;
    }

    try {
      await syncOpenRouterStats(env, { targetSlug: model.slug });
    } catch (err) {
      console.warn(`[ENRICH] openrouter sync failed for ${model.slug}: ${err.message}`);
    }

    try {
      await scrapePricing(env, { targetVendor: model.vendor });
    } catch (err) {
      console.warn(`[ENRICH] pricing scrape failed for ${model.slug}: ${err.message}`);
    }

    await markProcessed(env, entry.id, 'attempted');
    processed++;
  }

  if (env.CACHE) {
    await env.CACHE.delete('rankings:v1');
    await env.CACHE.delete('rankings:v2-vibe');
  }

  console.log(`[ENRICH] processed ${processed} entries`);
  return { processed };
}

async function markProcessed(env, id, result) {
  await env.DB.prepare(`
    UPDATE model_enrichment_queue
    SET status = 'processed',
        processed_at = datetime('now'),
        reason = COALESCE(reason, '') || '|result=' || ?
    WHERE id = ?
  `).bind(result, id).run();
}
