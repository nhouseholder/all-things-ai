import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';

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

  // C4: Build count query with same filters before adding LIMIT/OFFSET
  let countQuery = 'SELECT COUNT(*) as total FROM news_items WHERE 1=1';
  const countParams = [...params];
  if (source) countQuery += ' AND source = ?';
  if (tag) countQuery += ' AND relevance_tags LIKE ?';

  query += ' ORDER BY relevance_score DESC, published_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  const { results: countResults } = await c.env.DB.prepare(countQuery).bind(...countParams).all();

  return c.json({
    items: results,
    total: countResults[0].total,
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

// GET /api/feed/whats-new — aggregated "What's New" digest
feedRoutes.get('/whats-new', async (c) => {
  const [recentModels, recentAlerts, pendingModels, recentPricing] = await Promise.all([
    // Recently added models (last 30 days)
    c.env.DB.prepare(`
      SELECT name, slug, vendor, family, discovery_source, created_at,
        input_price_per_mtok, output_price_per_mtok, is_open_weight
      FROM models
      WHERE is_active = 1
        AND created_at >= datetime('now', '-30 days')
      ORDER BY created_at DESC
      LIMIT 20
    `).all(),

    // Recent high-importance alerts
    c.env.DB.prepare(`
      SELECT id, source, event_type, title, summary, importance, detected_at, source_url
      FROM industry_alerts
      WHERE is_dismissed = 0
        AND detected_at >= datetime('now', '-14 days')
      ORDER BY
        CASE importance WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        detected_at DESC
      LIMIT 15
    `).all(),

    // Pending / coming soon models
    c.env.DB.prepare(`
      SELECT name, slug, vendor, family, description, discovery_source, created_at
      FROM pending_models
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 10
    `).all(),

    // Recent pricing changes from alerts
    c.env.DB.prepare(`
      SELECT id, title, summary, detected_at, source_url, metadata
      FROM industry_alerts
      WHERE event_type = 'pricing-change'
        AND is_dismissed = 0
        AND detected_at >= datetime('now', '-30 days')
      ORDER BY detected_at DESC
      LIMIT 10
    `).all(),
  ]);

  return c.json({
    recent_models: recentModels.results,
    recent_alerts: recentAlerts.results,
    pending_models: pendingModels.results,
    pricing_changes: recentPricing.results,
  });
});

// GET /api/feed/:id
feedRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const item = await c.env.DB.prepare('SELECT * FROM news_items WHERE id = ?').bind(id).first();
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

// POST /api/feed/:id/read — requires auth
feedRoutes.post('/:id/read', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE news_items SET is_read = 1 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

// POST /api/feed/:id/bookmark — requires auth
feedRoutes.post('/:id/bookmark', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE news_items SET is_bookmarked = CASE WHEN is_bookmarked = 1 THEN 0 ELSE 1 END WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});
