import { Hono } from 'hono';
import { computeVibeCoderFit, summarizeTaskSignals } from '../services/vibe-fit-engine.js';

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

// GET /api/models/compare — enriched side-by-side comparison of 2-4 models
modelsRoutes.get('/compare', async (c) => {
  const slugs = c.req.query('models')?.split(',').slice(0, 4);
  if (!slugs?.length) return c.json({ error: 'Provide ?models=slug1,slug2' }, 400);

  const placeholders = slugs.map(() => '?').join(',');

  const { results: models } = await c.env.DB.prepare(`
    SELECT m.*,
      mcs.composite_score, mcs.swe_bench_component, mcs.livecodebench_component,
      mcs.nuance_component, mcs.arena_component, mcs.tau_component,
      mcs.gpqa_component, mcs.success_rate_component, mcs.community_adjustment
    FROM models m
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
    WHERE m.slug IN (${placeholders}) AND m.is_active = 1
  `).bind(...slugs).all();

  const modelIds = models.map(m => m.id);
  if (!modelIds.length) return c.json({ models: [], task_profiles: [] });
  const idPlaceholders = modelIds.map(() => '?').join(',');

  // Parallel queries: benchmarks, availability, community reviews, task estimates, task profiles
  const [benchRes, availRes, reviewRes, taskEstRes, taskProfileRes] = await Promise.all([
    c.env.DB.prepare(`
      SELECT model_id, benchmark_name, category, score, max_score
      FROM benchmarks WHERE model_id IN (${idPlaceholders})
    `).bind(...modelIds).all(),

    c.env.DB.prepare(`
      SELECT ma.model_id, t.name as tool_name, t.slug as tool_slug,
        pp.plan_name, pp.price_monthly, ma.access_level,
        ma.cost_notes, ma.credits_per_request,
        pp.usage_notes, pp.overage_rate_description, pp.overage_model
      FROM model_availability ma
      JOIN tools t ON t.id = ma.tool_id
      LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
      WHERE ma.model_id IN (${idPlaceholders})
      ORDER BY pp.price_monthly ASC
    `).bind(...modelIds).all(),

    c.env.DB.prepare(`
      SELECT model_id,
        SUM(review_count) as total_reviews,
        ROUND(AVG(coding_satisfaction), 1) as avg_satisfaction,
        ROUND(AVG(sentiment_score), 2) as avg_sentiment,
        SUM(COALESCE(heavy_coder_count, 0)) as heavy_count,
        SUM(COALESCE(vibe_coder_count, 0)) as vibe_count,
        SUM(COALESCE(casual_count, 0)) as casual_count
      FROM community_reviews
      WHERE model_id IN (${idPlaceholders})
      GROUP BY model_id
    `).bind(...modelIds).all(),

    c.env.DB.prepare(`
      SELECT mte.model_id, mte.task_profile_id,
        tp.name as task_name, tp.slug as task_slug,
        mte.first_attempt_success_rate, mte.avg_messages_to_complete,
        mte.avg_minutes_to_complete, mte.steering_effort,
        mte.autonomy_score, mte.cost_per_task_estimate, mte.time_value_per_task
      FROM model_task_estimates mte
      JOIN task_profiles tp ON tp.id = mte.task_profile_id
      WHERE mte.model_id IN (${idPlaceholders})
      ORDER BY tp.sort_order
    `).bind(...modelIds).all(),

    c.env.DB.prepare('SELECT id, name, slug, complexity FROM task_profiles ORDER BY sort_order').all(),
  ]);

  // Index all data by model_id
  const benchmarksByModel = {};
  const availByModel = {};
  const reviewByModel = {};
  const tasksByModel = {};

  for (const b of benchRes.results) {
    (benchmarksByModel[b.model_id] ??= []).push(b);
  }
  for (const a of availRes.results) {
    (availByModel[a.model_id] ??= []).push(a);
  }
  for (const r of reviewRes.results) {
    reviewByModel[r.model_id] = r;
  }
  for (const t of taskEstRes.results) {
    if (!tasksByModel[t.model_id]) tasksByModel[t.model_id] = {};
    tasksByModel[t.model_id][t.task_slug] = {
      success_rate: t.first_attempt_success_rate,
      avg_messages: t.avg_messages_to_complete,
      avg_minutes: t.avg_minutes_to_complete,
      steering_effort: t.steering_effort,
      autonomy_score: t.autonomy_score,
      cost_per_task: t.cost_per_task_estimate,
      time_value: t.time_value_per_task,
    };
  }

  const comparison = models.map(m => {
    const rev = reviewByModel[m.id];
    return {
      ...m,
      benchmarks: benchmarksByModel[m.id] || [],
      availability: availByModel[m.id] || [],
      blended_cost: (m.input_price_per_mtok * 0.3 + m.output_price_per_mtok * 0.7),
      score_components: {
        swe_bench: m.swe_bench_component,
        livecodebench: m.livecodebench_component,
        nuance: m.nuance_component,
        arena: m.arena_component,
        tau: m.tau_component,
        gpqa: m.gpqa_component,
        success_rate: m.success_rate_component,
        community: m.community_adjustment,
      },
      community: rev ? {
        total_reviews: rev.total_reviews,
        satisfaction: rev.avg_satisfaction,
        sentiment: rev.avg_sentiment,
        heavy_count: rev.heavy_count,
        vibe_count: rev.vibe_count,
        casual_count: rev.casual_count,
      } : null,
      task_estimates: tasksByModel[m.id] || {},
    };
  });

  return c.json({ models: comparison, task_profiles: taskProfileRes.results });
});

// GET /api/models/:slug — enriched model detail
modelsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const model = await c.env.DB.prepare(`
    SELECT m.*,
      mcs.composite_score, mcs.swe_bench_component, mcs.livecodebench_component,
      mcs.nuance_component, mcs.arena_component, mcs.tau_component,
      mcs.gpqa_component, mcs.success_rate_component, mcs.community_adjustment,
      mcs.updated_at as score_updated_at
    FROM models m
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
    WHERE m.slug = ?
  `).bind(slug).first();
  if (!model) return c.json({ error: 'Not found' }, 404);

  // Parallel queries for all detail data
  const [benchRes, availRes, reviewRes, taskRes, altRes, openrouter] = await Promise.all([
    c.env.DB.prepare(
      'SELECT benchmark_name, category, score, max_score FROM benchmarks WHERE model_id = ?'
    ).bind(model.id).all(),

    c.env.DB.prepare(`
      SELECT t.name as tool_name, t.slug as tool_slug,
        pp.plan_name, pp.price_monthly, ma.access_level,
        ma.cost_notes, ma.credits_per_request,
        pp.usage_notes, pp.overage_rate_description, pp.overage_model
      FROM model_availability ma
      JOIN tools t ON t.id = ma.tool_id
      LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
      WHERE ma.model_id = ?
      ORDER BY pp.price_monthly ASC
    `).bind(model.id).all(),

    c.env.DB.prepare(`
      SELECT source,
        SUM(review_count) as review_count,
        ROUND(AVG(coding_satisfaction), 1) as satisfaction,
        ROUND(AVG(sentiment_score), 2) as sentiment,
        ROUND(
          SUM(COALESCE(vibe_coder_satisfaction, 0) * COALESCE(vibe_coder_count, 0))
          / NULLIF(SUM(COALESCE(vibe_coder_count, 0)), 0),
          1
        ) as vibe_satisfaction,
        SUM(COALESCE(heavy_coder_count, 0)) as heavy_count,
        SUM(COALESCE(vibe_coder_count, 0)) as vibe_count,
        SUM(COALESCE(casual_count, 0)) as casual_count,
        MAX(last_scraped) as last_updated_at
      FROM community_reviews
      WHERE model_id = ?
      GROUP BY source
    `).bind(model.id).all(),

    c.env.DB.prepare(`
      SELECT tp.name as task_name, tp.slug as task_slug, tp.complexity,
        mte.first_attempt_success_rate, mte.avg_messages_to_complete,
        mte.avg_minutes_to_complete, mte.steering_effort,
        mte.autonomy_score, mte.cost_per_task_estimate, mte.time_value_per_task
      FROM model_task_estimates mte
      JOIN task_profiles tp ON tp.id = mte.task_profile_id
      WHERE mte.model_id = ?
      ORDER BY tp.sort_order
    `).bind(model.id).all(),

    c.env.DB.prepare(`
      SELECT m.name, m.slug, m.vendor, m.family,
        m.input_price_per_mtok, m.output_price_per_mtok,
        ma.similarity_score, ma.cost_savings_pct, ma.trade_off_notes,
        mcs.composite_score
      FROM model_alternatives ma
      JOIN models m ON m.id = ma.alternative_model_id
      LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
      WHERE ma.model_id = ? AND m.is_active = 1
      ORDER BY ma.similarity_score DESC
    `).bind(model.id).all(),

    c.env.DB.prepare(`
      SELECT *
      FROM model_openrouter_stats
      WHERE model_id = ?
    `).bind(model.id).first(),
  ]);

  // Compute blended cost + bang_for_buck
  const blendedCost = model.input_price_per_mtok != null && model.output_price_per_mtok != null
    ? (model.input_price_per_mtok * 0.3 + model.output_price_per_mtok * 0.7)
    : null;

  // Community totals
  const communityTotal = reviewRes.results.reduce((acc, r) => ({
    total_reviews: acc.total_reviews + (r.review_count || 0),
    sources: acc.sources + 1,
    heavy: acc.heavy + (r.heavy_count || 0),
    vibe: acc.vibe + (r.vibe_count || 0),
    casual: acc.casual + (r.casual_count || 0),
  }), { total_reviews: 0, sources: 0, heavy: 0, vibe: 0, casual: 0 });

  const avgSatisfaction = communityTotal.total_reviews > 0
    ? reviewRes.results.reduce((sum, r) => sum + ((r.satisfaction || 0) * (r.review_count || 0)), 0) / communityTotal.total_reviews
    : null;
  const vibeSatisfaction = communityTotal.vibe > 0
    ? reviewRes.results.reduce((sum, r) => sum + ((r.vibe_satisfaction || 0) * (r.vibe_count || 0)), 0) / communityTotal.vibe
    : null;
  const taskSignals = summarizeTaskSignals(taskRes.results);
  const vibeProfile = computeVibeCoderFit({
    model,
    openrouter,
    taskSignals,
    community: {
      satisfaction: avgSatisfaction,
      vibe_satisfaction: vibeSatisfaction,
    },
  });

  return c.json({
    ...model,
    blended_cost_per_mtok: blendedCost ? Number(blendedCost.toFixed(4)) : null,
    benchmarks: benchRes.results,
    availability: availRes.results,
    community: {
      total_reviews: communityTotal.total_reviews,
      source_count: communityTotal.sources,
      satisfaction: avgSatisfaction ? Number(avgSatisfaction.toFixed(1)) : null,
      vibe_satisfaction: vibeSatisfaction ? Number(vibeSatisfaction.toFixed(1)) : null,
      heavy_coder_count: communityTotal.heavy,
      vibe_coder_count: communityTotal.vibe,
      casual_count: communityTotal.casual,
      by_source: reviewRes.results,
    },
    task_estimates: taskRes.results,
    alternatives: altRes.results,
    openrouter: openrouter ? {
      ...openrouter,
      input_modalities: JSON.parse(openrouter.input_modalities || '[]'),
      output_modalities: JSON.parse(openrouter.output_modalities || '[]'),
      total_activity_tokens_daily: Number(openrouter.prompt_tokens_daily || 0)
        + Number(openrouter.reasoning_tokens_daily || 0)
        + Number(openrouter.completion_tokens_daily || 0),
    } : null,
    vibe_coder_profile: vibeProfile,
  });
});
