import { fetchAllRSS } from './pipelines/rss-fetcher.js';
import { scrapeReddit } from './pipelines/reddit-scraper.js';
import { scrapeHackerNews } from './pipelines/hn-scraper.js';
import { scrapePricing } from './pipelines/pricing-scraper.js';
import { rescoreRecentNews, scoreUnscored } from './services/relevance-scorer.js';
import { generateRecommendations } from './services/recommendation-engine.js';
import { buildAndSendDigest } from './pipelines/digest-builder.js';
import { scrapeRedditReviews } from './pipelines/reddit-review-scraper.js';
import { scrapeHNReviews } from './pipelines/hn-review-scraper.js';
import { computeCompositeScores } from './services/composite-score-engine.js';
import { computeToolScores } from './services/tool-score-engine.js';
import { computePluginScores } from './services/plugin-score-engine.js';
import { discoverNewModels } from './pipelines/model-discovery.js';
import { scrapeBenchmarks } from './pipelines/benchmark-scraper.js';
import { discoverGitHubTools } from './pipelines/github-tool-discovery.js';
import { monitorAIIndustry } from './pipelines/industry-monitor.js';
import { scrapeToolReviews } from './pipelines/tool-review-scraper.js';
import { syncOpenRouterStats } from './pipelines/openrouter-sync.js';
import { syncModelAliases } from './services/community-review-targets.js';
import { processEnrichmentQueue } from './services/model-enrichment.js';

async function checkModelStaleness(env) {
  const { results: staleModels } = await env.DB.prepare(`
    SELECT m.id, m.name, m.slug, m.updated_at,
      mcs.updated_at as score_updated_at
    FROM models m
    LEFT JOIN model_composite_scores mcs ON mcs.model_id = m.id
    WHERE m.is_active = 1
      AND (
        m.updated_at < datetime('now', '-14 days')
        OR mcs.updated_at IS NULL
        OR mcs.updated_at < datetime('now', '-14 days')
      )
  `).all();

  if (staleModels.length > 0) {
    console.log(`[STALENESS] ${staleModels.length} models stale (>14 days without update):`);
    for (const m of staleModels.slice(0, 10)) {
      console.log(`  - ${m.name} (${m.slug}): model=${m.updated_at}, score=${m.score_updated_at || 'never'}`);
    }
  } else {
    console.log('[STALENESS] All models are fresh.');
  }
}

export async function handleScheduled(event, env) {
  const cron = event.cron;
  console.log(`[CRON] Triggered: ${cron} at ${new Date().toISOString()}`);

  // S9: Wrap each task individually so one failure doesn't skip the rest
  async function runSafe(label, fn) {
    try {
      await fn();
    } catch (err) {
      console.error(`[CRON] ${label} failed:`, err.message);
    }
  }

  switch (cron) {
    case '*/30 * * * *':
      await runSafe('fetchAllRSS', () => fetchAllRSS(env));
      break;
    case '0 */2 * * *':
      await runSafe('scrapeReddit', () => scrapeReddit(env));
      break;
    case '0 */3 * * *':
      await runSafe('scrapeHackerNews', () => scrapeHackerNews(env));
      break;
    case '0 6 * * *':
      await runSafe('scrapePricing', () => scrapePricing(env));
      await runSafe('syncOpenRouterStats', () => syncOpenRouterStats(env));
      break;
    case '0 7 * * *':
      await runSafe('scoreUnscored', () => scoreUnscored(env));
      await runSafe('rescoreRecentNews', () => rescoreRecentNews(env));
      await runSafe('generateRecommendations', () => generateRecommendations(env));
      // Model discovery: scan recent news for new model releases
      await runSafe('discoverNewModels', () => discoverNewModels(env));
      // C3 + S7: Daily cleanup of old data
      await runSafe('cleanupOldData', async () => {
        const newsResult = await env.DB.prepare(
          `DELETE FROM news_items WHERE published_at < datetime('now', '-90 days') AND is_bookmarked = 0`
        ).run();
        if (newsResult.changes > 0) console.log(`[CLEANUP] Deleted ${newsResult.changes} old news items`);
        const rawResult = await env.DB.prepare(
          `DELETE FROM community_review_raw WHERE scraped_at < datetime('now', '-180 days')`
        ).run();
        if (rawResult.changes > 0) console.log(`[CLEANUP] Deleted ${rawResult.changes} old raw reviews`);
      });
      break;
    case '0 8 * * 1':
      await runSafe('buildAndSendDigest', () => buildAndSendDigest(env));
      // 2x/week benchmark scrape from authoritative leaderboards (Mon + Thu)
      await runSafe('scrapeBenchmarks', () => scrapeBenchmarks(env));
      // Weekly GitHub tool discovery — find new MCP servers, skills, agents
      await runSafe('discoverGitHubTools', () => discoverGitHubTools(env));
      // Weekly staleness check
      await runSafe('checkStaleness', () => checkModelStaleness(env));
      break;
    case '0 8 * * 4':
      // Thursday benchmark scrape (2x/week)
      await runSafe('scrapeBenchmarks', () => scrapeBenchmarks(env));
      break;
    // Community review scrape: every 6 hours
    case '0 */6 * * *':
      await runSafe('syncModelAliases', () => syncModelAliases(env));
      await runSafe('scrapeRedditReviews', () => scrapeRedditReviews(env));
      await runSafe('scrapeHNReviews', () => scrapeHNReviews(env));
      await runSafe('computeCompositeScores', () => computeCompositeScores(env));
      await runSafe('computeToolScores', () => computeToolScores(env));
      await runSafe('computePluginScores', () => computePluginScores(env));
      // Tool/plugin review scrape (same cadence as model reviews)
      await runSafe('scrapeToolReviews', () => scrapeToolReviews(env));
      // Invalidate caches so next request gets fresh data
      await runSafe('invalidateCaches', async () => {
        await env.CACHE.delete('rankings:v1');
        await env.CACHE.delete('rankings:v2-vibe');
        await env.CACHE.delete('model-aliases:merged');
      });
      break;
    // Faster model-intake sweep so new releases are picked up within hours, not days
    case '15 */4 * * *':
      await runSafe('monitorAIIndustry', () => monitorAIIndustry(env));
      await runSafe('syncOpenRouterStats', () => syncOpenRouterStats(env));
      await runSafe('discoverNewModels', () => discoverNewModels(env));
      await runSafe('processEnrichmentQueue', () => processEnrichmentQueue(env));
      break;
    default:
      console.log(`[CRON] Unknown schedule: ${cron}`);
  }
}
