/**
 * Hacker News Community Review Scraper
 *
 * Uses Algolia search API to find HN stories and comments
 * that discuss specific AI models for coding. HN skews heavily
 * toward expert/heavy coders — this is our second community source.
 */

import { analyzeReview, aggregateReviews } from '../services/review-analysis-engine.js';

const ALGOLIA_SEARCH = 'https://hn.algolia.com/api/v1/search';
const ALGOLIA_RECENT = 'https://hn.algolia.com/api/v1/search_by_date';
const RATE_LIMIT_SECONDS = 14400; // 4 hours

// Search queries targeting model discussions
const HN_MODEL_QUERIES = [
  'Claude Opus coding',
  'Claude Sonnet programming',
  'GPT-5 coding review',
  'Gemini Pro coding',
  'DeepSeek coding',
  'Cursor AI coding',
  'Copilot AI coding review',
  'AI coding assistant comparison',
  'LLM coding benchmark',
  'vibe coding AI',
  'best LLM for programming',
  'switched from Claude to GPT',
  'Grok coding',
  'Mistral coding',
  'Qwen coder',
  'Llama coding',
  'open source LLM coding',
  'GLM-5',
  'Kimi K2',
  'Minimax AI',
];

/**
 * Fetch from HN Algolia API with rate limiting
 */
async function fetchHNJson(url, env, rateLimitKey) {
  const nowEpoch = Math.floor(Date.now() / 1000);

  const lastFetch = await env.RATE_LIMIT.get(rateLimitKey);
  if (lastFetch) {
    const elapsed = nowEpoch - parseInt(lastFetch, 10);
    if (elapsed < RATE_LIMIT_SECONDS) {
      return null;
    }
  }

  const resp = await fetch(url, {
    headers: { 'User-Agent': 'AllThingsAI-ReviewScraper/1.0' },
  });

  if (!resp.ok) {
    console.error(`[HNReview] HTTP ${resp.status} for ${url}`);
    return null;
  }

  await env.RATE_LIMIT.put(rateLimitKey, String(nowEpoch), {
    expirationTtl: RATE_LIMIT_SECONDS,
  });

  return resp.json();
}

/**
 * Search HN for stories mentioning AI models
 */
async function searchHNStories(query, env) {
  const reviews = [];
  const rateLimitKey = `review:hn:story:${query.replace(/\s+/g, '_')}`;

  // Search recent stories (last 30 days)
  const params = new URLSearchParams({
    query,
    tags: 'story',
    hitsPerPage: '15',
    numericFilters: 'points>10',
  });

  const json = await fetchHNJson(`${ALGOLIA_RECENT}?${params}`, env, rateLimitKey);
  if (!json?.hits) return reviews;

  for (const hit of json.hits) {
    const title = (hit.title || '').trim();
    // Stories usually just have titles; combine with any story_text
    const text = `${title} ${hit.story_text || ''}`;
    if (text.length < 15) continue;

    const analysis = analyzeReview(text, hit.points || 0);
    if (analysis.models.length === 0) continue;

    reviews.push({
      source: 'hackernews',
      post_id: `story_${hit.objectID}`,
      author: hit.author,
      text: text.slice(0, 2000),
      postScore: hit.points || 0,
      ...analysis,
    });
  }

  return reviews;
}

/**
 * Search HN comments for model discussions (higher signal)
 */
async function searchHNComments(query, env) {
  const reviews = [];
  const rateLimitKey = `review:hn:comment:${query.replace(/\s+/g, '_')}`;

  const params = new URLSearchParams({
    query,
    tags: 'comment',
    hitsPerPage: '20',
    numericFilters: 'points>3',
  });

  const json = await fetchHNJson(`${ALGOLIA_SEARCH}?${params}`, env, rateLimitKey);
  if (!json?.hits) return reviews;

  for (const hit of json.hits) {
    const text = (hit.comment_text || '').replace(/<[^>]*>/g, ' ').trim();
    if (text.length < 30) continue;

    const analysis = analyzeReview(text, hit.points || 0);
    if (analysis.models.length === 0) continue;

    reviews.push({
      source: 'hackernews',
      post_id: `comment_${hit.objectID}`,
      author: hit.author,
      text: text.slice(0, 2000),
      postScore: hit.points || 0,
      ...analysis,
    });
  }

  return reviews;
}

/**
 * Main entry: scrape HN stories + comments, analyze, aggregate, and store
 */
export async function scrapeHNReviews(env) {
  console.log('[HNReview] Starting Hacker News review scrape...');
  const allRawReviews = [];

  for (const query of HN_MODEL_QUERIES) {
    try {
      const storyReviews = await searchHNStories(query, env);
      const commentReviews = await searchHNComments(query, env);
      allRawReviews.push(...storyReviews, ...commentReviews);
      console.log(`[HNReview] "${query}": ${storyReviews.length} stories, ${commentReviews.length} comments`);
    } catch (err) {
      console.error(`[HNReview] "${query}": error:`, err.message);
    }

    // Be nice to Algolia
    await new Promise(r => setTimeout(r, 300));
  }

  if (allRawReviews.length === 0) {
    console.log('[HNReview] No new reviews found (may be rate limited)');
    return { totalReviews: 0, modelsUpdated: 0 };
  }

  // W10: Deduplicate by post_id before processing
  const seen = new Set();
  const dedupedReviews = allRawReviews.filter(r => {
    if (seen.has(r.post_id)) return false;
    seen.add(r.post_id);
    return true;
  });
  console.log(`[HNReview] Deduped: ${allRawReviews.length} → ${dedupedReviews.length} unique`);

  // Store raw reviews
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
    for (let i = 0; i < rawBatch.length; i += 50) {
      await env.DB.batch(rawBatch.slice(i, i + 50));
    }
  }

  // C5: Recompute aggregation from ALL raw data to prevent sentiment drift
  const { results: allStoredRaw } = await env.DB.prepare(`
    SELECT model_slug, source, sentiment, coding_satisfaction, user_type, score
    FROM community_review_raw WHERE source = 'hackernews'
  `).all();

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

  console.log(`[HNReview] Done: ${allRawReviews.length} reviews → ${modelsUpdated} model-source pairs updated`);
  return { totalReviews: allRawReviews.length, modelsUpdated };
}
