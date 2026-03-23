import { Hono } from 'hono';

export const modelsRoutes = new Hono();

// GET /api/models — all models with latest benchmarks
modelsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT m.*,
      (SELECT json_group_array(json_object(
        'benchmark_name', b.benchmark_name, 'category', b.category,
        'score', b.score, 'max_score', b.max_score
      )) FROM benchmarks b WHERE b.model_id = m.id) as benchmark_scores
    FROM models m WHERE m.is_active = 1 ORDER BY m.name
  `).all();
  return c.json(results.map(m => ({ ...m, benchmark_scores: JSON.parse(m.benchmark_scores || '[]') })));
});

// GET /api/models/:slug
modelsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const model = await c.env.DB.prepare('SELECT * FROM models WHERE slug = ?').bind(slug).first();
  if (!model) return c.json({ error: 'Not found' }, 404);

  const { results: benchmarkScores } = await c.env.DB.prepare(
    'SELECT * FROM benchmarks WHERE model_id = ?'
  ).bind(model.id).all();

  const { results: availability } = await c.env.DB.prepare(`
    SELECT t.name as tool_name, t.slug as tool_slug, pp.plan_name, pp.price_monthly, ma.access_level
    FROM model_availability ma
    JOIN tools t ON t.id = ma.tool_id
    LEFT JOIN pricing_plans pp ON pp.id = ma.plan_id
    WHERE ma.model_id = ?
  `).bind(model.id).all();

  return c.json({ ...model, benchmarks: benchmarkScores, availability });
});
