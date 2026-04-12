import { Hono } from 'hono';
import {
  buildPlanRecords,
  isCatalogVisiblePlan,
  isCodingSubscriptionPlan,
} from '../services/plan-catalog.js';

export const toolsRoutes = new Hono();

const PLAN_QUERY = `
  SELECT pp.*, t.name as tool_name, t.slug as tool_slug, t.vendor, t.category,
         t.description as tool_description, t.website_url, t.pricing_page_url,
         t.install_url, t.install_method,
         (SELECT json_group_array(json_object(
           'source', tr.source, 'satisfaction', tr.satisfaction, 'review_count', tr.review_count,
           'common_praises', tr.common_praises, 'common_complaints', tr.common_complaints
         )) FROM tool_reviews tr WHERE tr.tool_id = t.id) as reviews
  FROM pricing_plans pp
  JOIN tools t ON t.id = pp.tool_id
  WHERE pp.is_current = 1
`;

const MODEL_PRICING_QUERY = `
  SELECT slug, name, vendor, input_price_per_mtok, output_price_per_mtok
  FROM models
  WHERE is_active = 1
`;

const AVAILABILITY_QUERY = `
  SELECT
    ma.plan_id,
    m.slug, m.name, m.vendor,
    m.input_price_per_mtok, m.output_price_per_mtok,
    ma.access_level, ma.credits_per_request, ma.cost_notes
  FROM model_availability ma
  JOIN pricing_plans pp ON pp.id = ma.plan_id AND pp.is_current = 1
  JOIN models m ON m.id = ma.model_id
  WHERE m.is_active = 1
    AND ma.plan_id IS NOT NULL
`;

function comparePlansByPrice(a, b) {
  const priceA = a.price_anchor ?? Number.POSITIVE_INFINITY;
  const priceB = b.price_anchor ?? Number.POSITIVE_INFINITY;

  if (priceA !== priceB) return priceA - priceB;
  return `${a.tool_name} ${a.plan_name}`.localeCompare(`${b.tool_name} ${b.plan_name}`);
}

async function loadPlanRecords(env) {
  const { results } = await env.DB.prepare(`${PLAN_QUERY} ORDER BY pp.price_monthly ASC NULLS LAST, t.name, pp.plan_name`).all();

  const { results: allModels } = await env.DB.prepare(MODEL_PRICING_QUERY).all();
  const modelPricing = {};
  for (const model of allModels) modelPricing[model.slug] = model;

  const { results: availabilityRows } = await env.DB.prepare(AVAILABILITY_QUERY).all();

  return buildPlanRecords(results, modelPricing, availabilityRows).sort(comparePlansByPrice);
}

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
  const plans = (await loadPlanRecords(c.env)).filter(isCatalogVisiblePlan);

  return c.json({ plans });
});

// GET /api/tools/coding-plans — dedicated coding subscription comparison data
toolsRoutes.get('/coding-plans', async (c) => {
  const plans = (await loadPlanRecords(c.env)).filter(isCodingSubscriptionPlan);
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
