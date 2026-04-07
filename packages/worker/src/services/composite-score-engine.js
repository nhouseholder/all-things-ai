/**
 * Composite Score Engine v3
 *
 * Computes the AllThingsAI proprietary composite score for all active models.
 * Combines benchmark performance with community signal, using statistical
 * safeguards to prevent skew from low-N or outlier reviews.
 *
 * Community scoring pipeline:
 *   1. Weighted by user type (heavy 50%, vibe 30%, casual 20%)
 *   2. Minimum-N threshold: no adjustment below 10 total reviews
 *   3. Confidence scaling: full weight at 50+ reviews, linear ramp below
 *   4. Outlier protection: individual source capped at ±1.5 std dev from mean
 *   5. Multi-source requirement: at least 2 sources needed for full confidence
 *
 * Max community adjustment: ±7.5 points at full confidence (50+ reviews, 2+ sources)
 * At low N (10-49 reviews): scaled proportionally down to ±0
 */

const BENCHMARK_MAP = {
  swe:          { benchmark_name: 'SWE-bench Verified',        weight: 0.20 },
  livecodebench:{ benchmark_name: 'LiveCodeBench',             weight: 0.12 },
  nuance:       { benchmark_name: 'Human Nuance Understanding',weight: 0.12 },
  arena:        { benchmark_name: 'Chatbot Arena ELO',         weight: 0.08 },
  tau:          { benchmark_name: 'TAU-bench Retail',           weight: 0.08 },
  gpqa:         { benchmark_name: 'GPQA Diamond',              weight: 0.08 },
  hle:          { benchmark_name: "Humanity's Last Exam",      weight: 0.12 },
  mmlu:         { benchmark_name: 'MMLU',                      weight: 0.08 },
  humaneval:    { benchmark_name: 'HumanEval+',                weight: 0.05 },
};

const SUCCESS_WEIGHT = 0.07;

// Community score weighting by user type
const COMMUNITY_WEIGHTS = {
  heavy_coder: 0.50,
  vibe_coder:  0.30,
  casual:      0.20,
};

// ── Statistical safeguards ──────────────────────────────────────────────
const MIN_REVIEWS_THRESHOLD = 10;   // Below this: 0 community adjustment
const FULL_CONFIDENCE_N = 50;       // At or above: full community weight
const MIN_SOURCES_FULL = 2;         // Need 2+ sources for full confidence
const MAX_COMMUNITY_ADJ = 5.0;     // ±5.0 points at full confidence
const OUTLIER_CAP_SIGMA = 1.5;     // Cap per-source at ±1.5σ from cross-source mean

function normalizeBenchmark(key, score) {
  if (key === 'arena') {
    return Math.max(0, Math.min(100, (score - 1200) / 400 * 100)) / 100;
  }
  return score / 100;
}

/**
 * Compute per-source weighted satisfaction (by user type)
 */
function sourceWeightedSatisfaction(row) {
  let weightedSum = 0;
  let weightedCount = 0;

  if (row.heavy_coder_count > 0) {
    const w = COMMUNITY_WEIGHTS.heavy_coder * row.heavy_coder_count;
    weightedSum += row.heavy_coder_satisfaction * w;
    weightedCount += w;
  }
  if (row.vibe_coder_count > 0) {
    const w = COMMUNITY_WEIGHTS.vibe_coder * row.vibe_coder_count;
    weightedSum += row.vibe_coder_satisfaction * w;
    weightedCount += w;
  }
  if (row.casual_count > 0) {
    const w = COMMUNITY_WEIGHTS.casual * row.casual_count;
    weightedSum += row.casual_satisfaction * w;
    weightedCount += w;
  }

  // Fallback: old-format rows without per-type breakdown
  if (weightedCount === 0 && row.review_count > 0 && row.coding_satisfaction != null) {
    return { satisfaction: row.coding_satisfaction, count: row.review_count };
  }

  if (weightedCount === 0) return { satisfaction: 50, count: 0 };
  return {
    satisfaction: weightedSum / weightedCount,
    count: (row.heavy_coder_count || 0) + (row.vibe_coder_count || 0) + (row.casual_count || 0),
  };
}

/**
 * Compute community adjustment with full statistical safeguards.
 * Returns { adjustment, confidence, totalReviews, sourceCount, details }
 */
function computeCommunityAdjustment(reviewRows) {
  const noAdj = { adjustment: 0, confidence: 0, totalReviews: 0, sourceCount: 0, details: 'no reviews' };
  if (!reviewRows || reviewRows.length === 0) return noAdj;

  // Step 1: compute per-source satisfaction scores
  const sourceSats = [];
  let totalReviews = 0;

  for (const row of reviewRows) {
    const { satisfaction, count } = sourceWeightedSatisfaction(row);
    totalReviews += count || row.review_count || 0;
    if ((count || row.review_count || 0) > 0) {
      sourceSats.push({ source: row.source, satisfaction, count: count || row.review_count });
    }
  }

  const sourceCount = sourceSats.length;

  // Step 2: minimum-N gate
  if (totalReviews < MIN_REVIEWS_THRESHOLD) {
    return { adjustment: 0, confidence: 0, totalReviews, sourceCount, details: `below min N (${totalReviews}/${MIN_REVIEWS_THRESHOLD})` };
  }

  // Step 3: outlier protection — cap per-source satisfaction at ±1.5σ from mean
  if (sourceSats.length >= 3) {
    const mean = sourceSats.reduce((s, x) => s + x.satisfaction, 0) / sourceSats.length;
    const variance = sourceSats.reduce((s, x) => s + (x.satisfaction - mean) ** 2, 0) / sourceSats.length;
    const stddev = Math.sqrt(variance);

    if (stddev > 0) {
      const lowerBound = mean - OUTLIER_CAP_SIGMA * stddev;
      const upperBound = mean + OUTLIER_CAP_SIGMA * stddev;
      for (const s of sourceSats) {
        s.satisfaction = Math.max(lowerBound, Math.min(upperBound, s.satisfaction));
      }
    }
  }

  // Step 4: weighted average across sources (by review count)
  let weightedSum = 0;
  let weightedCount = 0;
  for (const s of sourceSats) {
    weightedSum += s.satisfaction * s.count;
    weightedCount += s.count;
  }

  if (weightedCount === 0) return noAdj;
  const avgSatisfaction = weightedSum / weightedCount;

  // Step 5: confidence scaling
  // Factor 1: review count (linear ramp from MIN to FULL)
  const nFactor = Math.min(1, (totalReviews - MIN_REVIEWS_THRESHOLD) / (FULL_CONFIDENCE_N - MIN_REVIEWS_THRESHOLD));

  // Factor 2: source diversity (1 source = 0.6, 2+ sources = 1.0)
  const sourceFactor = sourceCount >= MIN_SOURCES_FULL ? 1.0 : 0.6;

  const confidence = Math.min(1, nFactor * sourceFactor);

  // Step 6: compute raw adjustment then scale by confidence
  // Map satisfaction 0-100 → raw adjustment -MAX to +MAX
  const rawAdj = (avgSatisfaction / 100 * MAX_COMMUNITY_ADJ * 2) - MAX_COMMUNITY_ADJ;
  const adjustment = rawAdj * confidence;

  const details = `N=${totalReviews}, sources=${sourceCount}, conf=${(confidence * 100).toFixed(0)}%, sat=${avgSatisfaction.toFixed(1)}`;

  return {
    adjustment: Number(adjustment.toFixed(3)),
    confidence: Number(confidence.toFixed(3)),
    totalReviews,
    sourceCount,
    avgSatisfaction: Number(avgSatisfaction.toFixed(1)),
    details,
  };
}

export async function computeCompositeScores(env) {
  // 1. Get all active models (with family for intra-family ordering)
  const { results: models } = await env.DB.prepare(
    'SELECT id, name, vendor, family FROM models WHERE is_active = 1'
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

  // 5. Compute composite score for each model (first pass — raw scores)
  const scoreEntries = [];

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
    const baseWeights = {};
    for (const [k, cfg] of Object.entries(BENCHMARK_MAP)) {
      baseWeights[k] = cfg.weight;
    }
    baseWeights.success = SUCCESS_WEIGHT;

    const available = Object.entries(baseWeights).filter(([k]) => components[k] != null);
    if (!available.length) continue;

    const totalWeight = available.reduce((s, [, w]) => s + w, 0);
    const normalized = available.map(([k, w]) => [k, w / totalWeight]);

    let weightedSum = 0;
    for (const [k, nw] of normalized) {
      weightedSum += components[k] * nw * 100;
    }

    // Community adjustment with statistical safeguards
    const modelReviews = reviewsByModel[model.id] || [];
    const community = computeCommunityAdjustment(modelReviews);

    const compositeScore = Math.max(0, Math.min(100, weightedSum + community.adjustment));

    scoreEntries.push({
      model,
      components,
      benchmarkScore: weightedSum,
      community,
      compositeScore,
    });

    if (community.totalReviews > 0) {
      console.log(`[COMPOSITE] ${model.name}: bench=${weightedSum.toFixed(2)}, adj=${community.adjustment.toFixed(2)}, final=${compositeScore.toFixed(2)}, ${community.details}`);
    }
  }

  // 6. Family-aware ordering fix: community noise must not invert benchmark order
  // within the same vendor+family (e.g., GPT-5.4 High > Medium by benchmarks)
  const familyGroups = {};
  for (const entry of scoreEntries) {
    const key = `${entry.model.vendor}:${entry.model.family || ''}`;
    if (!familyGroups[key]) familyGroups[key] = [];
    familyGroups[key].push(entry);
  }

  for (const [familyKey, members] of Object.entries(familyGroups)) {
    if (members.length < 2) continue;

    // Sort by raw benchmark score (no community) descending
    const byBenchmark = [...members].sort((a, b) => b.benchmarkScore - a.benchmarkScore);
    // Sort by composite score descending
    const byComposite = [...members].sort((a, b) => b.compositeScore - a.compositeScore);

    // Check for inversions: if benchmark order disagrees with composite order
    for (let i = 0; i < byBenchmark.length; i++) {
      const benchModel = byBenchmark[i];
      const compositeIdx = byComposite.findIndex(m => m.model.id === benchModel.model.id);

      if (compositeIdx > i) {
        // This model ranks LOWER in composite than its benchmark position warrants
        // A sibling with worse benchmarks outranks it due to community buzz
        // Fix: ensure the composite score is at least as high as the sibling below it
        const siblingAbove = byComposite[compositeIdx - 1];
        if (siblingAbove && siblingAbove.benchmarkScore < benchModel.benchmarkScore) {
          const oldScore = benchModel.compositeScore;
          benchModel.compositeScore = siblingAbove.compositeScore + 0.1;
          console.log(`[COMPOSITE] FAMILY FIX: ${benchModel.model.name} ${oldScore.toFixed(2)} → ${benchModel.compositeScore.toFixed(2)} (was below ${siblingAbove.model.name} despite higher benchmarks)`);
        }
      }
    }
  }

  // 6b. Cross-vendor proximity guard: if two models from different vendors are
  // within 2 points on raw benchmarks, community adjustment cannot flip their order.
  // This prevents hype from overriding benchmark data for near-tied models.
  const CROSS_VENDOR_PROXIMITY = 2.0;
  const byBenchmarkGlobal = [...scoreEntries].sort((a, b) => b.benchmarkScore - a.benchmarkScore);
  const byCompositeGlobal = [...scoreEntries].sort((a, b) => b.compositeScore - a.compositeScore);

  for (let i = 0; i < byBenchmarkGlobal.length; i++) {
    const benchModel = byBenchmarkGlobal[i];
    const compositeIdx = byCompositeGlobal.findIndex(m => m.model.id === benchModel.model.id);

    if (compositeIdx > i) {
      // This model is ranked lower in composite than its benchmark position
      // Check if it was flipped by a cross-vendor model within the proximity threshold
      for (let j = i; j < compositeIdx; j++) {
        const rival = byCompositeGlobal[j];
        if (rival.model.vendor === benchModel.model.vendor) continue; // same vendor = handled by family fix
        const benchGap = Math.abs(benchModel.benchmarkScore - rival.benchmarkScore);
        if (benchGap <= CROSS_VENDOR_PROXIMITY && rival.benchmarkScore < benchModel.benchmarkScore) {
          const oldScore = benchModel.compositeScore;
          benchModel.compositeScore = rival.compositeScore + 0.05;
          console.log(`[COMPOSITE] CROSS-VENDOR FIX: ${benchModel.model.name} ${oldScore.toFixed(2)} → ${benchModel.compositeScore.toFixed(2)} (was below ${rival.model.name} despite higher benchmarks within ${benchGap.toFixed(1)}pt)`);
        }
      }
    }
  }

  // 7. Write to database
  const insertStmt = env.DB.prepare(`
    INSERT OR REPLACE INTO model_composite_scores
      (model_id, composite_score, swe_bench_component, livecodebench_component,
       nuance_component, arena_component, tau_component, gpqa_component,
       hle_component, mmlu_component, humaneval_component,
       success_rate_component, community_adjustment, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const batch = [];
  let topModel = null;
  let topScore = -1;

  for (const entry of scoreEntries) {
    const { model, components, community, compositeScore } = entry;

    batch.push(insertStmt.bind(
      model.id,
      Number(compositeScore.toFixed(2)),
      components.swe != null ? Number((components.swe * 100).toFixed(2)) : null,
      components.livecodebench != null ? Number((components.livecodebench * 100).toFixed(2)) : null,
      components.nuance != null ? Number((components.nuance * 100).toFixed(2)) : null,
      components.arena != null ? Number((components.arena * 100).toFixed(2)) : null,
      components.tau != null ? Number((components.tau * 100).toFixed(2)) : null,
      components.gpqa != null ? Number((components.gpqa * 100).toFixed(2)) : null,
      components.hle != null ? Number((components.hle * 100).toFixed(2)) : null,
      components.mmlu != null ? Number((components.mmlu * 100).toFixed(2)) : null,
      components.humaneval != null ? Number((components.humaneval * 100).toFixed(2)) : null,
      components.success != null ? Number((components.success * 100).toFixed(2)) : null,
      Number(community.adjustment.toFixed(2))
    ));

    if (compositeScore > topScore) {
      topScore = compositeScore;
      topModel = model.name;
    }
  }

  if (batch.length) {
    await env.DB.batch(batch);
  }

  console.log(`[COMPOSITE] v3.1: Computed scores for ${scoreEntries.length} models, top: ${topModel} (${topScore.toFixed(2)})`);
}
