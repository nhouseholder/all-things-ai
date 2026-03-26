/**
 * Plugin Score Engine v1
 *
 * Computes composite scores for coding tools/plugins (MCP servers, skills, agents, etc.)
 * stored in the coding_tools table.
 *
 * Dimensions:
 *   GitHub stars       20% — community validation
 *   Freshness          20% — last_updated recency
 *   Compatibility      15% — platform + tag breadth
 *   Community rating   25% — community_rating + review_count
 *   Setup simplicity   10% — inverse of setup_complexity
 *   Documentation      10% — has_docs boolean
 */

const WEIGHTS = {
  stars:         0.20,
  freshness:     0.20,
  compatibility: 0.15,
  community:     0.25,
  simplicity:    0.10,
  docs:          0.10,
};

const COMPLEXITY_SCORES = {
  easy:   1.0,
  medium: 0.5,
  hard:   0.2,
};

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

export async function computePluginScores(env) {
  // 1. Get all active coding tools
  const { results: plugins } = await env.DB.prepare(
    `SELECT id, name, slug, stars, last_updated, platform, community_rating,
            review_count, setup_complexity, has_docs
     FROM coding_tools WHERE is_active = 1`
  ).all();

  if (!plugins.length) {
    console.log('[PLUGIN-SCORE] No active plugins found');
    return;
  }

  // 2. Stars — min-max normalized
  const starsNorm = minMaxNormalize(
    plugins.map(p => ({ id: p.id, value: p.stars || 0 }))
  );

  // 3. Freshness — days since last_updated
  const now = Date.now();
  const freshnessNorm = {};
  for (const p of plugins) {
    if (!p.last_updated) { freshnessNorm[p.id] = 0; continue; }
    const daysSince = (now - new Date(p.last_updated).getTime()) / (1000 * 60 * 60 * 24);
    freshnessNorm[p.id] = Math.max(0, 1 - daysSince / 365);
  }

  // 4. Compatibility — platform score + tag count
  const { results: tagCounts } = await env.DB.prepare(
    'SELECT tool_id, COUNT(*) as tag_count FROM coding_tool_tags GROUP BY tool_id'
  ).all();
  const tagCountMap = {};
  for (const r of tagCounts) tagCountMap[r.tool_id] = r.tag_count;

  const compatRaw = plugins.map(p => {
    let score = tagCountMap[p.id] || 0;
    if (p.platform === 'universal') score += 3; // bonus for cross-platform
    return { id: p.id, value: score };
  });
  const compatNorm = minMaxNormalize(compatRaw);

  // 5. Community — rating (0-5) scaled + review_count confidence
  const communityNorm = {};
  for (const p of plugins) {
    const rating = p.community_rating || 0;
    const reviews = p.review_count || 0;
    // Confidence: ramp from 0 at 0 reviews to 1.0 at 50+ reviews
    const confidence = Math.min(1, reviews / 50);
    // Rating normalized to 0-1 (assumes 0-5 scale)
    const ratingNorm = Math.min(1, rating / 5);
    communityNorm[p.id] = ratingNorm * confidence;
  }

  // 6. Simplicity — direct mapping
  const simplicityNorm = {};
  for (const p of plugins) {
    simplicityNorm[p.id] = COMPLEXITY_SCORES[p.setup_complexity] ?? 0.5;
  }

  // 7. Documentation
  const docsNorm = {};
  for (const p of plugins) {
    docsNorm[p.id] = p.has_docs ? 1.0 : 0.0;
  }

  // 8. Composite
  const insertStmt = env.DB.prepare(`
    INSERT OR REPLACE INTO plugin_composite_scores
      (plugin_id, stars_score, freshness_score, compatibility_score, community_score,
       simplicity_score, docs_score, composite_score, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const batch = [];
  for (const p of plugins) {
    const id = p.id;
    const st = starsNorm[id] || 0;
    const fr = freshnessNorm[id] || 0;
    const co = compatNorm[id] || 0;
    const cm = communityNorm[id] || 0;
    const si = simplicityNorm[id] || 0;
    const dc = docsNorm[id] || 0;

    const composite = (
      st * WEIGHTS.stars +
      fr * WEIGHTS.freshness +
      co * WEIGHTS.compatibility +
      cm * WEIGHTS.community +
      si * WEIGHTS.simplicity +
      dc * WEIGHTS.docs
    ) * 100;

    batch.push(insertStmt.bind(
      id,
      Number((st * 100).toFixed(2)),
      Number((fr * 100).toFixed(2)),
      Number((co * 100).toFixed(2)),
      Number((cm * 100).toFixed(2)),
      Number((si * 100).toFixed(2)),
      Number((dc * 100).toFixed(2)),
      Number(composite.toFixed(2)),
    ));
  }

  if (batch.length) await env.DB.batch(batch);
  console.log(`[PLUGIN-SCORE] v1: Computed scores for ${batch.length} plugins`);
}
