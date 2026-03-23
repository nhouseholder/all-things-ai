import { REDDIT_SOURCES } from '../config/sources.js';

const RATE_LIMIT_SECONDS = 7200; // 2 hours
const MIN_SCORE = 10;

/**
 * Scrape configured subreddits for AI-related posts.
 * Respects rate limits (2h per subreddit) via KV and filters low-quality posts.
 */
export async function scrapeReddit(env) {
  const now = new Date().toISOString();
  const nowEpoch = Math.floor(Date.now() / 1000);
  let totalNew = 0;
  let subsProcessed = 0;

  const results = await Promise.allSettled(
    REDDIT_SOURCES.map(async (source) => {
      try {
        // Rate limit check — skip if scraped within the last 2 hours
        const lastFetch = await env.RATE_LIMIT.get(`reddit:${source.slug}:last`);
        if (lastFetch) {
          const elapsed = nowEpoch - parseInt(lastFetch, 10);
          if (elapsed < RATE_LIMIT_SECONDS) {
            console.log(
              `[Reddit] ${source.slug}: rate limited (${Math.round((RATE_LIMIT_SECONDS - elapsed) / 60)}m remaining)`
            );
            return { slug: source.slug, newItems: 0, rateLimited: true };
          }
        }

        const resp = await fetch(source.url, {
          headers: {
            'User-Agent': 'AllThingsAI/1.0',
            Accept: 'application/json',
          },
        });

        if (!resp.ok) {
          console.error(`[Reddit] ${source.slug}: HTTP ${resp.status}`);
          return { slug: source.slug, newItems: 0, error: `HTTP ${resp.status}` };
        }

        const json = await resp.json();
        const posts = json?.data?.children;

        if (!posts || posts.length === 0) {
          console.log(`[Reddit] ${source.slug}: no posts returned`);
          return { slug: source.slug, newItems: 0 };
        }

        let newCount = 0;

        for (const child of posts) {
          try {
            const post = child.data;

            // Filter low-quality posts
            if (!post || post.score < MIN_SCORE) {
              continue;
            }

            // Skip stickied/pinned posts (usually mod announcements)
            if (post.stickied) {
              continue;
            }

            const title = (post.title || '').trim();
            if (!title) {
              continue;
            }

            const permalink = `https://www.reddit.com${post.permalink}`;
            const contentUrl = post.url || permalink;
            const selftext = (post.selftext || '').trim().slice(0, 500);
            const publishedAt = new Date(post.created_utc * 1000).toISOString();
            const author = post.author || null;

            const result = await env.DB.prepare(
              `INSERT OR IGNORE INTO news_items (source, source_url, title, summary, content_url, published_at, fetched_at, author)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                source.slug,
                permalink,
                title,
                selftext || null,
                contentUrl,
                publishedAt,
                now,
                author
              )
              .run();

            if (result.meta?.changes > 0) {
              newCount++;
            }
          } catch (postErr) {
            console.error(`[Reddit] ${source.slug}: post insert error:`, postErr.message);
          }
        }

        // Update rate limit timestamp
        await env.RATE_LIMIT.put(`reddit:${source.slug}:last`, String(nowEpoch), {
          expirationTtl: RATE_LIMIT_SECONDS,
        });

        return { slug: source.slug, newItems: newCount };
      } catch (subErr) {
        console.error(`[Reddit] ${source.slug}: scrape error:`, subErr.message);
        return { slug: source.slug, newItems: 0, error: subErr.message };
      }
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      totalNew += r.value.newItems;
      if (!r.value.rateLimited) {
        subsProcessed++;
      }
    }
  }

  console.log(`[Reddit] Fetched ${totalNew} new items from ${subsProcessed} subreddits`);
  return { totalNew, subsProcessed };
}
