import { Hono } from 'hono';

export const benchmarksRoutes = new Hono();

// GET /api/benchmarks — benchmark comparison matrix
benchmarksRoutes.get('/', async (c) => {
  const { category } = c.req.query();

  let query = `
    SELECT b.*, m.name as model_name, m.slug as model_slug, m.vendor
    FROM benchmarks b
    JOIN models m ON m.id = b.model_id
    WHERE m.is_active = 1
  `;
  const params = [];

  if (category) {
    query += ' AND b.category = ?';
    params.push(category);
  }

  query += ' ORDER BY b.category, b.score DESC';

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  // Group by category
  const grouped = {};
  for (const row of results) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push(row);
  }

  return c.json({ benchmarks: grouped, categories: Object.keys(grouped) });
});

// POST /api/benchmarks/compare — compare specific models (W1: validated)
benchmarksRoutes.post('/compare', async (c) => {
  const body = await c.req.json();
  const { model_slugs, categories } = body;
  if (!Array.isArray(model_slugs) || model_slugs.length === 0) {
    return c.json({ error: 'model_slugs must be a non-empty array' }, 400);
  }
  if (model_slugs.length > 20) {
    return c.json({ error: 'Maximum 20 models per comparison' }, 400);
  }
  if (categories && !Array.isArray(categories)) {
    return c.json({ error: 'categories must be an array' }, 400);
  }

  const placeholders = model_slugs.map(() => '?').join(',');
  let query = `
    SELECT b.*, m.name as model_name, m.slug as model_slug, m.vendor
    FROM benchmarks b
    JOIN models m ON m.id = b.model_id
    WHERE m.slug IN (${placeholders})
  `;
  const params = [...model_slugs];

  if (categories && categories.length) {
    const catPlaceholders = categories.map(() => '?').join(',');
    query += ` AND b.category IN (${catPlaceholders})`;
    params.push(...categories);
  }

  query += ' ORDER BY b.category, b.score DESC';

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});
