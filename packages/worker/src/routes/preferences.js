import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth.js';

export const preferencesRoutes = new Hono();

// GET /api/preferences
preferencesRoutes.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM user_preferences').all();
  const prefs = {};
  for (const row of results) {
    try { prefs[row.key] = JSON.parse(row.value); } catch { prefs[row.key] = row.value; }
  }
  return c.json(prefs);
});

// PUT /api/preferences (W1: validated, C1: auth required)
preferencesRoutes.put('/', requireAdmin(), async (c) => {
  const updates = await c.req.json();
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return c.json({ error: 'Request body must be a JSON object' }, 400);
  }
  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return c.json({ error: 'No preferences to update' }, 400);
  }
  if (keys.length > 50) {
    return c.json({ error: 'Maximum 50 preferences per update' }, 400);
  }
  for (const [key, value] of Object.entries(updates)) {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    await c.env.DB.prepare(
      'INSERT INTO user_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
    ).bind(key, val, val).run();
  }
  return c.json({ ok: true });
});
