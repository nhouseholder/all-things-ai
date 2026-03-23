import { Hono } from 'hono';

export const feedRoutes = new Hono();

// GET /api/feed — paginated news feed
feedRoutes.get('/', async (c) => {
  const { source, tag, page = '1', limit = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = 'SELECT * FROM news_items WHERE 1=1';
  const params = [];

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }
  if (tag) {
    query += ' AND relevance_tags LIKE ?';
    params.push(`%${tag}%`);
  }

  query += ' ORDER BY relevance_score DESC, published_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  const countQuery = 'SELECT COUNT(*) as total FROM news_items';
  const { results: countResults } = await c.env.DB.prepare(countQuery).all();

  return c.json({
    items: results,
    total: countResults[0].total,
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

// GET /api/feed/:id
feedRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const item = await c.env.DB.prepare('SELECT * FROM news_items WHERE id = ?').bind(id).first();
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

// POST /api/feed/:id/read
feedRoutes.post('/:id/read', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE news_items SET is_read = 1 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

// POST /api/feed/:id/bookmark
feedRoutes.post('/:id/bookmark', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE news_items SET is_bookmarked = CASE WHEN is_bookmarked = 1 THEN 0 ELSE 1 END WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});
