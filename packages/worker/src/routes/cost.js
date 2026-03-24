import { Hono } from 'hono';

export const costRoutes = new Hono();

// C1: Admin auth for mutation endpoints
function requireAdmin() {
  return async (c, next) => {
    const auth = c.req.header('Authorization');
    const adminKey = c.env.ADMIN_API_KEY;
    if (!adminKey || !auth || auth !== `Bearer ${adminKey}`) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  };
}

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
