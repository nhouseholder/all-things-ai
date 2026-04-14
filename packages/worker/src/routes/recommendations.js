import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';
import { generateStackRecommendations } from '../services/recommendation-engine.js';

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

// POST /api/recommendations/stack — personalized "bang for buck" recs from a
// user-provided stack (no auth; stack is passed in the body, stored client-side)
recommendationsRoutes.post('/stack', async (c) => {
  let payload;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const stack = {
    plans: Array.isArray(payload?.plans) ? payload.plans : [],
    subscriptions: Array.isArray(payload?.subscriptions) ? payload.subscriptions : [],
    models: Array.isArray(payload?.models) ? payload.models : [],
  };

  try {
    const result = await generateStackRecommendations(c.env, stack);
    return c.json(result);
  } catch (err) {
    console.error('[stack-recommendations] error:', err);
    return c.json({ error: 'Failed to generate recommendations' }, 500);
  }
});

// POST /api/recommendations/:id/dismiss — requires auth
recommendationsRoutes.post('/:id/dismiss', requireAdmin(), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE recommendations SET is_dismissed = 1 WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});
