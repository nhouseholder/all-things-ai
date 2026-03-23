import { Hono } from 'hono';

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

// POST /api/cost/subscriptions — add subscription
costRoutes.post('/subscriptions', async (c) => {
  const { tool_id, plan_id, monthly_cost } = await c.req.json();
  await c.env.DB.prepare(
    'INSERT INTO user_subscriptions (tool_id, plan_id, monthly_cost, started_at) VALUES (?, ?, ?, datetime("now"))'
  ).bind(tool_id, plan_id, monthly_cost).run();
  return c.json({ ok: true });
});

// DELETE /api/cost/subscriptions/:id
costRoutes.delete('/subscriptions/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE user_subscriptions SET is_active = 0 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

// GET /api/cost/alternatives — cheaper alternatives for current stack
costRoutes.get('/alternatives', async (c) => {
  const { results: currentSubs } = await c.env.DB.prepare(
    'SELECT us.*, t.category FROM user_subscriptions us JOIN tools t ON t.id = us.tool_id WHERE us.is_active = 1'
  ).all();

  const alternatives = [];
  for (const sub of currentSubs) {
    const { results: cheaper } = await c.env.DB.prepare(`
      SELECT t.name, t.slug, pp.plan_name, pp.price_monthly, pp.features
      FROM pricing_plans pp
      JOIN tools t ON t.id = pp.tool_id
      WHERE t.category = ? AND pp.price_monthly < ? AND pp.is_current = 1 AND t.id != ?
      ORDER BY pp.price_monthly ASC
      LIMIT 5
    `).bind(sub.category, sub.monthly_cost, sub.tool_id).all();

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
