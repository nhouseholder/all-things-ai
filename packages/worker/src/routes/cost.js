import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';

export const costRoutes = new Hono();

// GET /api/cost/summary — current monthly spend
costRoutes.get('/summary', async (c) => {
  const { results: subs } = await c.env.DB.prepare(`
    SELECT us.*, t.name as tool_name, t.slug as tool_slug, pp.plan_name
    FROM user_subscriptions us
    JOIN tools t ON t.id = us.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = us.plan_id
    WHERE us.is_active = 1
  `).all();

  const totalMonthly = subs.reduce((sum, s) => sum + s.monthly_cost, 0);

  return c.json({
    subscriptions: subs,
    total_monthly: totalMonthly,
    total_yearly: totalMonthly * 12,
  });
});

// GET /api/cost/subscriptions
costRoutes.get('/subscriptions', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT us.*, t.name as tool_name, t.slug as tool_slug, pp.plan_name
    FROM user_subscriptions us
    JOIN tools t ON t.id = us.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = us.plan_id
    ORDER BY us.monthly_cost DESC
  `).all();
  return c.json(results);
});

// POST /api/cost/subscriptions — add subscription (W1: validated, C1: auth)
costRoutes.post('/subscriptions', requireAdmin(), async (c) => {
  const body = await c.req.json();
  const { tool_id, plan_id, monthly_cost } = body;
  if (!tool_id || typeof tool_id !== 'number' || !plan_id || typeof plan_id !== 'number') {
    return c.json({ error: 'tool_id and plan_id are required integers' }, 400);
  }
  if (typeof monthly_cost !== 'number' || monthly_cost < 0) {
    return c.json({ error: 'monthly_cost must be a non-negative number' }, 400);
  }
  await c.env.DB.prepare(
    'INSERT INTO user_subscriptions (tool_id, plan_id, monthly_cost, started_at) VALUES (?, ?, ?, datetime("now"))'
  ).bind(tool_id, plan_id, monthly_cost).run();
  return c.json({ ok: true });
});

// DELETE /api/cost/subscriptions/:id (C1: auth required)
costRoutes.delete('/subscriptions/:id', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE user_subscriptions SET is_active = 0 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

// GET /api/cost/optimizer — all models with availability + alternatives for optimization
costRoutes.get('/optimizer', async (c) => {
  // 1. All active models with pricing and quality score
  const { results: models } = await c.env.DB.prepare(`
    SELECT m.id, m.name, m.slug, m.vendor, m.family,
           m.input_price_per_mtok, m.output_price_per_mtok, m.context_window,
           mcs.composite_score
    FROM models m
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
    WHERE m.is_active = 1
    ORDER BY mcs.composite_score DESC NULLS LAST
  `).all();

  if (!models.length) return c.json({ models: [] });

  // 2. Model availability — which tools/plans offer each model
  const { results: availability } = await c.env.DB.prepare(`
    SELECT ma.model_id, t.name as tool_name, t.slug as tool_slug,
           pp.plan_name, pp.price_monthly, ma.access_level,
           pp.included_requests, pp.overage_rate_description
    FROM model_availability ma
    JOIN tools t ON t.id = ma.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id AND pp.is_current = 1
  `).all();

  const availByModel = {};
  for (const a of availability) {
    if (!availByModel[a.model_id]) availByModel[a.model_id] = [];
    availByModel[a.model_id].push({
      tool: a.tool_name,
      tool_slug: a.tool_slug,
      plan: a.plan_name,
      price_monthly: a.price_monthly,
      access_level: a.access_level,
      included_requests: a.included_requests,
      overage: a.overage_rate_description,
    });
  }

  // 3. Model alternatives with similarity and savings
  const { results: alternatives } = await c.env.DB.prepare(`
    SELECT ma.model_id, ma.similarity_score, ma.cost_savings_pct, ma.trade_off_notes,
           m.name as alt_name, m.slug as alt_slug, m.vendor as alt_vendor,
           m.input_price_per_mtok as alt_input_price, m.output_price_per_mtok as alt_output_price,
           mcs.composite_score as alt_composite_score
    FROM model_alternatives ma
    JOIN models m ON m.id = ma.alternative_model_id
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = ma.alternative_model_id
    WHERE m.is_active = 1
    ORDER BY ma.cost_savings_pct DESC
  `).all();

  const altsByModel = {};
  for (const a of alternatives) {
    if (!altsByModel[a.model_id]) altsByModel[a.model_id] = [];
    altsByModel[a.model_id].push({
      name: a.alt_name,
      slug: a.alt_slug,
      vendor: a.alt_vendor,
      similarity: a.similarity_score,
      cost_savings_pct: a.cost_savings_pct,
      trade_off_notes: a.trade_off_notes,
      input_price: a.alt_input_price,
      output_price: a.alt_output_price,
      composite_score: a.alt_composite_score,
    });
  }

  // 4. Assemble response
  const result = models.map(m => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    vendor: m.vendor,
    family: m.family,
    input_price: m.input_price_per_mtok,
    output_price: m.output_price_per_mtok,
    context_window: m.context_window,
    composite_score: m.composite_score,
    available_on: (availByModel[m.id] || []).sort((a, b) => (a.price_monthly || 999) - (b.price_monthly || 999)),
    alternatives: (altsByModel[m.id] || []).slice(0, 5),
  }));

  return c.json({ models: result });
});

// GET /api/cost/alternatives — cheaper alternatives for current stack (W2: single query)
costRoutes.get('/alternatives', async (c) => {
  const { results: currentSubs } = await c.env.DB.prepare(`
    SELECT us.id, us.tool_id, us.monthly_cost, t.name as tool_name, t.category
    FROM user_subscriptions us
    JOIN tools t ON t.id = us.tool_id
    WHERE us.is_active = 1
  `).all();

  if (!currentSubs.length) return c.json([]);

  // Collect all categories and build a single query for all alternatives
  const categories = [...new Set(currentSubs.map(s => s.category))];
  const catPlaceholders = categories.map(() => '?').join(',');
  const toolIds = currentSubs.map(s => s.tool_id);
  const toolPlaceholders = toolIds.map(() => '?').join(',');

  const { results: allAlts } = await c.env.DB.prepare(`
    SELECT t.id as tool_id, t.name, t.slug, t.category, pp.plan_name, pp.price_monthly, pp.features
    FROM pricing_plans pp
    JOIN tools t ON t.id = pp.tool_id
    WHERE t.category IN (${catPlaceholders})
      AND pp.is_current = 1
      AND t.id NOT IN (${toolPlaceholders})
      AND pp.price_monthly IS NOT NULL
      AND pp.price_monthly > 0
    ORDER BY pp.price_monthly ASC
  `).bind(...categories, ...toolIds).all();

  // Match alternatives to each subscription
  const alternatives = [];
  for (const sub of currentSubs) {
    const cheaper = allAlts
      .filter(a => a.category === sub.category && a.price_monthly < sub.monthly_cost)
      .slice(0, 5);
    if (cheaper.length) {
      alternatives.push({
        current_tool: sub.tool_name,
        current_cost: sub.monthly_cost,
        alternatives: cheaper,
      });
    }
  }

  return c.json(alternatives);
});
