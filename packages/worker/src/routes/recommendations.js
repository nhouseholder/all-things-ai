import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';

export const recommendationsRoutes = new Hono();

// GET /api/recommendations — active recommendations
recommendationsRoutes.get('/', async (c) => {
  const { type, limit = '10' } = c.req.query();

  let query = `
    SELECT r.*,
      t.name as tool_name, t.slug as tool_slug,
      m.name as model_name, m.slug as model_slug
    FROM recommendations r
    LEFT JOIN tools t ON t.id = r.related_tool_id
    LEFT JOIN models m ON m.id = r.related_model_id
    WHERE r.is_dismissed = 0
  `;
  const params = [];

  if (type) {
    query += ' AND r.type = ?';
    params.push(type);
  }

  query += ' ORDER BY r.priority DESC, r.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// POST /api/recommendations/:id/dismiss — requires auth
recommendationsRoutes.post('/:id/dismiss', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE recommendations SET is_dismissed = 1 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});
