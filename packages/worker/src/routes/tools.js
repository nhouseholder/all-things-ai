import { Hono } from 'hono';

export const toolsRoutes = new Hono();

// GET /api/tools — all tools with current pricing
toolsRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT t.*,
      (SELECT json_group_array(json_object(
        'id', pp.id, 'plan_name', pp.plan_name, 'price_monthly', pp.price_monthly,
        'price_yearly', pp.price_yearly, 'features', pp.features, 'models_included', pp.models_included,
        'included_requests', pp.included_requests, 'overage_model', pp.overage_model,
        'overage_rate_description', pp.overage_rate_description, 'usage_notes', pp.usage_notes
      )) FROM pricing_plans pp WHERE pp.tool_id = t.id AND pp.is_current = 1) as plans,
      (SELECT json_group_array(json_object(
        'source', tr.source, 'sentiment_score', tr.sentiment_score, 'satisfaction', tr.satisfaction,
        'review_count', tr.review_count, 'common_praises', tr.common_praises, 'common_complaints', tr.common_complaints
      )) FROM tool_reviews tr WHERE tr.tool_id = t.id) as reviews
    FROM tools t ORDER BY t.name
  `).all();
  return c.json(results.map(t => ({
    ...t,
    plans: JSON.parse(t.plans || '[]'),
    reviews: JSON.parse(t.reviews || '[]').filter(r => r.source),
  })));
});

// GET /api/tools/plans — all plans with full detail for comparison page
toolsRoutes.get('/plans', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT pp.*, t.name as tool_name, t.slug as tool_slug, t.vendor, t.category,
           t.description as tool_description, t.install_url, t.install_method,
           (SELECT json_group_array(json_object(
             'source', tr.source, 'satisfaction', tr.satisfaction, 'review_count', tr.review_count,
             'common_praises', tr.common_praises, 'common_complaints', tr.common_complaints
           )) FROM tool_reviews tr WHERE tr.tool_id = t.id) as reviews
    FROM pricing_plans pp
    JOIN tools t ON t.id = pp.tool_id
    WHERE pp.is_current = 1
    ORDER BY pp.price_monthly ASC NULLS LAST
  `).all();

  const plans = results.map(p => {
    let features = p.features;
    let models = p.models_included;
    let reviews = p.reviews;
    try { features = JSON.parse(features); } catch {}
    try { models = JSON.parse(models); } catch {}
    try { reviews = JSON.parse(reviews)?.filter(r => r.source) || []; } catch { reviews = []; }
    return { ...p, features, models_included: models, reviews };
  });

  return c.json({ plans });
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
