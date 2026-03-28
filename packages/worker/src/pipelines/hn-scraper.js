import { HN_QUERIES } from '../config/sources.js';
import { fetchWithTimeout } from '../utils/fetch.js';

const ALGOLIA_BASE = 'https://hn.algolia.com/api/v1/search';
const HN_ITEM_BASE = 'https://news.ycombinator.com/item?id=';
const MIN_POINTS = 20;
const HITS_PER_PAGE = 25;

/**
 * Scrape Hacker News via Algolia API for AI-related stories.
 * Runs each configured query, deduplication handled by the source_url UNIQUE constraint.
 */
export async function scrapeHackerNews(env) {
  const now = new Date().toISOString();
  let totalNew = 0;
  let queriesProcessed = 0;

  for (const query of HN_QUERIES) {
    try {
      const params = new URLSearchParams({
        query,
        tags: 'story',
        hitsPerPage: String(HITS_PER_PAGE),
        numericFilters: `points>${MIN_POINTS}`,
      });

      const resp = await fetchWithTimeout(`${ALGOLIA_BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'AllThingsAI/1.0' },
      });

      if (!resp.ok) {
        console.error(`[HN] Query "${query}": HTTP ${resp.status}`);
        continue;
      }

      const json = await resp.json();
      const hits = json.hits;

      if (!hits || hits.length === 0) {
        console.log(`[HN] Query "${query}": no hits`);
        queriesProcessed++;
        continue;
      }

      let newCount = 0;

      for (const hit of hits) {
        try {
          const title = (hit.title || '').trim();
          if (!title) {
            continue;
          }

          const objectID = hit.objectID;
          const sourceUrl = `${HN_ITEM_BASE}${objectID}`;
          const contentUrl = hit.url || sourceUrl;
          const publishedAt = hit.created_at
            ? new Date(hit.created_at).toISOString()
            : now;
          const author = hit.author || null;

          const result = await env.DB.prepare(
            `INSERT OR IGNORE INTO news_items (source, source_url, title, summary, content_url, published_at, fetched_at, author)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              'hn',
              sourceUrl,
              title,
              null,
              contentUrl,
              publishedAt,
              now,
              author
            )
            .run();

          if (result.meta?.changes > 0) {
            newCount++;
          }
        } catch (hitErr) {
          console.error(`[HN] Query "${query}": hit insert error:`, hitErr.message);
        }
      }

      totalNew += newCount;
      queriesProcessed++;
    } catch (queryErr) {
      console.error(`[HN] Query "${query}": error:`, queryErr.message);
    }
  }

  console.log(`[HN] Fetched ${totalNew} new items from ${queriesProcessed} queries`);
  return { totalNew, queriesProcessed };
}
