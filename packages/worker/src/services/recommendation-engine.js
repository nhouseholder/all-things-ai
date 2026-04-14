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

  // W4: Batch insert instead of individual statements
  if (top.length) {
    const insertStmt = env.DB.prepare(
      `INSERT INTO recommendations (type, title, body, priority, related_tool_id, related_model_id, related_news_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const batch = top.map(rec => insertStmt.bind(
      rec.type,
      rec.title,
      rec.body,
      rec.priority,
      rec.related_tool_id ?? null,
      rec.related_model_id ?? null,
      rec.related_news_id ?? null
    ));
    await env.DB.batch(batch);
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

  // Dedup: keep only one row per (tool_id, plan_id, new_price). price_changes
  // can contain multiple detection events for the same price move, which would
  // otherwise render 5 identical recommendation tiles on the dashboard.
  const seen = new Set();
  for (const drop of drops.results) {
    if (!subscribedToolIds.has(drop.tool_id)) continue;

    const key = `${drop.tool_id}:${drop.plan_id}:${drop.new_price}`;
    if (seen.has(key)) continue;
    seen.add(key);

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
  // W3: Single-query approach instead of N+1
  const subscriptions = await getActiveSubscriptions(env);
  if (!subscriptions.length) return;

  // Get tool categories for all subscribed tools in one query
  const toolIds = subscriptions.map(s => s.tool_id);
  const toolPlaceholders = toolIds.map(() => '?').join(',');
  const { results: tools } = await env.DB.prepare(
    `SELECT id, name, category FROM tools WHERE id IN (${toolPlaceholders})`
  ).bind(...toolIds).all();

  const toolMap = Object.fromEntries(tools.map(t => [t.id, t]));
  const categories = [...new Set(tools.map(t => t.category))];
  if (!categories.length) return;

  // Get all cheaper plans in relevant categories in one query
  const catPlaceholders = categories.map(() => '?').join(',');
  const { results: allAlts } = await env.DB.prepare(`
    SELECT t.id AS tool_id, t.name AS tool_name, t.category, pp.plan_name,
           pp.price_monthly, pp.models_included
    FROM tools t
    JOIN pricing_plans pp ON pp.tool_id = t.id AND pp.is_current = 1
    WHERE t.category IN (${catPlaceholders})
      AND t.id NOT IN (${toolPlaceholders})
      AND pp.price_monthly IS NOT NULL
      AND pp.price_monthly > 0
    ORDER BY pp.price_monthly ASC
  `).bind(...categories, ...toolIds).all();

  // Match alternatives to subscriptions in-memory
  for (const sub of subscriptions) {
    const tool = toolMap[sub.tool_id];
    if (!tool) continue;

    const cheaper = allAlts
      .filter(a => a.category === tool.category && a.price_monthly < sub.monthly_cost)
      .slice(0, 3);

    for (const alt of cheaper) {
      const savings = (sub.monthly_cost - alt.price_monthly).toFixed(2);
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
 * Generate personalized "bang for buck" recommendations from a user-provided
 * stack. Unlike generateRecommendations() which reads hardcoded
 * user_subscriptions from the DB, this accepts a stack payload from the
 * frontend (persisted in localStorage) and returns ranked suggestions
 * without writing to the DB.
 *
 * Input: { plans: [{ toolSlug, planName, monthlyCost }], models: [slug], subscriptions: [{name, cost}] }
 * Output: { totalSpend, recommendations: [{ type, title, body, savings, ... }] }
 */
export async function generateStackRecommendations(env, stack) {
  const plans = Array.isArray(stack?.plans) ? stack.plans : [];
  const extraSubs = Array.isArray(stack?.subscriptions) ? stack.subscriptions : [];
  const userModels = Array.isArray(stack?.models) ? stack.models : [];

  const toolSlugs = plans.map(p => p.toolSlug).filter(Boolean);
  const totalPlanSpend = plans.reduce((sum, p) => sum + (Number(p.monthlyCost) || 0), 0);
  const totalExtraSpend = extraSubs.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
  const totalSpend = totalPlanSpend + totalExtraSpend;

  const recs = [];

  // --- 1. Cheaper alternatives in same category ---
  if (toolSlugs.length) {
    const placeholders = toolSlugs.map(() => '?').join(',');
    const { results: userTools } = await env.DB.prepare(
      `SELECT id, slug, name, category FROM tools WHERE slug IN (${placeholders})`
    ).bind(...toolSlugs).all();

    const slugToTool = Object.fromEntries(userTools.map(t => [t.slug, t]));
    const categories = [...new Set(userTools.map(t => t.category).filter(Boolean))];

    if (categories.length) {
      const catPlaceholders = categories.map(() => '?').join(',');
      const toolIdPlaceholders = userTools.map(() => '?').join(',');
      const userToolIds = userTools.map(t => t.id);

      const { results: allAlts } = await env.DB.prepare(`
        SELECT t.id AS tool_id, t.slug AS tool_slug, t.name AS tool_name, t.category,
               pp.plan_name, pp.price_monthly, pp.models_included
        FROM tools t
        JOIN pricing_plans pp ON pp.tool_id = t.id AND pp.is_current = 1
        WHERE t.category IN (${catPlaceholders})
          ${userToolIds.length ? `AND t.id NOT IN (${toolIdPlaceholders})` : ''}
          AND pp.price_monthly IS NOT NULL
          AND pp.price_monthly > 0
        ORDER BY pp.price_monthly ASC
      `).bind(...categories, ...userToolIds).all();

      for (const p of plans) {
        const tool = slugToTool[p.toolSlug];
        if (!tool) continue;

        const cheaper = allAlts
          .filter(a => a.category === tool.category && a.price_monthly < (Number(p.monthlyCost) || Infinity))
          .slice(0, 2);

        for (const alt of cheaper) {
          const savings = ((Number(p.monthlyCost) || 0) - alt.price_monthly).toFixed(2);
          const modelInfo = alt.models_included ? ` with access to ${alt.models_included}` : '';
          recs.push({
            type: 'cheaper_alternative',
            title: `Save $${savings}/mo: switch from ${tool.name} to ${alt.tool_name}`,
            body: `${alt.tool_name} ${alt.plan_name} costs $${alt.price_monthly}/mo${modelInfo} vs your ${tool.name} at $${p.monthlyCost}/mo.`,
            savings: Number(savings),
            priority: 80 + Number(savings),
            related_tool_slug: alt.tool_slug,
          });
        }
      }
    }
  }

  // --- 2. Model coverage: find cheapest plan that covers user's models ---
  if (userModels.length) {
    const modelPlaceholders = userModels.map(() => '?').join(',');
    const { results: coverage } = await env.DB.prepare(`
      SELECT t.slug AS tool_slug, t.name AS tool_name,
             pp.plan_name, pp.price_monthly,
             COUNT(DISTINCT m.slug) AS models_covered
      FROM models m
      JOIN model_availability ma ON ma.model_id = m.id
      JOIN tools t ON t.id = ma.tool_id
      JOIN pricing_plans pp ON pp.tool_id = t.id AND pp.is_current = 1
      WHERE m.slug IN (${modelPlaceholders})
        AND pp.price_monthly IS NOT NULL
        AND pp.price_monthly > 0
      GROUP BY t.slug, pp.plan_name, pp.price_monthly
      HAVING models_covered = ?
      ORDER BY pp.price_monthly ASC
      LIMIT 3
    `).bind(...userModels, userModels.length).all();

    if (coverage.length) {
      const cheapest = coverage[0];
      // If the cheapest coverage plan is less than current total, flag it
      if (cheapest.price_monthly < totalSpend) {
        const savings = (totalSpend - cheapest.price_monthly).toFixed(2);
        recs.push({
          type: 'consolidation',
          title: `Save $${savings}/mo: ${cheapest.tool_name} covers all your models`,
          body: `${cheapest.tool_name} ${cheapest.plan_name} includes every model you use for $${cheapest.price_monthly}/mo. You're currently spending $${totalSpend.toFixed(2)}/mo across ${plans.length + extraSubs.length} plan(s).`,
          savings: Number(savings),
          priority: 100,
          related_tool_slug: cheapest.tool_slug,
        });
      }
    }
  }

  // --- 3. Price drops on tools the user owns ---
  if (toolSlugs.length) {
    const placeholders = toolSlugs.map(() => '?').join(',');
    const { results: drops } = await env.DB.prepare(`
      SELECT DISTINCT pc.tool_id, pc.plan_id, pc.old_price, pc.new_price,
             t.name AS tool_name, t.slug AS tool_slug, pp.plan_name
      FROM price_changes pc
      JOIN tools t ON t.id = pc.tool_id
      JOIN pricing_plans pp ON pp.id = pc.plan_id
      WHERE pc.change_type = 'decrease'
        AND pc.detected_at >= datetime('now', '-30 days')
        AND t.slug IN (${placeholders})
    `).bind(...toolSlugs).all();

    const seenDrop = new Set();
    for (const drop of drops) {
      const key = `${drop.tool_slug}:${drop.plan_id}:${drop.new_price}`;
      if (seenDrop.has(key)) continue;
      seenDrop.add(key);
      const savings = (drop.old_price - drop.new_price).toFixed(2);
      recs.push({
        type: 'price_drop',
        title: `${drop.tool_name} ${drop.plan_name} dropped to $${drop.new_price}/mo`,
        body: `Down from $${drop.old_price}/mo — you save $${savings}/mo on your current plan.`,
        savings: Number(savings),
        priority: 70,
        related_tool_slug: drop.tool_slug,
      });
    }
  }

  recs.sort((a, b) => b.priority - a.priority);

  return {
    totalSpend: Number(totalSpend.toFixed(2)),
    planCount: plans.length,
    subscriptionCount: extraSubs.length,
    modelCount: userModels.length,
    recommendations: recs.slice(0, 10),
  };
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
