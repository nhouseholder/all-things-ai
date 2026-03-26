import { Hono } from 'hono';

export const toolsRoutes = new Hono();

// GET /api/tools — all tools with current pricing
toolsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT t.*,
      (SELECT json_group_array(json_object(
        'id', pp.id, 'plan_name', pp.plan_name, 'price_monthly', pp.price_monthly,
        'price_yearly', pp.price_yearly, 'features', pp.features, 'models_included', pp.models_included
      )) FROM pricing_plans pp WHERE pp.tool_id = t.id AND pp.is_current = 1) as plans
    FROM tools t ORDER BY t.name
  `).all();
  return c.json(results.map(t => ({ ...t, plans: JSON.parse(t.plans || '[]') })));
});

// GET /api/tools/rankings — tools ranked by composite score
toolsRoutes.get('/rankings', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT t.id, t.name, t.slug, t.vendor, t.category, t.logo_url, t.last_release_date,
           tcs.composite_score, tcs.model_breadth_score, tcs.pricing_score,
           tcs.community_score, tcs.feature_score, tcs.freshness_score, tcs.updated_at
    FROM tool_composite_scores tcs
    JOIN tools t ON t.id = tcs.tool_id
    ORDER BY tcs.composite_score DESC
  `).all();
  return c.json({ rankings: results, updated_at: results[0]?.updated_at || null });
});

// GET /api/tools/:slug
toolsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const tool = await c.env.DB.prepare('SELECT * FROM tools WHERE slug = ?').bind(slug).first();
  if (!tool) return c.json({ error: 'Not found' }, 404);

  const { results: plans } = await c.env.DB.prepare(
    'SELECT * FROM pricing_plans WHERE tool_id = ? AND is_current = 1'
  ).bind(tool.id).all();

  const { results: models } = await c.env.DB.prepare(`
    SELECT m.*, ma.access_level, ma.notes, pp.plan_name
    FROM model_availability ma
    JOIN models m ON m.id = ma.model_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
    WHERE ma.tool_id = ?
  `).bind(tool.id).all();

  return c.json({ ...tool, plans, models });
});
