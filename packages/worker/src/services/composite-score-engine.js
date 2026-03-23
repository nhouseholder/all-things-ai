/**
 * Composite Score Engine v2
 *
 * Computes the AllThingsAI proprietary composite score for all active models.
 * Combines benchmark performance (90% base) with community signal (up to ±5 points).
 *
 * Community scoring is weighted by user type:
 *   - Heavy coders (50% weight): senior devs, infra engineers, ML practitioners
 *   - Vibe coders  (30% weight): indie hackers, vibe coders, fullstack builders
 *   - Casual users (20% weight): general AI users, students, non-coders
 *
 * This weighting reflects our target audience (AI coders) while still
 * incorporating broad community sentiment for a complete picture.
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

// Community score weighting by user type
const COMMUNITY_WEIGHTS = {
  heavy_coder: 0.50,
  vibe_coder:  0.30,
  casual:      0.20,
};

// Max community adjustment range (±5 points on 0-100 scale)
const MAX_COMMUNITY_ADJ = 5.0;

function normalizeBenchmark(key, score) {
  if (key === 'arena') {
    return Math.max(0, Math.min(100, (score - 1200) / 400 * 100)) / 100;
  }
  return score / 100;
}

/**
 * Compute a weighted community adjustment from per-source, per-user-type reviews.
 *
 * For each model, we pull all community_reviews rows and compute:
 *   weighted_satisfaction = Σ (type_satisfaction × type_weight × type_count) / Σ (type_count × type_weight)
 *
 * Then map to adjustment range: (satisfaction/100 × MAX_ADJ*2) - MAX_ADJ
 * So 100 satisfaction → +5.0, 50 → 0.0, 0 → -5.0
 */
function computeCommunityAdjustment(reviewRows) {
  if (!reviewRows || reviewRows.length === 0) return 0;

  let weightedSum = 0;
  let weightedCount = 0;

  for (const row of reviewRows) {
    // Heavy coder signal
    if (row.heavy_coder_count > 0) {
      const w = COMMUNITY_WEIGHTS.heavy_coder * row.heavy_coder_count;
      weightedSum += row.heavy_coder_satisfaction * w;
      weightedCount += w;
    }

    // Vibe coder signal
    if (row.vibe_coder_count > 0) {
      const w = COMMUNITY_WEIGHTS.vibe_coder * row.vibe_coder_count;
      weightedSum += row.vibe_coder_satisfaction * w;
      weightedCount += w;
    }

    // Casual signal
    if (row.casual_count > 0) {
      const w = COMMUNITY_WEIGHTS.casual * row.casual_count;
      weightedSum += row.casual_satisfaction * w;
      weightedCount += w;
    }

    // Fallback: if no per-type breakdown, use aggregate
    if (row.heavy_coder_count === 0 && row.vibe_coder_count === 0 && row.casual_count === 0) {
      if (row.review_count > 0 && row.coding_satisfaction != null) {
        const w = COMMUNITY_WEIGHTS.casual * row.review_count;
        weightedSum += row.coding_satisfaction * w;
        weightedCount += w;
      }
    }
  }

  if (weightedCount === 0) return 0;

  const avgSatisfaction = weightedSum / weightedCount;
  return (avgSatisfaction / 100 * MAX_COMMUNITY_ADJ * 2) - MAX_COMMUNITY_ADJ;
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
    benchmarkIndex[`${b.model_id}:${b.benchmark_name}`] = b.score;
  }

  // 3. Community reviews with per-type breakdown, grouped by model
  const { results: reviewRows } = await env.DB.prepare(`
    SELECT model_id, source, sentiment_score, coding_satisfaction, review_count,
           COALESCE(casual_sentiment, 0) as casual_sentiment,
           COALESCE(casual_satisfaction, 50) as casual_satisfaction,
           COALESCE(casual_count, 0) as casual_count,
           COALESCE(vibe_coder_sentiment, 0) as vibe_coder_sentiment,
           COALESCE(vibe_coder_satisfaction, 50) as vibe_coder_satisfaction,
           COALESCE(vibe_coder_count, 0) as vibe_coder_count,
           COALESCE(heavy_coder_sentiment, 0) as heavy_coder_sentiment,
           COALESCE(heavy_coder_satisfaction, 50) as heavy_coder_satisfaction,
           COALESCE(heavy_coder_count, 0) as heavy_coder_count
    FROM community_reviews
  `).all();

  const reviewsByModel = {};
  for (const r of reviewRows) {
    if (!reviewsByModel[r.model_id]) reviewsByModel[r.model_id] = [];
    reviewsByModel[r.model_id].push(r);
  }

  // 4. Avg first_attempt_success_rate per model from model_task_estimates
  const { results: successRows } = await env.DB.prepare(
    'SELECT model_id, AVG(first_attempt_success_rate) as avg_success FROM model_task_estimates GROUP BY model_id'
  ).all();

  const successByModel = {};
  for (const r of successRows) {
    successByModel[r.model_id] = r.avg_success;
  }

  // 5. Compute composite score for each model
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
    if (!available.length) continue;

    const totalWeight = available.reduce((s, [, w]) => s + w, 0);
    const normalized = available.map(([k, w]) => [k, w / totalWeight]);

    // Weighted sum (each component is 0-1, multiply by 100 for final scale)
    let weightedSum = 0;
    for (const [k, nw] of normalized) {
      weightedSum += components[k] * nw * 100;
    }

    // Community adjustment: weighted by user type
    const modelReviews = reviewsByModel[model.id] || [];
    const communityAdj = computeCommunityAdjustment(modelReviews);

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
