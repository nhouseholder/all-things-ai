import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';

export const alertsRoutes = new Hono();

// GET /api/alerts — list alerts with optional filters
alertsRoutes.get('/', async (c) => {
  const { type, importance, unread, limit = '50', offset = '0' } = c.req.query();

  let where = ['is_dismissed = 0'];
  const params = [];

  if (type) {
    where.push('event_type = ?');
    params.push(type);
  }
  if (importance) {
    where.push('importance = ?');
    params.push(importance);
  }
  if (unread === '1') {
    where.push('is_read = 0');
  }

  const countQuery = `SELECT COUNT(*) as total FROM industry_alerts WHERE ${where.join(' AND ')}`;
  const { total } = await c.env.DB.prepare(countQuery).bind(...params).first();

  const query = `
    SELECT id, source, source_url, event_type, title, summary, importance,
           is_read, detected_at, published_at, metadata
    FROM industry_alerts
    WHERE ${where.join(' AND ')}
    ORDER BY detected_at DESC
    LIMIT ? OFFSET ?
  `;

  const { results } = await c.env.DB.prepare(query)
    .bind(...params, parseInt(limit), parseInt(offset))
    .all();

  return c.json({ alerts: results, total });
});

// GET /api/alerts/unread-count — quick badge count
alertsRoutes.get('/unread-count', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM industry_alerts WHERE is_read = 0 AND is_dismissed = 0'
  ).first();
  return c.json({ count: row.count });
});

// POST /api/alerts/:id/read — mark as read (auth required)
alertsRoutes.post('/:id/read', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE industry_alerts SET is_read = 1 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

// POST /api/alerts/read-all — mark all as read (auth required)
alertsRoutes.post('/read-all', requireAdmin(), async (c) => {
  await c.env.DB.prepare('UPDATE industry_alerts SET is_read = 1 WHERE is_read = 0').run();
  return c.json({ ok: true });
});

// POST /api/alerts/:id/dismiss — hide alert (auth required)
alertsRoutes.post('/:id/dismiss', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE industry_alerts SET is_dismissed = 1 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});
