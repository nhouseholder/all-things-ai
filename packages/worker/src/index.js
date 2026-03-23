import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { feedRoutes } from './routes/feed.js';
import { toolsRoutes } from './routes/tools.js';
import { modelsRoutes } from './routes/models.js';
import { benchmarksRoutes } from './routes/benchmarks.js';
import { costRoutes } from './routes/cost.js';
import { recommendationsRoutes } from './routes/recommendations.js';
import { preferencesRoutes } from './routes/preferences.js';
import { handleScheduled } from './scheduled.js';

const app = new Hono();

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.get('/', (c) => c.json({ name: 'All Things AI API', version: '0.1.0', status: 'ok' }));

app.route('/api/feed', feedRoutes);
app.route('/api/tools', toolsRoutes);
app.route('/api/models', modelsRoutes);
app.route('/api/benchmarks', benchmarksRoutes);
app.route('/api/cost', costRoutes);
app.route('/api/recommendations', recommendationsRoutes);
app.route('/api/preferences', preferencesRoutes);

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  },
};
