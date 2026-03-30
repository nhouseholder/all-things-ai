import { Hono } from 'hono';

export const advisorRoutes = new Hono();

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
// Cached in KV for 6 hours (refreshed by cron after computeCompositeScores)
advisorRoutes.get('/rankings', async (c) => {
  const cache = c.env.CACHE;
  if (cache) {
    const cached = await cache.get('rankings:v1', 'json');
    if (cached) return c.json(cached);
  }

  const { results } = await c.env.DB.prepare(`
    SELECT
      mcs.*,
      m.name as model_name, m.slug as model_slug,
      m.vendor, m.family,
      m.input_price_per_mtok, m.output_price_per_mtok
    FROM model_composite_scores mcs
    JOIN models m ON m.id = mcs.model_id
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
      SUM(COALESCE(heavy_coder_count, 0)) as heavy_count,
      SUM(COALESCE(vibe_coder_count, 0)) as vibe_count,
      SUM(COALESCE(casual_count, 0)) as casual_count
    FROM community_reviews
    GROUP BY model_id
  `).all();

  const reviewMap = new Map(reviewSummary.map(r => [r.model_id, r]));

  const bestOverall = results.map(m => {
    const rev = reviewMap.get(m.model_id);
    return {
      ...m,
      community_reviews: rev?.total_reviews || 0,
      community_sources: rev?.source_count || 0,
      community_satisfaction: rev?.avg_satisfaction || null,
      community_heavy: rev?.heavy_count || 0,
      community_vibe: rev?.vibe_count || 0,
      community_casual: rev?.casual_count || 0,
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

  const response = { best_overall: bestOverall, bang_for_buck: bangForBuck };

  // Cache for 6 hours (21600 seconds)
  if (cache) {
    await cache.put('rankings:v1', JSON.stringify(response), { expirationTtl: 21600 });
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
      pp.plan_name, pp.price_monthly
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
    (c.cost_per_task_estimate || Infinity) < (best.cost_per_task_estimate || Infinity) ? c : best
  );

  // 5. Build recommendations
  function findTool(modelId) {
    // Prefer task-specific tool recommendation, fallback to model availability
    if (toolRecs.length) {
      const modelTools = toolsByModel[modelId] || [];
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
    const fallback = (toolsByModel[modelId] || [])[0];
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
      tool: findTool(bestOverall.model_id),
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
      tool: findTool(bestValue.model_id),
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
      tool: findTool(budgetPick.model_id),
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
    SELECT m.slug as model_slug, t.name as tool_name, pp.plan_name, pp.price_monthly
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
  const availMap = {};
  for (const a of availability) {
    if (!availMap[a.model_slug]) availMap[a.model_slug] = [];
    availMap[a.model_slug].push(`${a.tool_name} ${a.plan_name || ''} ($${a.price_monthly || 'BYOK'}/mo)`);
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
2. If coding: Ask what kind (greenfield, debugging, refactoring, code review) and team size
3. Based on answers: Give your top 1-3 recommendations with reasoning

WHEN RECOMMENDING, you MUST include for each model:
- Model name and vendor
- Quality score (out of 100)
- Token pricing
- Where to use it (which tool + plan + monthly price)
- Why this model fits their needs

After gathering enough info (usually 2-3 exchanges), output your recommendation in this EXACT format, on its own line:
[RECOMMEND]{"task":"<task_slug>","priority":"<quality|value|budget>","use_case":"<brief description>"}[/RECOMMEND]

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
          SELECT ma.model_id, t.name as tool_name, pp.plan_name, pp.price_monthly
          FROM model_availability ma
          JOIN tools t ON t.id = ma.tool_id
          LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id AND pp.is_current = 1
          WHERE ma.model_id IN (${placeholders})
          ORDER BY pp.price_monthly ASC NULLS LAST
        `).bind(...topIds).all() : { results: [] };

        const availByModel = {};
        for (const a of (avail.results || avail || [])) {
          if (!availByModel[a.model_id]) availByModel[a.model_id] = [];
          availByModel[a.model_id].push(a);
        }

        // Build top 3 recommendations based on priority
        const priority = params.priority || 'quality';
        let sorted;
        if (priority === 'budget') {
          sorted = [...candidates].sort((a, b) => (a.cost_per_task_estimate || 999) - (b.cost_per_task_estimate || 999));
        } else if (priority === 'value') {
          sorted = [...candidates]
            .filter(c => (c.composite_score || 0) >= 60)
            .sort((a, b) => {
              const costA = (a.cost_per_task_estimate || 0) + (a.time_value_per_task || 0);
              const costB = (b.cost_per_task_estimate || 0) + (b.time_value_per_task || 0);
              return costA - costB;
            });
        } else {
          sorted = [...candidates].sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0));
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
