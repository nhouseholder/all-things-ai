import { Hono } from 'hono';
import { computeVibeCoderFit } from '../services/vibe-fit-engine.js';
import { simulatePlanBurn, rankPlansForPersona, PERSONAS } from '../services/plan-burn-engine.js';

export const advisorRoutes = new Hono();

const PREMIUM_INPUT_PRICE_THRESHOLD = 2;
const PREMIUM_OUTPUT_PRICE_THRESHOLD = 10;

function isPremiumModel(model) {
  const inputPrice = Number(model.input_price_per_mtok ?? model.input_price ?? 0);
  const outputPrice = Number(model.output_price_per_mtok ?? model.output_price ?? 0);
  return inputPrice >= PREMIUM_INPUT_PRICE_THRESHOLD || outputPrice >= PREMIUM_OUTPUT_PRICE_THRESHOLD;
}

function isByokAvailability(plan) {
  return plan.access_level === 'byok' || /byok/i.test(plan.plan_name || '');
}

function availabilityFitScore(model, plan) {
  let score = 0;

  if (isByokAvailability(plan)) score -= 80;
  else score += 20;

  if (plan.access_level === 'full') score += 18;
  else if (plan.access_level === 'credits') score += 12;
  else if (plan.access_level === 'api') score += 6;

  const price = Number(plan.price_monthly);
  if (plan.price_monthly == null) score -= 10;
  else if (price === 0) score += 18;
  else if (price <= 20) score += 22;
  else if (price <= 40) score += 18;
  else if (price <= 100) score += 10;
  else score += 4;

  const included = Number(plan.included_requests || 0);
  if (included > 0) score += 18;

  if (plan.overage_model === 'throttled') score += 10;
  if (plan.overage_model === 'pay-per-use') score += 8;
  if (plan.overage_model === 'auto-topup') score += 4;
  if (plan.overage_model === 'stopped') score -= 8;

  const perRequest = Number(plan.credits_per_request);
  if (Number.isFinite(perRequest) && perRequest > 0) {
    if (perRequest <= 1) score += 12;
    else if (perRequest <= 3) score += 7;
    else score += 2;
  }

  if (isPremiumModel(model) && price === 0 && !included && !Number.isFinite(perRequest)) {
    score -= 20;
  }

  return score;
}

function getAdvisorAvailability(model, plans) {
  if (!plans?.length) return [];
  const filtered = isPremiumModel(model)
    ? plans.filter((plan) => !isByokAvailability(plan))
    : [...plans];

  return filtered.sort((a, b) => {
    const diff = availabilityFitScore(model, b) - availabilityFitScore(model, a);
    if (diff !== 0) return diff;
    const priceA = a.price_monthly == null ? Infinity : Number(a.price_monthly);
    const priceB = b.price_monthly == null ? Infinity : Number(b.price_monthly);
    return priceA - priceB;
  });
}

// GET /api/advisor/tasks — all task profiles
advisorRoutes.get('/tasks', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM task_profiles ORDER BY sort_order'
  ).all();
  return c.json(results);
});

// GET /api/advisor/composite-scores — all composite scores with model info
advisorRoutes.get('/composite-scores', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      mcs.*,
      m.name as model_name, m.slug as model_slug,
      m.vendor, m.family
    FROM model_composite_scores mcs
    JOIN models m ON m.id = mcs.model_id
    WHERE m.is_active = 1
    ORDER BY mcs.composite_score DESC
  `).all();
  return c.json(results);
});

// GET /api/advisor/matrix — full model x task matrix
advisorRoutes.get('/matrix', async (c) => {
  const taskSlug = c.req.query('task');

  // 1. Get task profiles
  let tasks;
  if (taskSlug) {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM task_profiles WHERE slug = ?'
    ).bind(taskSlug).all();
    tasks = results;
  } else {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM task_profiles ORDER BY sort_order'
    ).all();
    tasks = results;
  }

  if (!tasks.length) {
    return c.json({ tasks: [], models: [] });
  }

  const taskIds = tasks.map(t => t.id);
  const placeholders = taskIds.map(() => '?').join(',');

  // 2. Get all estimates for these tasks joined with models and composite scores
  const { results: estimates } = await c.env.DB.prepare(`
    SELECT
      mte.*,
      m.name as model_name, m.slug as model_slug,
      m.vendor, m.family,
      m.input_price_per_mtok, m.output_price_per_mtok,
      mcs.composite_score,
      tp.slug as task_slug
    FROM model_task_estimates mte
    JOIN models m ON m.id = mte.model_id
    JOIN task_profiles tp ON tp.id = mte.task_profile_id
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = mte.model_id
    WHERE mte.task_profile_id IN (${placeholders})
      AND m.is_active = 1
    ORDER BY mcs.composite_score DESC
  `).bind(...taskIds).all();

  // 3. Group by model, nest estimates by task slug
  const modelMap = new Map();

  for (const est of estimates) {
    if (!modelMap.has(est.model_id)) {
      modelMap.set(est.model_id, {
        model_id: est.model_id,
        model_name: est.model_name,
        model_slug: est.model_slug,
        vendor: est.vendor,
        composite_score: est.composite_score,
        input_price: est.input_price_per_mtok,
        output_price: est.output_price_per_mtok,
        estimates: {},
      });
    }

    const totalEffectiveCost = (est.cost_per_task_estimate || 0) + (est.time_value_per_task || 0);

    modelMap.get(est.model_id).estimates[est.task_slug] = {
      first_attempt_success_rate: est.first_attempt_success_rate,
      avg_messages: est.avg_messages_to_complete,
      cost_per_task: est.cost_per_task_estimate,
      avg_minutes: est.avg_minutes_to_complete,
      time_value: est.time_value_per_task,
      total_effective_cost: Number(totalEffectiveCost.toFixed(2)),
      steering_effort: est.steering_effort,
      autonomy_score: est.autonomy_score,
      data_source: est.data_source,
    };
  }

  // 4. Sort by composite_score DESC
  const models = [...modelMap.values()].sort(
    (a, b) => (b.composite_score || 0) - (a.composite_score || 0)
  );

  return c.json({
    tasks: tasks.map(t => ({ id: t.id, name: t.name, slug: t.slug, complexity: t.complexity })),
    models,
  });
});

// GET /api/advisor/rankings — dual leaderboard (best overall + best bang for buck)
advisorRoutes.get('/rankings', async (c) => {
  const cache = c.env.CACHE;
  if (cache) {
    const cached = await cache.get('rankings:v2-vibe', 'json');
    if (cached) return c.json(cached);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT
      mcs.*,
      m.name as model_name, m.slug as model_slug,
      m.vendor, m.family,
      m.input_price_per_mtok, m.output_price_per_mtok,
      ors.context_length as openrouter_context_length,
      ors.max_completion_tokens,
      ors.supports_reasoning,
      ors.supports_tools,
      ors.supports_files,
      ors.supports_images,
      ors.supports_structured_outputs,
      ors.prompt_tokens_daily,
      ors.reasoning_tokens_daily,
      ors.completion_tokens_daily
    FROM model_composite_scores mcs
    JOIN models m ON m.id = mcs.model_id
    LEFT JOIN model_openrouter_stats ors ON ors.model_id = mcs.model_id
    WHERE m.is_active = 1
    ORDER BY mcs.composite_score DESC
  `).all();

  // Attach community review summary per model
  const { results: reviewSummary } = await c.env.DB.prepare(`
    SELECT
      model_id,
      SUM(review_count) as total_reviews,
      COUNT(DISTINCT source) as source_count,
      ROUND(AVG(coding_satisfaction), 1) as avg_satisfaction,
      ROUND(
        SUM(COALESCE(vibe_coder_satisfaction, 0) * COALESCE(vibe_coder_count, 0))
        / NULLIF(SUM(COALESCE(vibe_coder_count, 0)), 0),
        1
      ) as vibe_satisfaction,
      SUM(COALESCE(heavy_coder_count, 0)) as heavy_count,
      SUM(COALESCE(vibe_coder_count, 0)) as vibe_count,
      SUM(COALESCE(casual_count, 0)) as casual_count
    FROM community_reviews
    GROUP BY model_id
  `).all();

  const reviewMap = new Map(reviewSummary.map(r => [r.model_id, r]));

  const { results: taskSignals } = await c.env.DB.prepare(`
    SELECT
      mte.model_id,
      ROUND(AVG(mte.first_attempt_success_rate), 4) as avg_success,
      ROUND(AVG(
        CASE
          WHEN tp.slug IN ('complex-debugging', 'feature-implementation', 'boilerplate-scaffolding', 'quick-fixes', 'multi-file-refactor', 'code-review', 'learning-exploring')
          THEN mte.first_attempt_success_rate
        END
      ), 4) as vibe_success,
      ROUND(AVG(COALESCE(mte.autonomy_score, 55)), 1) as avg_autonomy,
      ROUND(AVG(
        CASE mte.steering_effort
          WHEN 'low' THEN 100
          WHEN 'medium' THEN 65
          ELSE 30
        END
      ), 1) as steering_score,
      ROUND(AVG(mte.avg_minutes_to_complete), 1) as avg_minutes
    FROM model_task_estimates mte
    JOIN task_profiles tp ON tp.id = mte.task_profile_id
    GROUP BY mte.model_id
  `).all();

  const taskSignalMap = new Map(taskSignals.map(r => [r.model_id, r]));

  const bestOverall = results.map(m => {
    const rev = reviewMap.get(m.model_id);
    const vibeProfile = computeVibeCoderFit({
      model: m,
      openrouter: {
        context_length: m.openrouter_context_length,
        max_completion_tokens: m.max_completion_tokens,
        supports_reasoning: m.supports_reasoning,
        supports_tools: m.supports_tools,
        supports_files: m.supports_files,
        supports_images: m.supports_images,
        supports_structured_outputs: m.supports_structured_outputs,
        prompt_tokens_daily: m.prompt_tokens_daily,
        reasoning_tokens_daily: m.reasoning_tokens_daily,
        completion_tokens_daily: m.completion_tokens_daily,
      },
      taskSignals: taskSignalMap.get(m.model_id),
      community: {
        satisfaction: rev?.avg_satisfaction || null,
        vibe_satisfaction: rev?.vibe_satisfaction || null,
      },
    });

    return {
      ...m,
      community_reviews: rev?.total_reviews || 0,
      community_sources: rev?.source_count || 0,
      community_satisfaction: rev?.avg_satisfaction || null,
      community_vibe_satisfaction: rev?.vibe_satisfaction || null,
      community_heavy: rev?.heavy_count || 0,
      community_vibe: rev?.vibe_count || 0,
      community_casual: rev?.casual_count || 0,
      vibe_coder_fit: vibeProfile.score,
      vibe_coder_label: vibeProfile.label,
      vibe_summary: vibeProfile.summary,
      vibe_badges: vibeProfile.badges,
      vibe_cautions: vibeProfile.cautions,
      openrouter_activity_tokens: vibeProfile.activity_tokens_daily,
    };
  });

  // Best Bang for Buck: score per dollar of average task cost
  const { results: avgCosts } = await c.env.DB.prepare(`
    SELECT
      mte.model_id,
      AVG(mte.cost_per_task_estimate) as avg_cost,
      AVG(mte.cost_per_task_estimate + mte.time_value_per_task) as avg_total_cost
    FROM model_task_estimates mte
    JOIN models m ON m.id = mte.model_id
    WHERE m.is_active = 1
    GROUP BY mte.model_id
  `).all();

  const costMap = new Map(avgCosts.map(c => [c.model_id, c]));

  const bangForBuck = bestOverall
    .map(m => {
      const costs = costMap.get(m.model_id);
      const avgTotalCost = costs?.avg_total_cost || null;
      const valueScore = avgTotalCost && avgTotalCost > 0
        ? (m.composite_score / avgTotalCost)
        : null;
      return { ...m, avg_cost_per_task: costs?.avg_cost || null, avg_total_cost: avgTotalCost, value_score: valueScore };
    })
    .filter(m => m.value_score != null)
    .sort((a, b) => b.value_score - a.value_score);

  const bestForVibeCoders = [...bestOverall]
    .sort((a, b) => (b.vibe_coder_fit || 0) - (a.vibe_coder_fit || 0) || (b.composite_score || 0) - (a.composite_score || 0));

  const response = {
    best_overall: bestOverall,
    bang_for_buck: bangForBuck,
    best_for_vibe_coders: bestForVibeCoders,
  };

  // Cache for 6 hours (21600 seconds)
  if (cache) {
    await cache.put('rankings:v2-vibe', JSON.stringify(response), { expirationTtl: 21600 });
  }

  return c.json(response);
});

// GET /api/advisor/success-rate-rankings — models ranked by avg first_attempt_success_rate
advisorRoutes.get('/success-rate-rankings', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      mte.model_id,
      m.name as model_name,
      m.slug as model_slug,
      m.vendor,
      m.family,
      ROUND(AVG(mte.first_attempt_success_rate) * 100, 1) as avg_success_rate,
      COUNT(mte.task_profile_id) as tasks_evaluated
    FROM model_task_estimates mte
    JOIN models m ON m.id = mte.model_id
    WHERE m.is_active = 1
      AND mte.first_attempt_success_rate IS NOT NULL
    GROUP BY mte.model_id
    HAVING tasks_evaluated >= 1
    ORDER BY avg_success_rate DESC
  `).all();

  return c.json(results);
});

// GET /api/advisor/model-availability — where each model is available + pricing
advisorRoutes.get('/model-availability', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT
      ma.model_id,
      m.name as model_name, m.slug as model_slug,
      t.name as tool_name, t.slug as tool_slug,
      pp.plan_name, pp.price_monthly,
      pp.included_requests, pp.overage_model,
      pp.overage_rate_description, pp.overage_rate_value,
      pp.fallback_behavior, pp.usage_notes,
      ma.access_level, ma.credits_per_request, ma.cost_notes as model_cost_notes
    FROM model_availability ma
    JOIN models m ON m.id = ma.model_id
    JOIN tools t ON t.id = ma.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
    WHERE m.is_active = 1
    ORDER BY m.name, pp.price_monthly ASC
  `).all();

  // Group by model
  const grouped = {};
  for (const row of results) {
    if (!grouped[row.model_slug]) {
      grouped[row.model_slug] = {
        model_name: row.model_name,
        model_slug: row.model_slug,
        plans: [],
      };
    }
    grouped[row.model_slug].plans.push({
      tool_name: row.tool_name,
      tool_slug: row.tool_slug,
      plan_name: row.plan_name,
      price_monthly: row.price_monthly,
      access_level: row.access_level,
      included_requests: row.included_requests,
      overage_model: row.overage_model,
      overage_rate_description: row.overage_rate_description,
      overage_rate_value: row.overage_rate_value,
      fallback_behavior: row.fallback_behavior,
      usage_notes: row.usage_notes,
      credits_per_request: row.credits_per_request,
      model_cost_notes: row.model_cost_notes,
    });
  }

  return c.json(Object.values(grouped));
});

// GET /api/advisor/task-rankings — model rankings for a specific task
advisorRoutes.get('/task-rankings', async (c) => {
  const taskSlug = c.req.query('task');
  if (!taskSlug) return c.json({ error: 'Missing required query param: task' }, 400);

  const { results } = await c.env.DB.prepare(`
    SELECT
      mte.*,
      m.name as model_name, m.slug as model_slug,
      m.vendor,
      mcs.composite_score,
      tp.name as task_name
    FROM model_task_estimates mte
    JOIN models m ON m.id = mte.model_id
    JOIN task_profiles tp ON tp.id = mte.task_profile_id
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = mte.model_id
    WHERE tp.slug = ? AND m.is_active = 1
    ORDER BY mte.first_attempt_success_rate DESC, mcs.composite_score DESC
  `).bind(taskSlug).all();

  // Build task-specific rankings
  const byQuality = [...results].sort((a, b) =>
    (b.first_attempt_success_rate * (b.composite_score || 0)) -
    (a.first_attempt_success_rate * (a.composite_score || 0))
  );

  const byValue = [...results].sort((a, b) => {
    const totalA = (a.cost_per_task_estimate || 0) + (a.time_value_per_task || 0);
    const totalB = (b.cost_per_task_estimate || 0) + (b.time_value_per_task || 0);
    // Only compare models with decent quality (>50% success)
    if (a.first_attempt_success_rate >= 0.5 && b.first_attempt_success_rate < 0.5) return -1;
    if (b.first_attempt_success_rate >= 0.5 && a.first_attempt_success_rate < 0.5) return 1;
    return totalA - totalB;
  });

  return c.json({
    task_name: results[0]?.task_name || taskSlug,
    by_quality: byQuality,
    by_value: byValue,
  });
});

// GET /api/advisor/recommend — top 3 recommendations for a task
advisorRoutes.get('/recommend', async (c) => {
  const taskSlug = c.req.query('task');
  if (!taskSlug) {
    return c.json({ error: 'Missing required query param: task' }, 400);
  }

  // 1. Get the task profile
  const task = await c.env.DB.prepare(
    'SELECT * FROM task_profiles WHERE slug = ?'
  ).bind(taskSlug).first();

  if (!task) {
    return c.json({ error: `Task not found: ${taskSlug}` }, 404);
  }

  // 2. Get model_task_estimates for this task with models and composite scores
  const { results: candidates } = await c.env.DB.prepare(`
    SELECT
      mte.*,
      m.id as mid, m.name as model_name, m.slug as model_slug,
      m.vendor, m.family,
      m.input_price_per_mtok, m.output_price_per_mtok,
      mcs.composite_score
    FROM model_task_estimates mte
    JOIN models m ON m.id = mte.model_id
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = mte.model_id
    WHERE mte.task_profile_id = ? AND m.is_active = 1
    ORDER BY mcs.composite_score DESC
  `).bind(task.id).all();

  if (!candidates.length) {
    return c.json({
      task: { name: task.name, slug: task.slug, complexity: task.complexity },
      recommendations: [],
    });
  }

  // 3. Get tool recommendations for this task
  const { results: toolRecs } = await c.env.DB.prepare(`
    SELECT ttr.*, t.name as tool_name, t.slug as tool_slug,
      pp.plan_name, pp.price_monthly
    FROM task_tool_recommendations ttr
    JOIN tools t ON t.id = ttr.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ttr.plan_id
    WHERE ttr.task_profile_id = ?
    ORDER BY ttr.rank ASC
  `).bind(task.id).all();

  // Index tools by model availability for matching
  const { results: availability } = await c.env.DB.prepare(`
    SELECT ma.model_id, t.name as tool_name, t.slug as tool_slug,
      pp.plan_name, pp.price_monthly, ma.access_level,
      pp.included_requests, pp.overage_model, pp.usage_notes,
      ma.credits_per_request
    FROM model_availability ma
    JOIN tools t ON t.id = ma.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
    WHERE ma.model_id IN (
      SELECT model_id FROM model_task_estimates WHERE task_profile_id = ?
    )
  `).bind(task.id).all();

  const toolsByModel = {};
  for (const a of availability) {
    if (!toolsByModel[a.model_id]) toolsByModel[a.model_id] = [];
    toolsByModel[a.model_id].push(a);
  }

  // 4. Rank models
  // Best Overall: highest composite_score with first_attempt >= 0.70
  const qualityCandidates = candidates.filter(
    c => c.first_attempt_success_rate >= 0.70
  );
  const bestOverall = qualityCandidates.length
    ? qualityCandidates.reduce((best, c) =>
        (c.composite_score || 0) > (best.composite_score || 0) ? c : best
      )
    : null;

  // Best Value: lowest total_effective_cost with composite_score >= 70
  const valueCandidates = candidates.filter(c => (c.composite_score || 0) >= 70);
  const bestValue = valueCandidates.length
    ? valueCandidates.reduce((best, c) => {
        const costC = (c.cost_per_task_estimate || 0) + (c.time_value_per_task || 0);
        const costBest = (best.cost_per_task_estimate || 0) + (best.time_value_per_task || 0);
        return costC < costBest ? c : best;
      })
    : null;

  // Budget Pick: lowest cost_per_task regardless of quality
  const budgetPick = candidates.reduce((best, c) =>
    (c.cost_per_task_estimate ?? Infinity) < (best.cost_per_task_estimate ?? Infinity) ? c : best
  );

  // 5. Build recommendations
  function findTool(model) {
    const modelId = model.model_id;
    const modelTools = getAdvisorAvailability(model, toolsByModel[modelId] || []);

    // Prefer task-specific tool recommendation, fallback to model availability
    if (toolRecs.length) {
      for (const rec of toolRecs) {
        const match = modelTools.find(t => t.tool_slug === rec.tool_slug);
        if (match) {
          return {
            name: rec.tool_name,
            slug: rec.tool_slug,
            plan: rec.plan_name,
            price_monthly: rec.price_monthly,
          };
        }
      }
    }
    const fallback = modelTools[0];
    if (fallback) {
      return {
        name: fallback.tool_name,
        slug: fallback.tool_slug,
        plan: fallback.plan_name,
        price_monthly: fallback.price_monthly,
      };
    }
    return null;
  }

  function buildMetrics(c) {
    return {
      cost_per_task: c.cost_per_task_estimate,
      time_value: c.time_value_per_task,
      total_effective_cost: Number(((c.cost_per_task_estimate || 0) + (c.time_value_per_task || 0)).toFixed(2)),
      first_attempt_rate: c.first_attempt_success_rate,
      avg_messages: c.avg_messages_to_complete,
      avg_minutes: c.avg_minutes_to_complete,
      autonomy_score: c.autonomy_score,
      steering_effort: c.steering_effort,
    };
  }

  function buildModel(c) {
    return {
      name: c.model_name,
      slug: c.model_slug,
      composite_score: c.composite_score,
      vendor: c.vendor,
    };
  }

  const recommendations = [];

  if (bestOverall) {
    const metrics = buildMetrics(bestOverall);
    const successPct = Math.round((bestOverall.first_attempt_success_rate || 0) * 100);
    recommendations.push({
      tier: 'best_overall',
      model: buildModel(bestOverall),
      tool: findTool(bestOverall),
      metrics,
      reasoning: `Highest quality (score ${bestOverall.composite_score}) with ${successPct}% first-attempt success. ${bestOverall.steering_effort || 'Low'} steering needed.`,
    });
  }

  if (bestValue && (!bestOverall || bestValue.model_id !== bestOverall.model_id)) {
    const metrics = buildMetrics(bestValue);
    const frontierMinutes = bestOverall ? (bestOverall.avg_minutes_to_complete || 0) : 0;
    const savedMinutes = Math.max(0, (bestValue.avg_minutes_to_complete || 0) - frontierMinutes);
    recommendations.push({
      tier: 'best_value',
      model: buildModel(bestValue),
      tool: findTool(bestValue),
      metrics,
      reasoning: `Best real-world value at $${metrics.total_effective_cost.toFixed(2)} total cost (including $${(metrics.time_value || 0).toFixed(2)} developer time).${savedMinutes > 0 ? ` Saves ${savedMinutes} minutes vs frontier.` : ''}`,
    });
  }

  if (budgetPick && (!bestOverall || budgetPick.model_id !== bestOverall.model_id) &&
      (!bestValue || budgetPick.model_id !== bestValue.model_id)) {
    const metrics = buildMetrics(budgetPick);
    recommendations.push({
      tier: 'budget_pick',
      model: buildModel(budgetPick),
      tool: findTool(budgetPick),
      metrics,
      reasoning: `Cheapest at $${(metrics.cost_per_task || 0).toFixed(2)}/task. Requires more steering but fits tight budgets.`,
    });
  }

  return c.json({
    task: { name: task.name, slug: task.slug, complexity: task.complexity },
    recommendations,
  });
});

// POST /api/advisor/chat — AI-powered conversational model recommender
advisorRoutes.post('/chat', async (c) => {
  const body = await c.req.json();
  const messages = body.messages || [];

  if (!messages.length || messages.length > 20) {
    return c.json({ error: 'messages required (max 20)' }, 400);
  }

  // Cap individual message length to prevent abuse (2000 chars each)
  for (const msg of messages) {
    if (typeof msg.content === 'string' && msg.content.length > 2000) {
      msg.content = msg.content.slice(0, 2000);
    }
  }

  // Stricter rate limit for AI compute endpoint (10 req/min per IP)
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const chatKey = `ratelimit:chat:${ip}`;
  const chatCount = parseInt(await c.env.RATE_LIMIT.get(chatKey) || '0', 10);
  if (chatCount >= 10) {
    return c.json({ error: 'Too many chat requests. Please wait a minute.' }, 429);
  }
  await c.env.RATE_LIMIT.put(chatKey, String(chatCount + 1), { expirationTtl: 60 });

  // 1. Gather context data for the system prompt
  const { results: tasks } = await c.env.DB.prepare(
    'SELECT name, slug, description, complexity FROM task_profiles ORDER BY sort_order'
  ).all();

  const { results: topModels } = await c.env.DB.prepare(`
    SELECT m.name, m.slug, m.vendor, m.input_price_per_mtok, m.output_price_per_mtok,
           mcs.composite_score
    FROM model_composite_scores mcs
    JOIN models m ON m.id = mcs.model_id
    WHERE m.is_active = 1
    ORDER BY mcs.composite_score DESC
    LIMIT 15
  `).all();

  const { results: availability } = await c.env.DB.prepare(`
    SELECT m.slug as model_slug, t.name as tool_name, pp.plan_name, pp.price_monthly, ma.access_level
    FROM model_availability ma
    JOIN models m ON m.id = ma.model_id
    JOIN tools t ON t.id = ma.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id AND pp.is_current = 1
    WHERE m.is_active = 1
    ORDER BY pp.price_monthly ASC NULLS LAST
    LIMIT 80
  `).all();

  const taskList = tasks.map(t => `- ${t.name} (${t.slug}): ${t.description || ''} [complexity: ${t.complexity}/5]`).join('\n');
  const modelList = topModels.map(m =>
    `- ${m.name} (${m.vendor}): score=${m.composite_score?.toFixed(1) || '?'}, $${m.input_price_per_mtok || '?'}/$${m.output_price_per_mtok || '?'} per MTok`
  ).join('\n');

  // Group availability by model
  const modelInfoBySlug = new Map(topModels.map(m => [m.slug, m]));
  const availMap = {};
  for (const a of availability) {
    const model = modelInfoBySlug.get(a.model_slug);
    if (!model) continue;
    if (!getAdvisorAvailability(model, [a]).length) continue;
    if (!availMap[a.model_slug]) availMap[a.model_slug] = [];
    const monthlyPrice = a.price_monthly != null ? `$${a.price_monthly}/mo` : 'BYOK';
    availMap[a.model_slug].push(`${a.tool_name} ${a.plan_name || ''} (${monthlyPrice})`);
  }
  const availList = Object.entries(availMap).map(([slug, tools]) =>
    `- ${slug}: ${tools.slice(0, 3).join(', ')}`
  ).join('\n');

  // 2. Build system prompt
  const systemPrompt = `You are the AllThingsAI Model Advisor — a friendly, knowledgeable AI that helps users find the perfect AI model for their needs at the best price.

YOUR ROLE:
- Ask 2-3 focused questions to understand what the user needs
- Recommend specific models with real data (scores, prices, where to use them)
- Be concise and conversational, not robotic

CONVERSATION FLOW:
1. First message: Ask what they mainly use AI for and what matters most (quality vs cost vs speed)
2. Second message: Ask about their monthly price range / budget — be specific. Offer brackets: "Free tier only", "Under $20/mo", "$20-50/mo", "$50-100/mo", or "Budget is flexible". This is a REQUIRED step — do not skip it, do not recommend before asking it.
3. Third message (optional): If coding, ask what kind (greenfield, debugging, refactoring, code review) and team size. Skip if already clear.
4. Based on answers: Give your top 1-3 recommendations with reasoning, filtered to their budget.

WHEN RECOMMENDING, you MUST include for each model:
- Model name and vendor
- Quality score (out of 100)
- Token pricing
- Where to use it (which tool + plan + monthly price)
- Why this model fits their needs

After gathering enough info (usually 3 exchanges including the price-range question), output your recommendation in this EXACT format, on its own line:
[RECOMMEND]{"task":"<task_slug>","priority":"<quality|value|budget>","max_price_monthly":<number|null>,"use_case":"<brief description>"}[/RECOMMEND]

For max_price_monthly: use 0 for "free tier only", 20 for "under $20", 50 for "under $50 / $20-50", 100 for "$50-100", and null for "flexible". Never omit this field.

The system will inject real recommendation data when it sees this tag.

AVAILABLE TASK PROFILES:
${taskList}

TOP MODELS (by composite quality score):
${modelList}

WHERE TO USE THEM (cheapest options):
${availList}

RULES:
- Never make up scores, prices, or availability — use ONLY the data above
- If asked about a model not in the list, say you don't have data for it yet
- Keep responses under 150 words unless giving final recommendations
- Be enthusiastic but honest about trade-offs
- Always mention the cheapest way to access a recommended model`;

  // 3. Call Workers AI
  const aiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  let aiResponse;
  try {
    aiResponse = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: aiMessages,
      max_tokens: 500,
      temperature: 0.7,
    });
  } catch (e) {
    console.error('[ADVISOR-CHAT] Workers AI error:', e.message);
    return c.json({ error: 'AI service temporarily unavailable' }, 503);
  }

  const reply = aiResponse.response || aiResponse.result?.response || '';

  // 4. Check if the AI wants to make a recommendation
  const recommendMatch = reply.match(/\[RECOMMEND\](.*?)\[\/RECOMMEND\]/s);
  let recommendations = null;

  if (recommendMatch) {
    try {
      const params = JSON.parse(recommendMatch[1]);
      // Query real recommendation data
      const taskSlug = params.task || 'implementation';
      const task = await c.env.DB.prepare('SELECT id, name, slug FROM task_profiles WHERE slug = ?').bind(taskSlug).first();

      if (task) {
        const { results: candidates } = await c.env.DB.prepare(`
          SELECT mte.*, m.name as model_name, m.slug as model_slug, m.vendor,
                 m.input_price_per_mtok, m.output_price_per_mtok,
                 mcs.composite_score
          FROM model_task_estimates mte
          JOIN models m ON m.id = mte.model_id
          LEFT JOIN model_composite_scores mcs ON mcs.model_id = mte.model_id
          WHERE mte.task_profile_id = ? AND m.is_active = 1
          ORDER BY mcs.composite_score DESC
        `).bind(task.id).all();

        // Get availability for top candidates
        const topIds = candidates.slice(0, 10).map(c => c.model_id);
        const placeholders = topIds.map(() => '?').join(',');
        const { results: avail } = topIds.length ? await c.env.DB.prepare(`
          SELECT ma.model_id, t.name as tool_name, pp.plan_name, pp.price_monthly, ma.access_level,
            pp.included_requests, pp.overage_model, pp.usage_notes, ma.credits_per_request
          FROM model_availability ma
          JOIN tools t ON t.id = ma.tool_id
          LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id AND pp.is_current = 1
          WHERE ma.model_id IN (${placeholders})
          ORDER BY pp.price_monthly ASC NULLS LAST
        `).bind(...topIds).all() : { results: [] };

        const availByModel = {};
        for (const a of (avail.results || avail || [])) {
          const model = candidates.find((candidate) => candidate.model_id === a.model_id);
          if (!model) continue;
          if (!getAdvisorAvailability(model, [a]).length) continue;
          if (!availByModel[a.model_id]) availByModel[a.model_id] = [];
          availByModel[a.model_id].push(a);
        }

        // Apply price-range filter: drop candidates whose cheapest access plan exceeds budget
        const maxPrice = Number.isFinite(params.max_price_monthly) ? Number(params.max_price_monthly) : null;
        let budgetFiltered = candidates;
        if (maxPrice != null) {
          budgetFiltered = candidates.filter((cand) => {
            const avs = availByModel[cand.model_id] || [];
            if (!avs.length) return false; // no known paid access → exclude if budget-capped
            return avs.some((a) => (a.price_monthly ?? 0) <= maxPrice);
          });
          // Fallback: if budget filter nukes everything, keep original list
          if (budgetFiltered.length === 0) budgetFiltered = candidates;
        }

        // Build top 3 recommendations based on priority
        const priority = params.priority || 'quality';
        let sorted;
        if (priority === 'budget') {
          sorted = [...budgetFiltered].sort((a, b) => (a.cost_per_task_estimate ?? 999) - (b.cost_per_task_estimate ?? 999));
        } else if (priority === 'value') {
          sorted = [...budgetFiltered]
            .filter(c => (c.composite_score || 0) >= 60)
            .sort((a, b) => {
              const costA = (a.cost_per_task_estimate || 0) + (a.time_value_per_task || 0);
              const costB = (b.cost_per_task_estimate || 0) + (b.time_value_per_task || 0);
              return costA - costB;
            });
        } else {
          sorted = [...budgetFiltered].sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0));
        }

        recommendations = sorted.slice(0, 3).map(m => ({
          name: m.model_name,
          slug: m.model_slug,
          vendor: m.vendor,
          composite_score: m.composite_score,
          input_price: m.input_price_per_mtok,
          output_price: m.output_price_per_mtok,
          success_rate: m.first_attempt_success_rate,
          cost_per_task: m.cost_per_task_estimate,
          steering_effort: m.steering_effort,
          available_on: (availByModel[m.model_id] || []).slice(0, 3).map(a => ({
            tool: a.tool_name,
            plan: a.plan_name,
            price: a.price_monthly,
          })),
        }));
      }
    } catch (e) {
      console.error('[ADVISOR-CHAT] Recommendation parse error:', e.message);
    }
  }

  // Strip the [RECOMMEND] tag from the visible reply
  const cleanReply = reply.replace(/\[RECOMMEND\].*?\[\/RECOMMEND\]/s, '').trim();

  return c.json({
    reply: cleanReply,
    recommendations,
    done: recommendations != null,
  });
});

// GET /api/advisor/plan-burn — simulate plan consumption for a persona
// Query params: persona (preset key or "custom"), requests, premium_pct, heavy_pct
advisorRoutes.get('/plan-burn', async (c) => {
  const personaKey = c.req.query('persona') || 'solo-founder';
  const customRequests = c.req.query('requests');
  const customPremium = c.req.query('premium_pct');
  const customHeavy = c.req.query('heavy_pct');

  let persona;
  if (personaKey === 'custom') {
    const totalReq = parseInt(customRequests || '400', 10);
    const premPct = parseFloat(customPremium || '0.25');
    const heavyPct = parseFloat(customHeavy || '0.10');
    persona = {
      ...PERSONAS.custom,
      monthly_requests: Math.min(Math.max(totalReq, 10), 5000),
      premium_pct: Math.min(Math.max(premPct, 0), 1),
      heavy_pct: Math.min(Math.max(heavyPct, 0), 1),
      standard_pct: Math.max(0, 1 - premPct - heavyPct),
    };
  } else {
    persona = PERSONAS[personaKey] || PERSONAS['solo-founder'];
  }

  // 1. Get all current plans (exclude BYOK)
  const { results: plans } = await c.env.DB.prepare(`
    SELECT pp.*, t.name as tool_name, t.slug as tool_slug, t.vendor
    FROM pricing_plans pp
    JOIN tools t ON t.id = pp.tool_id
    WHERE pp.is_current = 1 AND pp.plan_name NOT LIKE '%BYOK%'
    ORDER BY pp.price_monthly ASC NULLS LAST
  `).all();

  // 2. Get model availability per plan
  const { results: availability } = await c.env.DB.prepare(`
    SELECT
      ma.plan_id,
      m.slug, m.name,
      ma.access_level, ma.credits_per_request, ma.cost_notes
    FROM model_availability ma
    JOIN pricing_plans pp ON pp.id = ma.plan_id AND pp.is_current = 1
    JOIN models m ON m.id = ma.model_id
    WHERE m.is_active = 1 AND ma.plan_id IS NOT NULL
  `).all();

  const modelsByPlan = {};
  for (const row of availability) {
    if (!modelsByPlan[row.plan_id]) modelsByPlan[row.plan_id] = [];
    modelsByPlan[row.plan_id].push(row);
  }

  // 3. Simulate burn for each plan
  const burnResults = plans.map(plan =>
    simulatePlanBurn(plan, persona, modelsByPlan[plan.id] || [])
  );

  // 4. Rank plans
  const ranked = rankPlansForPersona(burnResults);

  return c.json({
    persona: {
      key: personaKey,
      label: persona.label,
      description: persona.description,
      monthly_requests: persona.monthly_requests,
      model_mix: {
        standard: persona.standard_pct,
        premium: persona.premium_pct,
        heavy: persona.heavy_pct,
      },
    },
    personas: Object.entries(PERSONAS)
      .filter(([k]) => k !== 'custom')
      .map(([key, p]) => ({ key, label: p.label, description: p.description, monthly_requests: p.monthly_requests })),
    recommended: ranked[0] || null,
    all_plans: ranked,
  });
});
