/**
 * Reddit Community Review Scraper
 *
 * Scrapes model-specific discussions from AI coding subreddits.
 * Targets posts AND comments that mention specific models,
 * then feeds them through the review analysis engine.
 *
 * Sources (2 community tiers):
 *   Mass reviews:  r/ChatGPT, r/artificial, r/singularity
 *   Expert/coder:  r/ClaudeAI, r/LocalLLaMA, r/CursorAI, r/MachineLearning
 */

import { analyzeReview, aggregateReviews } from '../services/review-analysis-engine.js';

const RATE_LIMIT_SECONDS = 14400; // 4 hours between scrapes per subreddit

// Subreddits with their audience classification
const REVIEW_SUBREDDITS = [
  // Expert/coder communities (higher weight)
  { slug: 'reddit-claudeai',    sub: 'ClaudeAI',         tier: 'expert' },
  { slug: 'reddit-locallama',   sub: 'LocalLLaMA',       tier: 'expert' },
  { slug: 'reddit-cursorai',    sub: 'cursor',           tier: 'expert' },
  { slug: 'reddit-machinelearning', sub: 'MachineLearning', tier: 'expert' },
  // Mass review communities (broader audience)
  { slug: 'reddit-chatgpt',     sub: 'ChatGPT',          tier: 'mass' },
  { slug: 'reddit-artificial',  sub: 'artificial',        tier: 'mass' },
  { slug: 'reddit-singularity', sub: 'singularity',       tier: 'mass' },
];

// Search queries to find model discussions
const MODEL_SEARCH_QUERIES = [
  'claude opus sonnet coding',
  'gpt-5 coding review',
  'gemini pro coding experience',
  'deepseek coding',
  'cursor copilot windsurf comparison',
  'best model for coding',
  'switched from to model',
  'claude code review',
  'vibe coding model',
  'which AI model coding',
  'grok coding',
  'mistral coding',
  'qwen coder',
  'llama coding',
  'kimi coding',
  'minimax model',
  'glm-5 coding',
];

/**
 * Fetch Reddit JSON with rate limiting
 */
async function fetchRedditJson(url, env, rateLimitKey) {
  const nowEpoch = Math.floor(Date.now() / 1000);

  // Rate limit check
  const lastFetch = await env.RATE_LIMIT.get(rateLimitKey);
  if (lastFetch) {
    const elapsed = nowEpoch - parseInt(lastFetch, 10);
    if (elapsed < RATE_LIMIT_SECONDS) {
      return null; // rate limited
    }
  }

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'AllThingsAI-ReviewScraper/1.0 (community review aggregation)',
      Accept: 'application/json',
    },
  });

  if (!resp.ok) {
    console.error(`[RedditReview] HTTP ${resp.status} for ${url}`);
    return null;
  }

  // Update rate limit
  await env.RATE_LIMIT.put(rateLimitKey, String(nowEpoch), {
    expirationTtl: RATE_LIMIT_SECONDS,
  });

  return resp.json();
}

/**
 * Scrape a subreddit's search results for model discussions
 */
async function scrapeSubredditReviews(sub, env) {
  const reviews = [];

  for (const query of MODEL_SEARCH_QUERIES) {
    const rateLimitKey = `review:reddit:${sub.sub}:${query.replace(/\s+/g, '_')}`;
    const url = `https://www.reddit.com/r/${sub.sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&t=month&limit=10`;

    const json = await fetchRedditJson(url, env, rateLimitKey);
    if (!json?.data?.children) continue;

    for (const child of json.data.children) {
      const post = child.data;
      if (!post || post.score < 3) continue;

      const text = `${post.title || ''} ${(post.selftext || '').slice(0, 1500)}`;
      if (text.trim().length < 20) continue;

      const analysis = analyzeReview(text, post.score);

      // Only keep reviews that mention at least one model
      if (analysis.models.length === 0) continue;

      reviews.push({
        source: sub.slug,
        post_id: post.id,
        author: post.author,
        text: text.slice(0, 2000),
        postScore: post.score,
        ...analysis,
      });
    }

    // Be nice to Reddit — small delay between queries
    await new Promise(r => setTimeout(r, 500));
  }

  return reviews;
}

/**
 * Main entry: scrape all review subreddits, analyze, aggregate, and store
 */
export async function scrapeRedditReviews(env) {
  console.log('[RedditReview] Starting community review scrape...');
  let totalReviews = 0;
  const allRawReviews = [];

  for (const sub of REVIEW_SUBREDDITS) {
    try {
      const reviews = await scrapeSubredditReviews(sub, env);
      totalReviews += reviews.length;
      allRawReviews.push(...reviews);
      console.log(`[RedditReview] ${sub.sub}: ${reviews.length} relevant reviews`);
    } catch (err) {
      console.error(`[RedditReview] ${sub.sub}: error:`, err.message);
    }
  }

  if (allRawReviews.length === 0) {
    console.log('[RedditReview] No new reviews found (may be rate limited)');
    return { totalReviews: 0, modelsUpdated: 0 };
  }

  // W10: Deduplicate by post_id before aggregation
  const seen = new Set();
  const dedupedReviews = allRawReviews.filter(r => {
    if (seen.has(r.post_id)) return false;
    seen.add(r.post_id);
    return true;
  });
  console.log(`[RedditReview] Deduped: ${allRawReviews.length} → ${dedupedReviews.length} unique`);

  // Store raw reviews for audit trail
  const rawInsert = env.DB.prepare(`
    INSERT OR IGNORE INTO community_review_raw
      (model_slug, source, post_id, author, text, score, user_type, sentiment, coding_satisfaction, keywords_matched, scraped_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const rawBatch = [];
  for (const r of dedupedReviews) {
    for (const modelSlug of r.models) {
      rawBatch.push(rawInsert.bind(
        modelSlug, r.source, r.post_id, r.author,
        r.text, r.postScore, r.userType,
        r.sentiment, r.codingSatisfaction,
        JSON.stringify(r.models)
      ));
    }
  }

  if (rawBatch.length) {
    // D1 batch limit is 100 — chunk it
    for (let i = 0; i < rawBatch.length; i += 50) {
      await env.DB.batch(rawBatch.slice(i, i + 50));
    }
  }

  // C5: Recompute aggregation from ALL raw data (not just this batch) to prevent drift
  // First get all raw reviews for reddit sources from DB
  const { results: allStoredRaw } = await env.DB.prepare(`
    SELECT model_slug, source, sentiment, coding_satisfaction, user_type, score
    FROM community_review_raw WHERE source LIKE 'reddit-%'
  `).all();

  // Convert stored rows to format aggregateReviews expects
  const fullRawForAgg = allStoredRaw.map(r => ({
    models: [r.model_slug],
    source: r.source,
    sentiment: r.sentiment,
    codingSatisfaction: r.coding_satisfaction,
    userType: r.user_type,
    postScore: r.score,
  }));

  const aggregated = aggregateReviews(fullRawForAgg);
  let modelsUpdated = 0;

  const upsertStmt = env.DB.prepare(`
    INSERT INTO community_reviews
      (model_id, source, sentiment_score, coding_satisfaction,
       common_complaints, common_praises, review_count,
       casual_sentiment, casual_satisfaction, casual_count,
       vibe_coder_sentiment, vibe_coder_satisfaction, vibe_coder_count,
       heavy_coder_sentiment, heavy_coder_satisfaction, heavy_coder_count,
       last_scraped)
    SELECT m.id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
    FROM models m WHERE m.slug = ?
    ON CONFLICT(model_id, source) DO UPDATE SET
      sentiment_score = excluded.sentiment_score,
      coding_satisfaction = excluded.coding_satisfaction,
      common_complaints = excluded.common_complaints,
      common_praises = excluded.common_praises,
      review_count = excluded.review_count,
      casual_sentiment = excluded.casual_sentiment,
      casual_satisfaction = excluded.casual_satisfaction,
      casual_count = excluded.casual_count,
      vibe_coder_sentiment = excluded.vibe_coder_sentiment,
      vibe_coder_satisfaction = excluded.vibe_coder_satisfaction,
      vibe_coder_count = excluded.vibe_coder_count,
      heavy_coder_sentiment = excluded.heavy_coder_sentiment,
      heavy_coder_satisfaction = excluded.heavy_coder_satisfaction,
      heavy_coder_count = excluded.heavy_coder_count,
      last_scraped = datetime('now')
  `);

  const upsertBatch = [];
  for (const [, row] of aggregated) {
    upsertBatch.push(upsertStmt.bind(
      row.source, row.sentiment_score, row.coding_satisfaction,
      row.common_complaints, row.common_praises, row.review_count,
      row.casual_sentiment, row.casual_satisfaction, row.casual_count,
      row.vibe_coder_sentiment, row.vibe_coder_satisfaction, row.vibe_coder_count,
      row.heavy_coder_sentiment, row.heavy_coder_satisfaction, row.heavy_coder_count,
      row.model_slug
    ));
    modelsUpdated++;
  }

  if (upsertBatch.length) {
    for (let i = 0; i < upsertBatch.length; i += 50) {
      await env.DB.batch(upsertBatch.slice(i, i + 50));
    }
  }

  console.log(`[RedditReview] Done: ${totalReviews} reviews → ${modelsUpdated} model-source pairs updated`);
  return { totalReviews, modelsUpdated };
}
