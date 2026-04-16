import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';
import { generateModelAliases, publishPendingModel } from '../services/model-intake.js';

export const adminRoutes = new Hono();

// All admin routes require auth
adminRoutes.use('*', requireAdmin());

// ── Models CRUD ─────────────────────────────────────────────

// POST /api/admin/models — create a model directly (active)
adminRoutes.post('/models', async (c) => {
  const body = await c.req.json();
  const { name, slug, vendor, family, version_string, release_date, description,
    input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok,
    context_window, is_open_weight, discovery_source, openrouter_id } = body;

  if (!name || !slug || !vendor) {
    return c.json({ error: 'name, slug, and vendor are required' }, 400);
  }

  // Check for duplicates
  const existing = await c.env.DB.prepare('SELECT id FROM models WHERE slug = ?').bind(slug).first();
  if (existing) return c.json({ error: `Model with slug "${slug}" already exists` }, 409);

  const result = await c.env.DB.prepare(`
    INSERT INTO models (name, slug, vendor, family, version_string, release_date, description,
      input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok,
      context_window, is_open_weight, is_active, discovery_source, openrouter_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(
    name, slug, vendor, family || null, version_string || null, release_date || null, description || null,
    input_price_per_mtok ?? null, output_price_per_mtok ?? null,
    cache_hit_price_per_mtok ?? null, context_window ?? null, is_open_weight ?? 0
    , discovery_source || 'manual', openrouter_id || null
  ).run();

  // Auto-generate basic aliases
  const aliases = generateModelAliases(name, slug, vendor, family);
  if (aliases.length > 0) {
    const stmt = c.env.DB.prepare('INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES (?, ?)');
    await c.env.DB.batch(aliases.map(a => stmt.bind(slug, a)));
    // Invalidate alias cache
    await c.env.CACHE.delete('model-aliases:merged');
  }

  return c.json({ ok: true, model_id: result.meta?.last_row_id, aliases_created: aliases.length });
});

// PUT /api/admin/models/:slug — update model fields
adminRoutes.put('/models/:slug', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();

  const model = await c.env.DB.prepare('SELECT id FROM models WHERE slug = ?').bind(slug).first();
  if (!model) return c.json({ error: 'Model not found' }, 404);

  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(body)) {
    if (['name', 'vendor', 'family', 'release_date', 'description',
      'input_price_per_mtok', 'output_price_per_mtok', 'cache_hit_price_per_mtok',
      'context_window', 'is_open_weight', 'is_active'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) return c.json({ error: 'No valid fields to update' }, 400);

  fields.push('updated_at = datetime("now")');
  values.push(model.id);

  await c.env.DB.prepare(`UPDATE models SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return c.json({ ok: true });
});

// DELETE /api/admin/models/:slug — soft delete
adminRoutes.delete('/models/:slug', async (c) => {
  const slug = c.req.param('slug');
  await c.env.DB.prepare('UPDATE models SET is_active = 0, updated_at = datetime("now") WHERE slug = ?').bind(slug).run();
  return c.json({ ok: true });
});

// ── Pending Models ──────────────────────────────────────────

// GET /api/admin/pending — list pending discoveries
adminRoutes.get('/pending', async (c) => {
  const status = c.req.query('status') || 'pending';
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM pending_models WHERE status = ? ORDER BY COALESCE(last_seen_at, created_at) DESC LIMIT 50'
  ).bind(status).all();
  return c.json({ pending: results });
});

// POST /api/admin/pending/:id/approve — promote to active model
adminRoutes.post('/pending/:id/approve', async (c) => {
  const id = c.req.param('id');
  const pending = await c.env.DB.prepare('SELECT * FROM pending_models WHERE id = ? AND status = ?').bind(id, 'pending').first();
  if (!pending) return c.json({ error: 'Pending model not found or already processed' }, 404);

  // Check slug doesn't already exist in models
  const existing = await c.env.DB.prepare('SELECT id FROM models WHERE slug = ?').bind(pending.slug).first();
  if (existing) {
    await c.env.DB.prepare("UPDATE pending_models SET status = 'rejected', reviewed_at = datetime('now'), decision_source = 'manual' WHERE id = ?").bind(id).run();
    return c.json({ error: `Model slug "${pending.slug}" already exists in models table`, action: 'auto-rejected' }, 409);
  }

  const published = await publishPendingModel(c.env, pending, { decisionSource: 'manual' });
  const modelId = published.modelId;

  // Auto-enrich: interpolate task estimates from sibling model
  let estimatesCreated = 0;
  try {
    estimatesCreated = await interpolateTaskEstimates(c.env, modelId, pending.vendor, pending.family);
  } catch (e) {
    console.error('[ADMIN] Task estimate interpolation failed:', e.message);
  }

  // Trigger composite score recomputation
  try {
    const { computeCompositeScores } = await import('../services/composite-score-engine.js');
    await computeCompositeScores(c.env);
    await c.env.CACHE.delete('rankings:v1');
  } catch (e) {
    console.error('[ADMIN] Composite score recomputation failed:', e.message);
  }

  return c.json({
    ok: true,
    model_id: modelId,
    aliases_created: published.aliasesCreated,
    estimates_created: estimatesCreated,
  });
});

// POST /api/admin/pending/:id/reject
adminRoutes.post('/pending/:id/reject', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("UPDATE pending_models SET status = 'rejected', reviewed_at = datetime('now'), decision_source = 'manual' WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});

// ── Benchmarks ──────────────────────────────────────────────

// POST /api/admin/benchmarks — upsert a benchmark score
adminRoutes.post('/benchmarks', async (c) => {
  const body = await c.req.json();
  const { model_slug, benchmark_name, category, score, max_score, source_url } = body;

  if (!model_slug || !benchmark_name || !category || score == null) {
    return c.json({ error: 'model_slug, benchmark_name, category, and score are required' }, 400);
  }

  const model = await c.env.DB.prepare('SELECT id FROM models WHERE slug = ?').bind(model_slug).first();
  if (!model) return c.json({ error: `Model "${model_slug}" not found` }, 404);

  await c.env.DB.prepare(`
    INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score, source_url)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(model_id, benchmark_name) DO UPDATE SET
      score = excluded.score, max_score = excluded.max_score,
      source_url = excluded.source_url, measured_at = datetime('now')
  `).bind(model.id, benchmark_name, category, score, max_score ?? 100, source_url ?? null).run();

  return c.json({ ok: true });
});

// ── Aliases ─────────────────────────────────────────────────

// GET /api/admin/aliases
adminRoutes.get('/aliases', async (c) => {
  const slug = c.req.query('model');
  let query = 'SELECT * FROM model_aliases';
  const params = [];
  if (slug) {
    query += ' WHERE model_slug = ?';
    params.push(slug);
  }
  query += ' ORDER BY model_slug, alias';
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ aliases: results });
});

// POST /api/admin/aliases
adminRoutes.post('/aliases', async (c) => {
  const body = await c.req.json();
  const { model_slug, aliases } = body;
  if (!model_slug || !Array.isArray(aliases) || aliases.length === 0) {
    return c.json({ error: 'model_slug and aliases array required' }, 400);
  }

  const stmt = c.env.DB.prepare('INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES (?, ?)');
  await c.env.DB.batch(aliases.map(a => stmt.bind(model_slug, a.toLowerCase().trim())));
  await c.env.CACHE.delete('model-aliases:merged');
  return c.json({ ok: true, count: aliases.length });
});

// DELETE /api/admin/aliases/:id
adminRoutes.delete('/aliases/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM model_aliases WHERE id = ?').bind(id).run();
  await c.env.CACHE.delete('model-aliases:merged');
  return c.json({ ok: true });
});

// ── Enrichment trigger ──────────────────────────────────────

// POST /api/admin/trigger/enrichment — manually trigger full pipeline
adminRoutes.post('/trigger/enrichment', async (c) => {
  const results = {};
  try {
    const { computeCompositeScores } = await import('../services/composite-score-engine.js');
    await computeCompositeScores(c.env);
    results.compositeScores = 'ok';
  } catch (e) { results.compositeScores = e.message; }

  try {
    const { computeTaskCosts } = await import('../services/task-cost-calculator.js');
    await computeTaskCosts(c.env);
    results.taskCosts = 'ok';
  } catch (e) { results.taskCosts = e.message; }

  try {
    const { syncOpenRouterStats } = await import('../pipelines/openrouter-sync.js');
    await syncOpenRouterStats(c.env);
    results.openrouter = 'ok';
  } catch (e) { results.openrouter = e.message; }

  await c.env.CACHE.delete('rankings:v1');
  await c.env.CACHE.delete('rankings:v2-vibe');
  await c.env.CACHE.delete('model-aliases:merged');
  results.cachesCleared = true;

  return c.json(results);
});

// ── Pipeline Health ────────────────────────────────────────

// GET /api/admin/pipeline-status — overview of data pipeline health
adminRoutes.get('/pipeline-status', async (c) => {
  const [
    modelCount, benchmarkCount, scoreCount, alertCount,
    newsCount, reviewCount, staleModels, pendingCount,
    lastOpenRouterSync, lastBenchmarkScrape
  ] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as c FROM models WHERE is_active = 1').first(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM benchmarks').first(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM model_composite_scores').first(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM industry_alerts WHERE is_dismissed = 0').first(),
    c.env.DB.prepare("SELECT COUNT(*) as c FROM news_items WHERE published_at >= datetime('now', '-7 days')").first(),
    c.env.DB.prepare('SELECT COUNT(*) as c FROM community_reviews').first(),
    c.env.DB.prepare(`
      SELECT COUNT(*) as c FROM models m
      LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
      WHERE m.is_active = 1
        AND (m.updated_at < datetime('now', '-14 days')
          OR mcs.updated_at IS NULL
          OR mcs.updated_at < datetime('now', '-14 days'))
    `).first(),
    c.env.DB.prepare("SELECT COUNT(*) as c FROM pending_models WHERE status = 'pending'").first(),
    c.env.DB.prepare(`
      SELECT MAX(last_synced_at) as last_sync FROM model_openrouter_stats
    `).first(),
    c.env.DB.prepare(`
      SELECT MAX(measured_at) as last_scrape FROM benchmarks
    `).first(),
  ]);

  return c.json({
    models: {
      active: modelCount.c,
      stale: staleModels.c,
      pending: pendingCount.c,
    },
    benchmarks: {
      total_scores: benchmarkCount.c,
      composite_scores: scoreCount.c,
      last_scrape: lastBenchmarkScrape?.last_scrape,
    },
    content: {
      alerts: alertCount.c,
      news_last_7d: newsCount.c,
      reviews: reviewCount.c,
    },
    openrouter: {
      last_sync: lastOpenRouterSync?.last_sync,
    },
    health: staleModels.c === 0 ? 'healthy' : staleModels.c <= 5 ? 'warning' : 'degraded',
  });
});

async function interpolateTaskEstimates(env, modelId, vendor, family) {
  // Find closest sibling model in the same family
  const sibling = await env.DB.prepare(`
    SELECT m.id FROM models m
    JOIN model_task_estimates mte ON mte.model_id = m.id
    WHERE m.vendor = ? AND m.family = ? AND m.id != ? AND m.is_active = 1
    ORDER BY m.release_date DESC LIMIT 1
  `).bind(vendor, family || '', modelId).first();

  if (!sibling) {
    // No sibling — try same vendor, any family
    const fallback = await env.DB.prepare(`
      SELECT m.id FROM models m
      JOIN model_task_estimates mte ON mte.model_id = m.id
      WHERE m.vendor = ? AND m.id != ? AND m.is_active = 1
      ORDER BY m.release_date DESC LIMIT 1
    `).bind(vendor, modelId).first();
    if (!fallback) return 0;
    return await copyEstimates(env, modelId, fallback.id);
  }

  return await copyEstimates(env, modelId, sibling.id);
}

async function copyEstimates(env, targetModelId, sourceModelId) {
  const { results } = await env.DB.prepare(`
    SELECT task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
           avg_minutes_to_complete, steering_effort, autonomy_score,
           cost_per_task_estimate, time_value_per_task
    FROM model_task_estimates WHERE model_id = ?
  `).bind(sourceModelId).all();

  if (results.length === 0) return 0;

  const stmt = env.DB.prepare(`
    INSERT OR IGNORE INTO model_task_estimates
    (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
     avg_minutes_to_complete, steering_effort, autonomy_score,
     cost_per_task_estimate, time_value_per_task, data_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'estimated')
  `);

  const batch = results.map(est => stmt.bind(
    targetModelId,
    est.task_profile_id,
    Math.min(1.0, est.first_attempt_success_rate * 1.03), // 3% boost for newer model
    est.avg_messages_to_complete,
    est.avg_minutes_to_complete,
    est.steering_effort,
    est.autonomy_score,
    est.cost_per_task_estimate,
    est.time_value_per_task
  ));

  await env.DB.batch(batch);
  return results.length;
}
