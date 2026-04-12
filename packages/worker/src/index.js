import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { feedRoutes } from './routes/feed.js';
import { toolsRoutes } from './routes/tools.js';
import { modelsRoutes } from './routes/models.js';
import { benchmarksRoutes } from './routes/benchmarks.js';
import { costRoutes } from './routes/cost.js';
import { recommendationsRoutes } from './routes/recommendations.js';
import { preferencesRoutes } from './routes/preferences.js';
import { advisorRoutes } from './routes/advisor.js';
import { adminRoutes } from './routes/admin.js';
import { codingToolsRoutes } from './routes/coding-tools.js';
import { alertsRoutes } from './routes/alerts.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { monitorAIIndustry } from './pipelines/industry-monitor.js';
import { scrapeToolReviews } from './pipelines/tool-review-scraper.js';
import { handleScheduled } from './scheduled.js';
import { requireAdmin } from './middleware/auth.js';
import { rateLimit } from './middleware/rate-limit.js';
import { fetchAllRSS } from './pipelines/rss-fetcher.js';
import { scrapeReddit } from './pipelines/reddit-scraper.js';
import { scrapeHackerNews } from './pipelines/hn-scraper.js';
import { rescoreRecentNews, scoreUnscored } from './services/relevance-scorer.js';
import { generateRecommendations } from './services/recommendation-engine.js';
import { computeCompositeScores } from './services/composite-score-engine.js';
import { computeTaskCosts } from './services/task-cost-calculator.js';
import { scrapeRedditReviews } from './pipelines/reddit-review-scraper.js';
import { scrapeHNReviews } from './pipelines/hn-review-scraper.js';
import { syncOpenRouterStats } from './pipelines/openrouter-sync.js';
import { syncModelAliases } from './services/community-review-targets.js';

const app = new Hono();

const ALLOWED_ORIGINS = new Set([
  'https://all-things-ai.pages.dev',
  'https://allthingsai.dev',
  'http://localhost:5173',
  'http://localhost:4173',
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;

  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.hostname.endsWith('.all-things-ai.pages.dev');
  } catch {
    return false;
  }
}

app.use('/api/*', cors({
  origin: (origin) => isAllowedOrigin(origin) ? origin : null,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Rate limiting on public GET endpoints (60 req/min per IP)
app.use('/api/*', rateLimit({ max: 60, windowSec: 60 }));

// Global error handler — catch unhandled exceptions from all routes
app.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);
  return c.json({ error: 'Internal server error' }, 500);
});

// Health check with DB verification (S4)
app.get('/', async (c) => {
  try {
    await c.env.DB.prepare('SELECT 1').first();
    return c.json({ name: 'All Things AI API', version: '0.11.1', status: 'ok', db: 'connected' });
  } catch {
    return c.json({ name: 'All Things AI API', version: '0.11.1', status: 'degraded', db: 'error' }, 503);
  }
});

app.route('/api/feed', feedRoutes);
app.route('/api/tools', toolsRoutes);
app.route('/api/models', modelsRoutes);
app.route('/api/benchmarks', benchmarksRoutes);
app.route('/api/cost', costRoutes);
app.route('/api/recommendations', recommendationsRoutes);
app.route('/api/preferences', preferencesRoutes);
app.route('/api/advisor', advisorRoutes);
app.route('/api/admin', adminRoutes);
app.route('/api/coding-tools', codingToolsRoutes);
app.route('/api/alerts', alertsRoutes);
app.route('/api/dashboard', dashboardRoutes);

// Manual trigger for data ingestion (dev/admin use) — C1: require auth
app.post('/api/ingest', requireAdmin(), async (c) => {
  const results = {};
  try { await fetchAllRSS(c.env); results.rss = 'ok'; } catch (e) { results.rss = e.message; }
  try { await scrapeReddit(c.env); results.reddit = 'ok'; } catch (e) { results.reddit = e.message; }
  try { await scrapeHackerNews(c.env); results.hn = 'ok'; } catch (e) { results.hn = e.message; }
  try { await scoreUnscored(c.env); results.scoring = 'ok'; } catch (e) { results.scoring = e.message; }
  try { results.rescoring = await rescoreRecentNews(c.env); } catch (e) { results.rescoring = e.message; }
  try { await generateRecommendations(c.env); results.recommendations = 'ok'; } catch (e) { results.recommendations = e.message; }
  try { await computeTaskCosts(c.env); results.taskCosts = 'ok'; } catch (e) { results.taskCosts = e.message; }
  try { results.aliases = await syncModelAliases(c.env); } catch (e) { results.aliases = e.message; }
  try { await scrapeRedditReviews(c.env); results.redditReviews = 'ok'; } catch (e) { results.redditReviews = e.message; }
  try { await scrapeHNReviews(c.env); results.hnReviews = 'ok'; } catch (e) { results.hnReviews = e.message; }
  try { await computeCompositeScores(c.env); results.compositeScores = 'ok'; } catch (e) { results.compositeScores = e.message; }
  try { await syncOpenRouterStats(c.env); results.openrouter = 'ok'; } catch (e) { results.openrouter = e.message; }
  return c.json(results);
});

// Manual trigger for industry monitor only — C1: require auth
app.post('/api/ingest/monitor', requireAdmin(), async (c) => {
  try {
    const sourceKeys = new URL(c.req.url).searchParams.getAll('source').filter(Boolean);
    const result = await monitorAIIndustry(c.env, { sourceKeys });
    return c.json({ status: 'ok', ...result });
  } catch (e) {
    return c.json({ status: 'error', message: e.message }, 500);
  }
});

// Manual trigger for community review scraping only — C1: require auth
app.post('/api/ingest/reviews', requireAdmin(), async (c) => {
  const searchParams = new URL(c.req.url).searchParams;
  const backfill = ['1', 'true', 'yes'].includes((searchParams.get('backfill') || '').toLowerCase());
  const maxModels = Number.parseInt(searchParams.get('maxModels') || '', 10);
  const coverageThreshold = Number.parseInt(searchParams.get('coverageThreshold') || '', 10);
  const reviewOptions = {
    backfill,
    maxModels: Number.isFinite(maxModels) ? maxModels : undefined,
    coverageThreshold: Number.isFinite(coverageThreshold) ? coverageThreshold : undefined,
  };
  const results = {};
  try {
    results.aliases = { status: 'ok', ...await syncModelAliases(c.env) };
  } catch (e) { results.aliases = { status: 'error', message: e.message }; }
  try {
    const reddit = await scrapeRedditReviews(c.env, reviewOptions);
    results.reddit = { status: 'ok', ...reddit };
  } catch (e) { results.reddit = { status: 'error', message: e.message }; }
  try {
    const hn = await scrapeHNReviews(c.env, reviewOptions);
    results.hn = { status: 'ok', ...hn };
  } catch (e) { results.hn = { status: 'error', message: e.message }; }
  // Tool/plugin reviews
  try {
    const toolReviews = await scrapeToolReviews(c.env);
    results.toolReviews = { status: 'ok', ...toolReviews };
  } catch (e) { results.toolReviews = { status: 'error', message: e.message }; }
  // Recompute composite scores after review update
  try { await computeCompositeScores(c.env); results.compositeScores = 'ok'; } catch (e) { results.compositeScores = e.message; }
  return c.json(results);
});

app.post('/api/ingest/news/rescore', requireAdmin(), async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const days = Number.parseInt(searchParams.get('days') || '', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '', 10);
    const result = await rescoreRecentNews(c.env, {
      days: Number.isFinite(days) ? days : undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return c.json({ status: 'ok', ...result });
  } catch (e) {
    return c.json({ status: 'error', message: e.message }, 500);
  }
});

// Manual trigger for OpenRouter sync only
app.post('/api/ingest/openrouter', requireAdmin(), async (c) => {
  try {
    const result = await syncOpenRouterStats(c.env);
    return c.json({ status: 'ok', ...result });
  } catch (e) {
    return c.json({ status: 'error', message: e.message }, 500);
  }
});

// Community review data API
app.get('/api/reviews', async (c) => {
  const modelSlug = c.req.query('model');
  let query = `
    SELECT cr.*, m.slug as model_slug, m.name as model_name
    FROM community_reviews cr
    JOIN models m ON cr.model_id = m.id
  `;
  const params = [];
  if (modelSlug) {
    query += ' WHERE m.slug = ?';
    params.push(modelSlug);
  }
  query += ' ORDER BY cr.review_count DESC LIMIT 100';

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ reviews: results });
});

// Community review breakdown by user type
app.get('/api/reviews/breakdown', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT m.slug, m.name,
           SUM(cr.casual_count) as total_casual,
           SUM(cr.vibe_coder_count) as total_vibe,
           SUM(cr.heavy_coder_count) as total_heavy,
           SUM(cr.review_count) as total_reviews,
           ROUND(AVG(cr.casual_satisfaction), 1) as avg_casual_satisfaction,
           ROUND(AVG(cr.vibe_coder_satisfaction), 1) as avg_vibe_satisfaction,
           ROUND(AVG(cr.heavy_coder_satisfaction), 1) as avg_heavy_satisfaction,
           ROUND(AVG(cr.coding_satisfaction), 1) as avg_overall_satisfaction
    FROM community_reviews cr
    JOIN models m ON cr.model_id = m.id
    GROUP BY m.id
    ORDER BY total_reviews DESC
  `).all();
  return c.json({ breakdown: results });
});

export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  },
};
