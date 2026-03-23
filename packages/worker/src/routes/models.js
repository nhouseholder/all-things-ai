import { Hono } from 'hono';

export const modelsRoutes = new Hono();

// GET /api/models — all models with latest benchmarks
modelsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT m.*,
      (SELECT json_group_array(json_object(
        'benchmark_name', b.benchmark_name, 'category', b.category,
        'score', b.score, 'max_score', b.max_score
      )) FROM benchmarks b WHERE b.model_id = m.id) as benchmark_scores
    FROM models m WHERE m.is_active = 1 ORDER BY m.name
  `).all();
  return c.json(results.map(m => ({ ...m, benchmark_scores: JSON.parse(m.benchmark_scores || '[]') })));
});

// GET /api/models/pricing — token pricing comparison with bang-for-buck scores
// NOTE: Must be registered BEFORE /:slug to avoid matching "pricing" as a slug
modelsRoutes.get('/pricing', async (c) => {
  // Fetch all active models with pricing columns
  const { results: models } = await c.env.DB.prepare(`
    SELECT m.id, m.name, m.slug, m.vendor, m.family,
      m.input_price_per_mtok, m.output_price_per_mtok,
      m.cache_hit_price_per_mtok, m.context_window,
      m.params_total, m.params_active, m.is_open_weight
    FROM models m
    WHERE m.is_active = 1
      AND m.input_price_per_mtok IS NOT NULL
      AND m.output_price_per_mtok IS NOT NULL
    ORDER BY m.name
  `).all();

  // Fetch all benchmark scores in one query
  const { results: allBenchmarks } = await c.env.DB.prepare(`
    SELECT model_id, benchmark_name, category, score, max_score
    FROM benchmarks
    WHERE model_id IN (SELECT id FROM models WHERE is_active = 1)
  `).all();

  // Index benchmarks by model_id
  const benchmarksByModel = {};
  for (const b of allBenchmarks) {
    if (!benchmarksByModel[b.model_id]) benchmarksByModel[b.model_id] = [];
    benchmarksByModel[b.model_id].push(b);
  }

  // Fetch availability for all active models
  const { results: allAvailability } = await c.env.DB.prepare(`
    SELECT ma.model_id, t.name as tool_name, t.slug as tool_slug,
      pp.plan_name, pp.price_monthly, ma.access_level
    FROM model_availability ma
    JOIN tools t ON t.id = ma.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
    WHERE ma.model_id IN (SELECT id FROM models WHERE is_active = 1)
  `).all();

  // Index availability by model_id
  const availabilityByModel = {};
  for (const a of allAvailability) {
    if (!availabilityByModel[a.model_id]) availabilityByModel[a.model_id] = [];
    availabilityByModel[a.model_id].push(a);
  }

  // Build response with bang_for_buck
  const pricingData = models.map((m) => {
    const benchmarks = benchmarksByModel[m.id] || [];
    const scores = benchmarks.map((b) => {
      // Normalize to 0-100 scale if max_score is provided
      if (b.max_score && b.max_score > 0) return (b.score / b.max_score) * 100;
      return b.score;
    });
    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Blended cost: 30% input + 70% output per 1M tokens
    const blendedCost = (m.input_price_per_mtok * 0.3) + (m.output_price_per_mtok * 0.7);
    const bangForBuck = blendedCost > 0 ? avgScore / blendedCost : 0;

    return {
      id: m.id,
      name: m.name,
      slug: m.slug,
      vendor: m.vendor,
      family: m.family,
      input_price_per_mtok: m.input_price_per_mtok,
      output_price_per_mtok: m.output_price_per_mtok,
      cache_hit_price_per_mtok: m.cache_hit_price_per_mtok,
      context_window: m.context_window,
      params_total: m.params_total,
      params_active: m.params_active,
      is_open_weight: m.is_open_weight,
      avg_benchmark_score: Number(avgScore.toFixed(2)),
      blended_cost_per_mtok: Number(blendedCost.toFixed(4)),
      bang_for_buck: Number(bangForBuck.toFixed(2)),
      benchmark_count: benchmarks.length,
      availability: availabilityByModel[m.id] || [],
    };
  });

  // Sort by bang_for_buck descending
  pricingData.sort((a, b) => b.bang_for_buck - a.bang_for_buck);

  return c.json({ models: pricingData });
});

// GET /api/models/alternatives — get alternatives for a model
modelsRoutes.get('/alternatives', async (c) => {
  const slug = c.req.query('model');

  if (slug) {
    // Alternatives for a specific model
    const model = await c.env.DB.prepare('SELECT id, name, slug FROM models WHERE slug = ? AND is_active = 1').bind(slug).first();
    if (!model) return c.json({ error: 'Model not found' }, 404);

    const { results } = await c.env.DB.prepare(`
      SELECT
        ma.similarity_score, ma.cost_savings_pct, ma.trade_off_notes,
        m.name, m.slug, m.vendor, m.family,
        m.input_price_per_mtok, m.output_price_per_mtok, m.is_open_weight,
        mcs.composite_score
      FROM model_alternatives ma
      JOIN models m ON m.id = ma.alternative_model_id
      LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
      WHERE ma.model_id = ? AND m.is_active = 1
      ORDER BY ma.similarity_score DESC
    `).bind(model.id).all();

    return c.json({ model: model.name, model_slug: model.slug, alternatives: results });
  }

  // All models that have alternatives defined
  const { results } = await c.env.DB.prepare(`
    SELECT DISTINCT m.name, m.slug, m.vendor,
      m.input_price_per_mtok, m.output_price_per_mtok,
      mcs.composite_score,
      (SELECT COUNT(*) FROM model_alternatives ma2 WHERE ma2.model_id = m.id) as alt_count
    FROM models m
    JOIN model_alternatives ma ON ma.model_id = m.id
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
    WHERE m.is_active = 1
    ORDER BY mcs.composite_score DESC
  `).all();

  return c.json({ models: results });
});

// GET /api/models/compare — side-by-side comparison of 2-4 models
modelsRoutes.get('/compare', async (c) => {
  const slugs = c.req.query('models')?.split(',').slice(0, 4);
  if (!slugs?.length) return c.json({ error: 'Provide ?models=slug1,slug2' }, 400);

  const placeholders = slugs.map(() => '?').join(',');

  const { results: models } = await c.env.DB.prepare(`
    SELECT m.*,
      mcs.composite_score, mcs.swe_bench_component, mcs.livecodebench_component,
      mcs.nuance_component, mcs.arena_component, mcs.gpqa_component
    FROM models m
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
    WHERE m.slug IN (${placeholders}) AND m.is_active = 1
  `).bind(...slugs).all();

  // Get benchmarks for these models
  const modelIds = models.map(m => m.id);
  const idPlaceholders = modelIds.map(() => '?').join(',');

  const { results: benchmarks } = await c.env.DB.prepare(`
    SELECT model_id, benchmark_name, category, score, max_score
    FROM benchmarks WHERE model_id IN (${idPlaceholders})
  `).bind(...modelIds).all();

  // Get availability
  const { results: availability } = await c.env.DB.prepare(`
    SELECT ma.model_id, t.name as tool_name, t.slug as tool_slug,
      pp.plan_name, pp.price_monthly, ma.access_level
    FROM model_availability ma
    JOIN tools t ON t.id = ma.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
    WHERE ma.model_id IN (${idPlaceholders})
    ORDER BY pp.price_monthly ASC
  `).bind(...modelIds).all();

  // Index by model
  const benchmarksByModel = {};
  const availByModel = {};
  for (const b of benchmarks) {
    if (!benchmarksByModel[b.model_id]) benchmarksByModel[b.model_id] = [];
    benchmarksByModel[b.model_id].push(b);
  }
  for (const a of availability) {
    if (!availByModel[a.model_id]) availByModel[a.model_id] = [];
    availByModel[a.model_id].push(a);
  }

  const comparison = models.map(m => ({
    ...m,
    benchmarks: benchmarksByModel[m.id] || [],
    availability: availByModel[m.id] || [],
    blended_cost: (m.input_price_per_mtok * 0.3 + m.output_price_per_mtok * 0.7),
  }));

  return c.json({ models: comparison });
});

// GET /api/models/:slug
modelsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const model = await c.env.DB.prepare('SELECT * FROM models WHERE slug = ?').bind(slug).first();
  if (!model) return c.json({ error: 'Not found' }, 404);

  const { results: benchmarkScores } = await c.env.DB.prepare(
    'SELECT * FROM benchmarks WHERE model_id = ?'
  ).bind(model.id).all();

  const { results: availability } = await c.env.DB.prepare(`
    SELECT t.name as tool_name, t.slug as tool_slug, pp.plan_name, pp.price_monthly, ma.access_level
    FROM model_availability ma
    JOIN tools t ON t.id = ma.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
    WHERE ma.model_id = ?
  `).bind(model.id).all();

  return c.json({ ...model, benchmarks: benchmarkScores, availability });
});
