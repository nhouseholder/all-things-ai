/**
 * Tool Score Engine v1
 *
 * Computes composite scores for IDE/CLI coding tools (Cursor, Claude Code, etc.)
 * Mirrors the model composite-score-engine pattern.
 *
 * Dimensions:
 *   Model breadth  25% — count of supported models via model_availability
 *   Pricing        20% — inverse of cheapest plan (lower price = higher score)
 *   Community      25% — weighted satisfaction from tool_reviews
 *   Features       15% — % of standard features supported
 *   Freshness      15% — recency of last_release_date
 */

const WEIGHTS = {
  model_breadth: 0.25,
  pricing:       0.20,
  community:     0.25,
  features:      0.15,
  freshness:     0.15,
};

/**
 * Min-max normalize an array of { id, value } objects.
 * Returns map of id → normalized 0-1 value.
 */
function minMaxNormalize(items) {
  if (!items.length) return {};
  const values = items.map(i => i.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const result = {};
  for (const item of items) {
    result[item.id] = (item.value - min) / range;
  }
  return result;
}

export async function computeToolScores(env) {
  // 1. Get all tools
  const { results: tools } = await env.DB.prepare(
    'SELECT id, name, slug, last_release_date FROM tools ORDER BY name'
  ).all();

  if (!tools.length) {
    console.log('[TOOL-SCORE] No tools found');
    return;
  }

  const toolIds = tools.map(t => t.id);

  // 2. Model breadth — count distinct models per tool
  const { results: breadthRows } = await env.DB.prepare(`
    SELECT tool_id, COUNT(DISTINCT model_id) as model_count
    FROM model_availability
    GROUP BY tool_id
  `).all();
  const breadthMap = {};
  for (const r of breadthRows) breadthMap[r.tool_id] = r.model_count;
  const breadthNorm = minMaxNormalize(
    toolIds.map(id => ({ id, value: breadthMap[id] || 0 }))
  );

  // 3. Pricing — lowest monthly price per tool (inverse: cheaper = better)
  const { results: priceRows } = await env.DB.prepare(`
    SELECT tool_id, MIN(price_monthly) as min_price
    FROM pricing_plans
    WHERE is_current = 1 AND price_monthly IS NOT NULL
    GROUP BY tool_id
  `).all();
  const priceMap = {};
  for (const r of priceRows) priceMap[r.tool_id] = r.min_price;
  // Invert: max_price - price gives "lower is better"
  const allPrices = toolIds.map(id => priceMap[id] ?? 0);
  const maxPrice = Math.max(...allPrices, 1);
  const pricingNorm = {};
  for (const id of toolIds) {
    const price = priceMap[id] ?? 0;
    pricingNorm[id] = price === 0 ? 1.0 : Math.max(0, (maxPrice - price) / maxPrice);
  }

  // 4. Community satisfaction — weighted average across sources
  const { results: reviewRows } = await env.DB.prepare(
    'SELECT tool_id, satisfaction, review_count FROM tool_reviews'
  ).all();
  const reviewsByTool = {};
  for (const r of reviewRows) {
    if (!reviewsByTool[r.tool_id]) reviewsByTool[r.tool_id] = [];
    reviewsByTool[r.tool_id].push(r);
  }
  const communityScores = {};
  for (const id of toolIds) {
    const reviews = reviewsByTool[id] || [];
    if (!reviews.length) { communityScores[id] = 0; continue; }
    let weightedSum = 0, totalCount = 0;
    for (const r of reviews) {
      weightedSum += r.satisfaction * r.review_count;
      totalCount += r.review_count;
    }
    communityScores[id] = totalCount > 0 ? weightedSum / totalCount / 100 : 0;
  }

  // 5. Feature coverage — % of 10 standard features supported
  const { results: featureRows } = await env.DB.prepare(
    'SELECT tool_id, COUNT(*) as total, SUM(supported) as supported FROM tool_features GROUP BY tool_id'
  ).all();
  const featureMap = {};
  for (const r of featureRows) {
    featureMap[r.tool_id] = r.total > 0 ? r.supported / r.total : 0;
  }
  const featureNorm = {};
  for (const id of toolIds) featureNorm[id] = featureMap[id] || 0;

  // 6. Freshness — days since last release (newer = better)
  const now = Date.now();
  const freshnessRaw = toolIds.map(id => {
    const tool = tools.find(t => t.id === id);
    if (!tool?.last_release_date) return { id, value: 0 };
    const daysSince = (now - new Date(tool.last_release_date).getTime()) / (1000 * 60 * 60 * 24);
    // Score: 1.0 if released today, decays to 0 at 180 days
    return { id, value: Math.max(0, 1 - daysSince / 180) };
  });
  const freshnessNorm = {};
  for (const item of freshnessRaw) freshnessNorm[item.id] = item.value;

  // 7. Composite
  const insertStmt = env.DB.prepare(`
    INSERT OR REPLACE INTO tool_composite_scores
      (tool_id, model_breadth_score, pricing_score, community_score, feature_score, freshness_score, composite_score, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const batch = [];
  for (const tool of tools) {
    const id = tool.id;
    const mb = breadthNorm[id] || 0;
    const pr = pricingNorm[id] || 0;
    const cm = communityScores[id] || 0;
    const ft = featureNorm[id] || 0;
    const fr = freshnessNorm[id] || 0;

    const composite = (
      mb * WEIGHTS.model_breadth +
      pr * WEIGHTS.pricing +
      cm * WEIGHTS.community +
      ft * WEIGHTS.features +
      fr * WEIGHTS.freshness
    ) * 100;

    batch.push(insertStmt.bind(
      id,
      Number((mb * 100).toFixed(2)),
      Number((pr * 100).toFixed(2)),
      Number((cm * 100).toFixed(2)),
      Number((ft * 100).toFixed(2)),
      Number((fr * 100).toFixed(2)),
      Number(composite.toFixed(2)),
    ));

    console.log(`[TOOL-SCORE] ${tool.name}: breadth=${(mb*100).toFixed(1)}, price=${(pr*100).toFixed(1)}, community=${(cm*100).toFixed(1)}, features=${(ft*100).toFixed(1)}, fresh=${(fr*100).toFixed(1)}, composite=${composite.toFixed(2)}`);
  }

  if (batch.length) await env.DB.batch(batch);
  console.log(`[TOOL-SCORE] v1: Computed scores for ${batch.length} tools`);
}
