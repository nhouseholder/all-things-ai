import { fetchAllRSS } from './pipelines/rss-fetcher.js';
import { scrapeReddit } from './pipelines/reddit-scraper.js';
import { scrapeHackerNews } from './pipelines/hn-scraper.js';
import { scrapePricing } from './pipelines/pricing-scraper.js';
import { scoreUnscored } from './services/relevance-scorer.js';
import { generateRecommendations } from './services/recommendation-engine.js';
import { buildAndSendDigest } from './pipelines/digest-builder.js';

export async function handleScheduled(event, env) {
  const cron = event.cron;
  console.log(`[CRON] Triggered: ${cron} at ${new Date().toISOString()}`);

  try {
    switch (cron) {
      case '*/30 * * * *':
        await fetchAllRSS(env);
        break;
      case '0 */2 * * *':
        await scrapeReddit(env);
        break;
      case '0 */3 * * *':
        await scrapeHackerNews(env);
        break;
      case '0 6 * * *':
        await scrapePricing(env);
        break;
      case '0 7 * * *':
        await scoreUnscored(env);
        await generateRecommendations(env);
        break;
      case '0 8 * * 1':
        await buildAndSendDigest(env);
        break;
      default:
        console.log(`[CRON] Unknown schedule: ${cron}`);
    }
  } catch (err) {
    console.error(`[CRON] Error in ${cron}:`, err.message);
  }
}
