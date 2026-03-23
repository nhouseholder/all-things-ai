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
import { fetchAllRSS } from './pipelines/rss-fetcher.js';
import { scrapeReddit } from './pipelines/reddit-scraper.js';
import { scrapeHackerNews } from './pipelines/hn-scraper.js';
import { scoreUnscored } from './services/relevance-scorer.js';
import { generateRecommendations } from './services/recommendation-engine.js';

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

// Manual trigger for data ingestion (dev/admin use)
app.post('/api/ingest', async (c) => {
  const results = {};
  try { await fetchAllRSS(c.env); results.rss = 'ok'; } catch (e) { results.rss = e.message; }
  try { await scrapeReddit(c.env); results.reddit = 'ok'; } catch (e) { results.reddit = e.message; }
  try { await scrapeHackerNews(c.env); results.hn = 'ok'; } catch (e) { results.hn = e.message; }
  try { await scoreUnscored(c.env); results.scoring = 'ok'; } catch (e) { results.scoring = e.message; }
  try { await generateRecommendations(c.env); results.recommendations = 'ok'; } catch (e) { results.recommendations = e.message; }
  return c.json(results);
});

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  },
};
