import { Hono } from 'hono';

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

// PUT /api/preferences
preferencesRoutes.put('/', async (c) => {
  const updates = await c.req.json();
  for (const [key, value] of Object.entries(updates)) {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    await c.env.DB.prepare(
      'INSERT INTO user_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?'
    ).bind(key, val, val).run();
  }
  return c.json({ ok: true });
});
