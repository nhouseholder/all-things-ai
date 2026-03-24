import { fetchAllRSS } from './pipelines/rss-fetcher.js';
import { scrapeReddit } from './pipelines/reddit-scraper.js';
import { scrapeHackerNews } from './pipelines/hn-scraper.js';
import { scrapePricing } from './pipelines/pricing-scraper.js';
import { scoreUnscored } from './services/relevance-scorer.js';
import { generateRecommendations } from './services/recommendation-engine.js';
import { buildAndSendDigest } from './pipelines/digest-builder.js';
import { scrapeRedditReviews } from './pipelines/reddit-review-scraper.js';
import { scrapeHNReviews } from './pipelines/hn-review-scraper.js';
import { computeCompositeScores } from './services/composite-score-engine.js';

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
      break;
    case '0 7 * * *':
      await runSafe('scoreUnscored', () => scoreUnscored(env));
      await runSafe('generateRecommendations', () => generateRecommendations(env));
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
      break;
    // Community review scrape: every 6 hours
    case '0 */6 * * *':
      await runSafe('scrapeRedditReviews', () => scrapeRedditReviews(env));
      await runSafe('scrapeHNReviews', () => scrapeHNReviews(env));
      await runSafe('computeCompositeScores', () => computeCompositeScores(env));
      break;
    default:
      console.log(`[CRON] Unknown schedule: ${cron}`);
  }
}
