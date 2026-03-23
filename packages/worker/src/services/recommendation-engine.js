import { USER_PROFILE } from '../config/user-profile.js';

/**
 * Generate up to 10 actionable recommendations based on price changes,
 * alternatives, model upgrades, new tools, and high-relevance news.
 */
export async function generateRecommendations(env) {
  // Clear old undismissed recommendations to avoid stale entries
  await env.DB.prepare(
    `DELETE FROM recommendations WHERE is_dismissed = 0`
  ).run();

  const recommendations = [];

  await addPriceDropRecommendations(env, recommendations);
  await addCheaperAlternatives(env, recommendations);
  await addModelUpgrades(env, recommendations);
  await addNewToolAlerts(env, recommendations);
  await addHighRelevanceNews(env, recommendations);

  // Sort by priority descending and keep top 10
  recommendations.sort((a, b) => b.priority - a.priority);
  const top = recommendations.slice(0, 10);

  for (const rec of top) {
    await env.DB.prepare(
      `INSERT INTO recommendations (type, title, body, priority, related_tool_id, related_model_id, related_news_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      rec.type,
      rec.title,
      rec.body,
      rec.priority,
      rec.related_tool_id ?? null,
      rec.related_model_id ?? null,
      rec.related_news_id ?? null
    ).run();
  }

  console.log(`[RECOMMENDATIONS] Generated ${top.length} recommendations`);
}

/**
 * Type 1: Price drops on subscribed tools from the last 7 days.
 */
async function addPriceDropRecommendations(env, recommendations) {
  const drops = await env.DB.prepare(`
    SELECT pc.id, pc.tool_id, pc.plan_id, pc.old_price, pc.new_price,
           t.name AS tool_name, pp.plan_name
    FROM price_changes pc
    JOIN tools t ON t.id = pc.tool_id
    JOIN pricing_plans pp ON pp.id = pc.plan_id
    WHERE pc.change_type = 'decrease'
      AND pc.detected_at >= datetime('now', '-7 days')
  `).all();

  const subscriptions = await getActiveSubscriptions(env);
  const subscribedToolIds = new Set(subscriptions.map(s => s.tool_id));

  for (const drop of drops.results) {
    if (!subscribedToolIds.has(drop.tool_id)) continue;

    const savings = (drop.old_price - drop.new_price).toFixed(2);
    recommendations.push({
      type: 'price_drop',
      title: `${drop.tool_name} price dropped to $${drop.new_price}/mo`,
      body: `${drop.tool_name} ${drop.plan_name} dropped from $${drop.old_price}/mo to $${drop.new_price}/mo — you're saving $${savings}/mo on your current subscription. No action needed, just good news for your budget.`,
      priority: 90,
      related_tool_id: drop.tool_id,
    });
  }
}

/**
 * Type 2: Cheaper alternatives for each subscribed tool.
 */
async function addCheaperAlternatives(env, recommendations) {
  const subscriptions = await getActiveSubscriptions(env);

  for (const sub of subscriptions) {
    // Get the tool's category
    const tool = await env.DB.prepare(
      `SELECT id, name, category FROM tools WHERE id = ?`
    ).bind(sub.tool_id).first();
    if (!tool) continue;

    // Find cheaper tools in the same category
    const alternatives = await env.DB.prepare(`
      SELECT t.id AS tool_id, t.name AS tool_name, pp.plan_name,
             pp.price_monthly, pp.models_included
      FROM tools t
      JOIN pricing_plans pp ON pp.tool_id = t.id AND pp.is_current = 1
      WHERE t.category = ? AND t.id != ?
        AND pp.price_monthly IS NOT NULL
        AND pp.price_monthly < ?
        AND pp.price_monthly > 0
      ORDER BY pp.price_monthly ASC
      LIMIT 3
    `).bind(tool.category, tool.id, sub.monthly_cost).all();

    for (const alt of alternatives.results) {
      const savings = (sub.monthly_cost - alt.price_monthly).toFixed(2);

      // Check if alternative has similar model access
      const modelInfo = alt.models_included ? ` with access to ${alt.models_included}` : '';

      recommendations.push({
        type: 'cheaper_alternative',
        title: `Save $${savings}/mo by switching to ${alt.tool_name}`,
        body: `${alt.tool_name} ${alt.plan_name} costs $${alt.price_monthly}/mo${modelInfo}, compared to your ${tool.name} subscription at $${sub.monthly_cost}/mo. That's $${savings}/mo in potential savings — $${(savings * 12).toFixed(0)}/year.`,
        priority: 80,
        related_tool_id: alt.tool_id,
      });
    }
  }
}

/**
 * Type 3: New models that outperform what the user currently has access to.
 */
async function addModelUpgrades(env, recommendations) {
  const preferredCategories = USER_PROFILE.preferred_categories;
  const categoryPlaceholders = preferredCategories.map(() => '?').join(',');

  // Models released in last 30 days
  const newModels = await env.DB.prepare(`
    SELECT m.id, m.name, m.vendor, m.release_date
    FROM models m
    WHERE m.release_date >= datetime('now', '-30 days')
      AND m.is_active = 1
  `).all();

  if (!newModels.results.length) return;

  // Get benchmark scores for user's current tools' models
  const subscriptions = await getActiveSubscriptions(env);
  const subscribedToolIds = subscriptions.map(s => s.tool_id);
  if (!subscribedToolIds.length) return;

  const toolPlaceholders = subscribedToolIds.map(() => '?').join(',');

  const currentModelIds = await env.DB.prepare(`
    SELECT DISTINCT model_id FROM model_availability
    WHERE tool_id IN (${toolPlaceholders})
  `).bind(...subscribedToolIds).all();

  const currentIds = currentModelIds.results.map(r => r.model_id);
  if (!currentIds.length) return;

  // Get best current benchmark scores in preferred categories
  const currentIdPlaceholders = currentIds.map(() => '?').join(',');
  const bestCurrentScores = await env.DB.prepare(`
    SELECT category, MAX(score) AS best_score, benchmark_name
    FROM benchmarks
    WHERE model_id IN (${currentIdPlaceholders})
      AND category IN (${categoryPlaceholders})
    GROUP BY category, benchmark_name
  `).bind(...currentIds, ...preferredCategories).all();

  const scoreLookup = {};
  for (const row of bestCurrentScores.results) {
    const key = `${row.category}:${row.benchmark_name}`;
    scoreLookup[key] = row.best_score;
  }

  // Check if new models beat current ones
  for (const model of newModels.results) {
    const benchmarks = await env.DB.prepare(`
      SELECT benchmark_name, category, score
      FROM benchmarks
      WHERE model_id = ? AND category IN (${categoryPlaceholders})
    `).bind(model.id, ...preferredCategories).all();

    for (const bench of benchmarks.results) {
      const key = `${bench.category}:${bench.benchmark_name}`;
      const currentBest = scoreLookup[key];

      if (currentBest !== undefined && bench.score > currentBest) {
        const improvement = (bench.score - currentBest).toFixed(1);
        recommendations.push({
          type: 'model_upgrade',
          title: `${model.name} outperforms your current models in ${bench.category}`,
          body: `${model.name} from ${model.vendor} scores ${bench.score}% on ${bench.benchmark_name}, beating your current best of ${currentBest}% by ${improvement} points. Released ${model.release_date} — worth evaluating for your ${bench.category} workflows.`,
          priority: 70,
          related_model_id: model.id,
        });
        break; // One recommendation per model
      }
    }
  }
}

/**
 * Type 4: New tools added in the last 30 days that match user's stack.
 */
async function addNewToolAlerts(env, recommendations) {
  const newTools = await env.DB.prepare(`
    SELECT id, name, category, description, vendor
    FROM tools
    WHERE updated_at >= datetime('now', '-30 days')
  `).all();

  const userStack = [
    ...USER_PROFILE.primary_languages,
    ...USER_PROFILE.project_types,
    ...USER_PROFILE.key_needs,
  ].map(s => s.toLowerCase());

  for (const tool of newTools.results) {
    const desc = `${tool.name} ${tool.category} ${tool.description || ''}`.toLowerCase();
    const matches = userStack.filter(term => desc.includes(term));

    if (matches.length > 0) {
      recommendations.push({
        type: 'new_tool',
        title: `New tool: ${tool.name} (${tool.category})`,
        body: `${tool.name} by ${tool.vendor} just launched in the ${tool.category} space. ${tool.description || `It matches your interest in ${matches.slice(0, 3).join(', ')}.`}`,
        priority: 60,
        related_tool_id: tool.id,
      });
    }
  }
}

/**
 * Type 5: High-relevance news (score > 80) from last 3 days
 * not already linked to a recommendation.
 */
async function addHighRelevanceNews(env, recommendations) {
  const news = await env.DB.prepare(`
    SELECT n.id, n.title, n.source, n.summary, n.relevance_score, n.relevance_tags
    FROM news_items n
    WHERE n.relevance_score > 80
      AND n.published_at >= datetime('now', '-3 days')
      AND n.id NOT IN (SELECT related_news_id FROM recommendations WHERE related_news_id IS NOT NULL)
    ORDER BY n.relevance_score DESC
    LIMIT 5
  `).all();

  for (const item of news.results) {
    const tags = item.relevance_tags ? JSON.parse(item.relevance_tags) : [];
    const tagLabel = tags.length > 0 ? tags[0].replace('-', ' ') : 'AI news';

    const snippet = item.summary
      ? item.summary.slice(0, 150) + (item.summary.length > 150 ? '...' : '')
      : '';

    recommendations.push({
      type: 'high_news',
      title: `${tagLabel}: ${item.title}`.slice(0, 120),
      body: `Scored ${item.relevance_score}/100 relevance from ${item.source}. ${snippet}`,
      priority: 50,
      related_news_id: item.id,
    });
  }
}

/**
 * Helper: get active user subscriptions with tool info.
 */
async function getActiveSubscriptions(env) {
  const result = await env.DB.prepare(`
    SELECT us.tool_id, us.plan_id, us.monthly_cost, t.name AS tool_name
    FROM user_subscriptions us
    JOIN tools t ON t.id = us.tool_id
    WHERE us.is_active = 1
  `).all();
  return result.results;
}
