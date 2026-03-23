/**
 * Composite Score Engine
 * Computes the AllThingsAI composite score for all active models
 * and stores results in model_composite_scores table.
 */

const BENCHMARK_MAP = {
  swe:          { benchmark_name: 'SWE-bench Verified',        weight: 0.25 },
  livecodebench:{ benchmark_name: 'LiveCodeBench',             weight: 0.15 },
  nuance:       { benchmark_name: 'Human Nuance Understanding',weight: 0.20 },
  arena:        { benchmark_name: 'Chatbot Arena ELO',         weight: 0.10 },
  tau:          { benchmark_name: 'TAU-bench Retail',           weight: 0.10 },
  gpqa:         { benchmark_name: 'GPQA Diamond',              weight: 0.10 },
};

const SUCCESS_WEIGHT = 0.10;

function normalizeBenchmark(key, score) {
  if (key === 'arena') {
    return Math.max(0, Math.min(100, (score - 1200) / 400 * 100)) / 100;
  }
  return score / 100;
}

export async function computeCompositeScores(env) {
  // 1. Get all active models
  const { results: models } = await env.DB.prepare(
    'SELECT id, name FROM models WHERE is_active = 1'
  ).all();

  if (!models.length) {
    console.log('[COMPOSITE] No active models found');
    return;
  }

  // 2. Get all benchmarks indexed by model_id + benchmark_name
  const { results: allBenchmarks } = await env.DB.prepare(
    'SELECT model_id, benchmark_name, score FROM benchmarks'
  ).all();

  const benchmarkIndex = {};
  for (const b of allBenchmarks) {
    const key = `${b.model_id}:${b.benchmark_name}`;
    benchmarkIndex[key] = b.score;
  }

  // 3. Avg coding_satisfaction per model from community_reviews
  const { results: reviewRows } = await env.DB.prepare(
    'SELECT model_id, AVG(coding_satisfaction) as avg_satisfaction FROM community_reviews GROUP BY model_id'
  ).all();

  const satisfactionByModel = {};
  for (const r of reviewRows) {
    satisfactionByModel[r.model_id] = r.avg_satisfaction;
  }

  // 4. Avg first_attempt_success_rate per model from model_task_estimates
  const { results: successRows } = await env.DB.prepare(
    'SELECT model_id, AVG(first_attempt_success_rate) as avg_success FROM model_task_estimates GROUP BY model_id'
  ).all();

  const successByModel = {};
  for (const r of successRows) {
    successByModel[r.model_id] = r.avg_success;
  }

  // 5-9. Compute composite score for each model
  let topModel = null;
  let topScore = -1;
  let computed = 0;

  const insertStmt = env.DB.prepare(`
    INSERT OR REPLACE INTO model_composite_scores
      (model_id, composite_score, swe_bench_component, livecodebench_component,
       nuance_component, arena_component, tau_component, gpqa_component,
       success_rate_component, community_adjustment, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const batch = [];

  for (const model of models) {
    const components = {};

    // Benchmark components
    for (const [key, cfg] of Object.entries(BENCHMARK_MAP)) {
      const raw = benchmarkIndex[`${model.id}:${cfg.benchmark_name}`];
      if (raw != null) {
        components[key] = normalizeBenchmark(key, raw);
      }
    }

    // Success rate component
    const avgSuccess = successByModel[model.id];
    if (avgSuccess != null) {
      components.success = avgSuccess;
    }

    // Build weights for available components only
    const baseWeights = {
      swe: 0.25, livecodebench: 0.15, nuance: 0.20,
      arena: 0.10, tau: 0.10, gpqa: 0.10, success: SUCCESS_WEIGHT,
    };

    const available = Object.entries(baseWeights).filter(([k]) => components[k] != null);
    if (!available.length) {
      // No data at all for this model, skip
      continue;
    }

    const totalWeight = available.reduce((s, [, w]) => s + w, 0);
    const normalized = available.map(([k, w]) => [k, w / totalWeight]);

    // Weighted sum (each component is 0-1, multiply by 100 for final scale)
    let weightedSum = 0;
    for (const [k, nw] of normalized) {
      weightedSum += components[k] * nw * 100;
    }

    // Community adjustment: range -2.5 to +2.5
    const avgSatisfaction = satisfactionByModel[model.id];
    let communityAdj = 0;
    if (avgSatisfaction != null) {
      communityAdj = (avgSatisfaction / 100 * 5) - 2.5;
    }

    const compositeScore = Math.max(0, Math.min(100, weightedSum + communityAdj));

    batch.push(insertStmt.bind(
      model.id,
      Number(compositeScore.toFixed(2)),
      components.swe != null ? Number((components.swe * 100).toFixed(2)) : null,
      components.livecodebench != null ? Number((components.livecodebench * 100).toFixed(2)) : null,
      components.nuance != null ? Number((components.nuance * 100).toFixed(2)) : null,
      components.arena != null ? Number((components.arena * 100).toFixed(2)) : null,
      components.tau != null ? Number((components.tau * 100).toFixed(2)) : null,
      components.gpqa != null ? Number((components.gpqa * 100).toFixed(2)) : null,
      components.success != null ? Number((components.success * 100).toFixed(2)) : null,
      Number(communityAdj.toFixed(2))
    ));

    computed++;
    if (compositeScore > topScore) {
      topScore = compositeScore;
      topModel = model.name;
    }
  }

  if (batch.length) {
    await env.DB.batch(batch);
  }

  console.log(`[COMPOSITE] Computed scores for ${computed} models, top: ${topModel} (${topScore.toFixed(2)})`);
}
