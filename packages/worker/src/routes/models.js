import { Hono } from 'hono';
import { computeVibeCoderFit, summarizeTaskSignals } from '../services/vibe-fit-engine.js';

export const modelsRoutes = new Hono();

const BENCHMARK_COMPONENT_MAP = {
  'SWE-bench Verified': 'swe_bench',
  LiveCodeBench: 'livecodebench',
  'Human Nuance Understanding': 'nuance',
  'Chatbot Arena ELO': 'arena',
  'TAU-bench Retail': 'tau',
  'TAU-bench (retail)': 'tau',
  'TAU-bench (airline)': 'tau',
  'GPQA Diamond': 'gpqa',
  "Humanity's Last Exam": 'hle',
  MMLU: 'mmlu',
  'MMLU Pro': 'mmlu',
  'HumanEval+': 'humaneval',
  HumanEval: 'humaneval',
};

function normalizeBenchmarkComponent(key, score) {
  if (score == null) return null;
  if (key === 'arena') {
    return Number(Math.max(0, Math.min(100, ((score - 1200) / 400) * 100)).toFixed(2));
  }
  return Number(Math.max(0, Math.min(100, score)).toFixed(2));
}

function deriveSuccessRateComponent(taskEstimateMap) {
  const values = Object.values(taskEstimateMap || {})
    .map((entry) => entry?.success_rate)
    .filter((value) => value != null);

  if (!values.length) return null;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Number((average * 100).toFixed(2));
}

const COMPARE_BENCHMARK_BLUEPRINT = [
  { benchmark_name: 'SWE-bench Verified', category: 'coding', component: 'swe_bench', max_score: 100 },
  { benchmark_name: 'LiveCodeBench', category: 'coding', component: 'livecodebench', max_score: 100 },
  { benchmark_name: 'Human Nuance Understanding', category: 'nuance', component: 'nuance', max_score: 100 },
  { benchmark_name: 'Chatbot Arena ELO', category: 'nuance', component: 'arena', max_score: 2000 },
  { benchmark_name: 'TAU-bench Retail', category: 'agentic', component: 'tau', max_score: 100 },
  { benchmark_name: 'GPQA Diamond', category: 'reasoning', component: 'gpqa', max_score: 100 },
  { benchmark_name: "Humanity's Last Exam", category: 'reasoning', component: 'hle', max_score: 100 },
  { benchmark_name: 'MMLU', category: 'reasoning', component: 'mmlu', max_score: 100 },
  { benchmark_name: 'HumanEval+', category: 'coding', component: 'humaneval', max_score: 100 },
];

const SYNTHETIC_TASK_TEMPLATE = {
  'complex-debugging': { successDelta: -0.06, avgMessages: 2.2, avgMinutes: 18, autonomyDelta: -6 },
  'feature-implementation': { successDelta: 0.0, avgMessages: 1.8, avgMinutes: 13, autonomyDelta: 0 },
  'boilerplate-scaffolding': { successDelta: 0.08, avgMessages: 1.2, avgMinutes: 7, autonomyDelta: 8 },
  'quick-fixes': { successDelta: 0.12, avgMessages: 1.1, avgMinutes: 4, autonomyDelta: 12 },
  'multi-file-refactor': { successDelta: -0.1, avgMessages: 2.5, avgMinutes: 25, autonomyDelta: -10 },
  'code-review': { successDelta: 0.02, avgMessages: 1.5, avgMinutes: 10, autonomyDelta: 4 },
  'learning-exploring': { successDelta: 0.04, avgMessages: 1.3, avgMinutes: 7, autonomyDelta: 6 },
};

function clampPercentScore(value, decimals = 2) {
  if (value == null) return null;
  return Number(Math.max(0, Math.min(100, value)).toFixed(decimals));
}

function deriveArenaBenchmarkScore(component) {
  if (component == null) return null;
  return Number((1200 + (component / 100) * 400).toFixed(0));
}

function deriveHleComponent(components) {
  if (components.hle != null && components.hle !== 0) return components.hle;
  if (components.gpqa == null || components.gpqa === 0) return null;
  return clampPercentScore(components.gpqa * 0.21, 1);
}

function deriveMmluComponent(components) {
  if (components.mmlu != null && components.mmlu !== 0) return components.mmlu;
  const inputs = [components.nuance, components.gpqa].filter((value) => value != null && value !== 0);
  if (inputs.length < 2) return null;
  const average = inputs.reduce((sum, value) => sum + value, 0) / inputs.length;
  return clampPercentScore(average + 4, 1);
}

function deriveHumanEvalComponent(components) {
  if (components.humaneval != null && components.humaneval !== 0) return components.humaneval;
  const inputs = [components.swe_bench, components.livecodebench].filter((value) => value != null && value !== 0);
  if (!inputs.length) return null;
  const average = inputs.reduce((sum, value) => sum + value, 0) / inputs.length;
  return clampPercentScore(average + 12, 1);
}

// TAU-bench (tool-use agent tasks) — best proxies are SWE-bench (agentic coding) and Nuance (instruction following).
// Conservative weighting: SWE-bench dominates because both are agentic; subtract 4 to reflect tool-use specificity.
function deriveTauComponent(components) {
  if (components.tau != null && components.tau !== 0) return components.tau;
  const inputs = [
    { v: components.swe_bench, w: 0.6 },
    { v: components.nuance, w: 0.4 },
  ].filter((x) => x.v != null && x.v !== 0);
  if (!inputs.length) return null;
  const totalWeight = inputs.reduce((sum, x) => sum + x.w, 0);
  const weighted = inputs.reduce((sum, x) => sum + x.v * x.w, 0) / totalWeight;
  return clampPercentScore(weighted - 4, 1);
}

// Chatbot Arena ELO — proxies general human preference. Blend of nuance (preference signal),
// MMLU (broad knowledge), and GPQA (reasoning depth). Subtract 6 — derived ELO tends to over-estimate.
function deriveArenaComponent(components) {
  if (components.arena != null && components.arena !== 0) return components.arena;
  const inputs = [
    { v: components.nuance, w: 0.5 },
    { v: components.mmlu, w: 0.3 },
    { v: components.gpqa, w: 0.2 },
  ].filter((x) => x.v != null && x.v !== 0);
  if (!inputs.length) return null;
  const totalWeight = inputs.reduce((sum, x) => sum + x.w, 0);
  const weighted = inputs.reduce((sum, x) => sum + x.v * x.w, 0) / totalWeight;
  return clampPercentScore(weighted - 6, 1);
}

// Final safety net for success_rate when task estimate map is empty — average of measured components.
function deriveSuccessRateFromComponents(components) {
  const inputs = [
    components.swe_bench,
    components.livecodebench,
    components.nuance,
    components.gpqa,
    components.tau,
    components.arena,
  ].filter((value) => value != null && value !== 0);
  if (inputs.length < 2) return null;
  const average = inputs.reduce((sum, value) => sum + value, 0) / inputs.length;
  return clampPercentScore(average - 8, 1);
}

export function buildCompareBenchmarks(benchmarks = [], capabilityProfile = {}) {
  const merged = [...benchmarks];
  const coveredComponents = new Set(
    benchmarks
      .map((benchmark) => BENCHMARK_COMPONENT_MAP[benchmark.benchmark_name])
      .filter(Boolean)
  );

  for (const blueprint of COMPARE_BENCHMARK_BLUEPRINT) {
    if (coveredComponents.has(blueprint.component)) continue;

    const rawScore = blueprint.component === 'arena'
      ? deriveArenaBenchmarkScore(capabilityProfile.arena)
      : capabilityProfile[blueprint.component];

    if (rawScore == null || rawScore === 0) continue;

    merged.push({
      benchmark_name: blueprint.benchmark_name,
      category: blueprint.category,
      score: rawScore,
      max_score: blueprint.max_score,
      estimated: true,
    });
  }

  return merged;
}

function deriveSyntheticSteering(successRate) {
  if (successRate >= 0.78) return 'low';
  if (successRate >= 0.62) return 'medium';
  return 'high';
}

export function buildCompareTaskEstimates(model, capabilityProfile, taskEstimateMap = {}, taskProfiles = []) {
  const hydrated = { ...(taskEstimateMap || {}) };
  const baseSuccessRate = capabilityProfile?.success_rate != null
    ? capabilityProfile.success_rate / 100
    : null;

  if (baseSuccessRate == null) return hydrated;

  for (const taskProfile of taskProfiles) {
    if (hydrated[taskProfile.slug]) continue;

    const template = SYNTHETIC_TASK_TEMPLATE[taskProfile.slug];
    if (!template) continue;

    const successRate = Number(Math.max(0.25, Math.min(0.97, baseSuccessRate + template.successDelta)).toFixed(2));
    const effortPenalty = Math.max(0, 0.82 - successRate);
    const avgMessages = Number((template.avgMessages + (effortPenalty * 4)).toFixed(1));
    const avgMinutes = Number((template.avgMinutes + (effortPenalty * 30)).toFixed(1));
    const autonomyScore = Math.max(25, Math.min(97, Math.round((successRate * 100) + template.autonomyDelta)));
    let costPerTask = null;

    if (model.input_price_per_mtok != null && model.output_price_per_mtok != null) {
      const perMessageCost = (
        ((taskProfile.avg_input_tokens || 0) / 1_000_000) * model.input_price_per_mtok
        + ((taskProfile.avg_output_tokens || 0) / 1_000_000) * model.output_price_per_mtok
      );
      costPerTask = Number((perMessageCost * avgMessages).toFixed(4));
    }

    hydrated[taskProfile.slug] = {
      success_rate: successRate,
      avg_messages: avgMessages,
      avg_minutes: avgMinutes,
      steering_effort: deriveSyntheticSteering(successRate),
      autonomy_score: autonomyScore,
      cost_per_task: costPerTask,
      estimated: true,
    };
  }

  return hydrated;
}

export function buildCapabilityProfile(model, benchmarks = [], taskEstimateMap = {}) {
  const components = {
    swe_bench: model.swe_bench_component,
    livecodebench: model.livecodebench_component,
    nuance: model.nuance_component,
    arena: model.arena_component,
    tau: model.tau_component,
    gpqa: model.gpqa_component,
    hle: model.hle_component,
    mmlu: model.mmlu_component,
    humaneval: model.humaneval_component,
    success_rate: model.success_rate_component,
    community: model.community_adjustment,
  };

  for (const benchmark of benchmarks) {
    const key = BENCHMARK_COMPONENT_MAP[benchmark.benchmark_name];
    if (!key) continue;
    if (components[key] == null || components[key] === 0) {
      components[key] = normalizeBenchmarkComponent(key, benchmark.score);
    }
  }

  if (components.success_rate == null || components.success_rate === 0) {
    components.success_rate = deriveSuccessRateComponent(taskEstimateMap);
  }

  if (components.hle == null || components.hle === 0) {
    components.hle = deriveHleComponent(components);
  }

  if (components.mmlu == null || components.mmlu === 0) {
    components.mmlu = deriveMmluComponent(components);
  }

  if (components.humaneval == null || components.humaneval === 0) {
    components.humaneval = deriveHumanEvalComponent(components);
  }

  // Tau depends on swe_bench + nuance (primary), so order doesn't matter relative to hle/mmlu.
  if (components.tau == null || components.tau === 0) {
    components.tau = deriveTauComponent(components);
  }

  // Arena fallback uses mmlu — must run AFTER mmlu derivation above.
  if (components.arena == null || components.arena === 0) {
    components.arena = deriveArenaComponent(components);
  }

  // Final safety net: if task-estimate path produced nothing, average the measured/derived components.
  if (components.success_rate == null || components.success_rate === 0) {
    components.success_rate = deriveSuccessRateFromComponents(components);
  }

  return components;
}

function applyCapabilityProfileFallbacks(model, benchmarks = [], taskEstimateMap = {}) {
  const capabilityProfile = buildCapabilityProfile(model, benchmarks, taskEstimateMap);

  return {
    ...model,
    swe_bench_component: capabilityProfile.swe_bench,
    livecodebench_component: capabilityProfile.livecodebench,
    nuance_component: capabilityProfile.nuance,
    arena_component: capabilityProfile.arena,
    tau_component: capabilityProfile.tau,
    gpqa_component: capabilityProfile.gpqa,
    hle_component: capabilityProfile.hle,
    mmlu_component: capabilityProfile.mmlu,
    humaneval_component: capabilityProfile.humaneval,
    success_rate_component: capabilityProfile.success_rate,
  };
}

// GET /api/models — all models with latest benchmarks
modelsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT m.*,
      (SELECT json_group_array(json_object(
        'benchmark_name', b.benchmark_name, 'category', b.category,
        'score', b.score, 'max_score', b.max_score,
        'source_url', b.source_url, 'source_trust', b.source_trust
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
    SELECT model_id, benchmark_name, category, score, max_score, source_url, source_trust
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

// GET /api/models/compare — enriched side-by-side comparison of 2-10 models
modelsRoutes.get('/compare', async (c) => {
  const slugs = c.req.query('models')?.split(',').slice(0, 10);
  if (!slugs?.length) return c.json({ error: 'Provide ?models=slug1,slug2' }, 400);

  const placeholders = slugs.map(() => '?').join(',');

  const { results: models } = await c.env.DB.prepare(`
    SELECT m.*,
      mcs.composite_score, mcs.swe_bench_component, mcs.livecodebench_component,
      mcs.nuance_component, mcs.arena_component, mcs.tau_component,
      mcs.gpqa_component, mcs.hle_component, mcs.mmlu_component,
      mcs.humaneval_component, mcs.success_rate_component, mcs.community_adjustment
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
      SELECT model_id, benchmark_name, category, score, max_score, source_url, source_trust
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

    c.env.DB.prepare(`
      SELECT id, name, slug, complexity, avg_input_tokens, avg_output_tokens
      FROM task_profiles
      ORDER BY sort_order
    `).all(),
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
    const rawBenchmarks = benchmarksByModel[m.id] || [];
    const rawTaskEstimates = tasksByModel[m.id] || {};
    const capabilityProfile = buildCapabilityProfile(m, rawBenchmarks, rawTaskEstimates);
    const benchmarks = buildCompareBenchmarks(rawBenchmarks, capabilityProfile);
    const taskEstimates = buildCompareTaskEstimates(m, capabilityProfile, rawTaskEstimates, taskProfileRes.results);
    const hasEstimatedBenchmarks = benchmarks.some((benchmark) => benchmark.estimated);
    const hasEstimatedTasks = Object.values(taskEstimates).some((entry) => entry?.estimated);
    const community = rev ? {
      total_reviews: rev.total_reviews,
      satisfaction: rev.avg_satisfaction,
      sentiment: rev.avg_sentiment,
      heavy_count: rev.heavy_count,
      vibe_count: rev.vibe_count,
      casual_count: rev.casual_count,
    } : {
      total_reviews: 0,
      satisfaction: null,
      sentiment: null,
      heavy_count: 0,
      vibe_count: 0,
      casual_count: 0,
      estimated: true,
    };

    return {
      ...m,
      benchmarks,
      availability: availByModel[m.id] || [],
      blended_cost: (m.input_price_per_mtok * 0.3 + m.output_price_per_mtok * 0.7),
      score_components: capabilityProfile,
      community,
      task_estimates: taskEstimates,
      data_quality: {
        benchmark_coverage: hasEstimatedBenchmarks ? 'estimated' : 'official',
        task_coverage: hasEstimatedTasks ? 'estimated' : 'official',
        community_coverage: rev ? 'official' : 'missing',
      },
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
      mcs.gpqa_component, mcs.hle_component, mcs.mmlu_component,
      mcs.humaneval_component, mcs.success_rate_component, mcs.community_adjustment,
      mcs.updated_at as score_updated_at
    FROM models m
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
    WHERE m.slug = ?
  `).bind(slug).first();
  if (!model) return c.json({ error: 'Not found' }, 404);

  // Parallel queries for all detail data
  const [benchRes, availRes, reviewRes, taskRes, altRes, openrouter, similarRes, alertsRes] = await Promise.all([
    c.env.DB.prepare(
      'SELECT benchmark_name, category, score, max_score, source_url, source_trust FROM benchmarks WHERE model_id = ?'
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

    // Similar models by composite score (±15 range, exclude self)
    model.composite_score != null
      ? c.env.DB.prepare(`
          SELECT m.name, m.slug, m.vendor, m.family,
            m.input_price_per_mtok, m.output_price_per_mtok, m.is_open_weight,
            mcs.composite_score,
            ABS(mcs.composite_score - ?) as score_diff
          FROM models m
          JOIN model_composite_scores mcs ON mcs.model_id = m.id
          WHERE m.is_active = 1 AND m.id != ?
            AND mcs.composite_score BETWEEN ? AND ?
          ORDER BY
            CASE WHEN m.family = ? THEN 0 ELSE 1 END,
            score_diff ASC
          LIMIT 6
        `).bind(
          model.composite_score, model.id,
          model.composite_score - 15, model.composite_score + 15,
          model.family
        ).all()
      : Promise.resolve({ results: [] }),

    // Model-specific alerts (match model name in title or summary)
    c.env.DB.prepare(`
      SELECT id, source, event_type, title, summary, importance, detected_at, source_url
      FROM industry_alerts
      WHERE is_dismissed = 0
        AND (title LIKE ? OR summary LIKE ? OR title LIKE ? OR summary LIKE ?)
      ORDER BY detected_at DESC
      LIMIT 10
    `).bind(
      `%${model.name}%`, `%${model.name}%`,
      `%${model.slug}%`, `%${model.slug}%`
    ).all(),
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
  const taskEstimateMap = Object.fromEntries(
    taskRes.results.map((task) => [task.task_slug, { success_rate: task.first_attempt_success_rate }])
  );
  const hydratedModel = applyCapabilityProfileFallbacks(model, benchRes.results, taskEstimateMap);

  return c.json({
    ...hydratedModel,
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
    similar_models: similarRes.results,
    model_alerts: alertsRes.results,
  });
});
