/**
 * Tool & Plugin Community Review Scraper
 *
 * Scrapes Reddit and HN for reviews of IDE tools (Cursor, Claude Code, etc.)
 * and coding plugins (Cline, MCP servers, frameworks, etc.).
 *
 * Mirrors the model review scraper pattern but targets tool-specific discussions.
 * Results feed into tool_reviews (IDE tools) and coding_tools.community_rating (plugins).
 */

import {
  analyzeToolReview,
  classifyUserType,
  extractSentiment,
  extractCodingSatisfaction,
  extractTopThemes,
} from '../services/review-analysis-engine.js';

const RATE_LIMIT_SECONDS = 14400; // 4 hours between scrapes per source

// Subreddits focused on coding tools
const TOOL_SUBREDDITS = [
  { slug: 'reddit-cursorai',    sub: 'cursor',           tier: 'expert' },
  { slug: 'reddit-claudeai',    sub: 'ClaudeAI',         tier: 'expert' },
  { slug: 'reddit-vscode',      sub: 'vscode',           tier: 'expert' },
  { slug: 'reddit-neovim',      sub: 'neovim',           tier: 'expert' },
  { slug: 'reddit-webdev',      sub: 'webdev',           tier: 'mass' },
  { slug: 'reddit-programming', sub: 'programming',      tier: 'mass' },
  { slug: 'reddit-chatgpt',     sub: 'ChatGPT',          tier: 'mass' },
  { slug: 'reddit-singularity', sub: 'singularity',      tier: 'mass' },
];

// Search queries targeting tool discussions
const TOOL_SEARCH_QUERIES = [
  'cursor vs windsurf vs copilot',
  'claude code review experience',
  'best AI coding tool 2026',
  'cursor review',
  'windsurf review',
  'copilot review',
  'aider review experience',
  'cline extension review',
  'continue.dev review',
  'best mcp server',
  'desktop commander mcp',
  'bolt.new lovable v0 comparison',
  'AI coding IDE comparison',
  'switched from cursor to',
  'switched from copilot to',
  'claude code vs cursor',
  'roo code review',
  'crewai langchain autogen comparison',
  'open interpreter review',
];

async function fetchRedditJson(url, env, rateLimitKey) {
  const nowEpoch = Math.floor(Date.now() / 1000);
  const lastFetch = await env.RATE_LIMIT.get(rateLimitKey);
  if (lastFetch) {
    const elapsed = nowEpoch - parseInt(lastFetch, 10);
    if (elapsed < RATE_LIMIT_SECONDS) return null;
  }

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'AllThingsAI-ToolReviewScraper/1.0 (community review aggregation)',
      Accept: 'application/json',
    },
  });

  if (!resp.ok) {
    console.error(`[ToolReview] HTTP ${resp.status} for ${url}`);
    return null;
  }

  await env.RATE_LIMIT.put(rateLimitKey, String(nowEpoch), { expirationTtl: RATE_LIMIT_SECONDS });
  return resp.json();
}

async function scrapeSubredditToolReviews(sub, env) {
  const reviews = [];

  for (const query of TOOL_SEARCH_QUERIES) {
    const rateLimitKey = `toolreview:reddit:${sub.sub}:${query.replace(/\s+/g, '_')}`;
    const url = `https://www.reddit.com/r/${sub.sub}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=new&t=month&limit=10`;

    const json = await fetchRedditJson(url, env, rateLimitKey);
    if (!json?.data?.children) continue;

    for (const child of json.data.children) {
      const post = child.data;
      if (!post || post.score < 3) continue;

      const text = `${post.title || ''} ${(post.selftext || '').slice(0, 1500)}`;
      if (text.trim().length < 20) continue;

      const analysis = analyzeToolReview(text, post.score);
      if (analysis.tools.length === 0) continue;

      reviews.push({
        source: sub.slug,
        post_id: post.id,
        author: post.author,
        text: text.slice(0, 2000),
        ...analysis,
      });
    }

    await new Promise(r => setTimeout(r, 500));
  }

  return reviews;
}

async function scrapeHNToolReviews(env) {
  const reviews = [];
  const hnQueries = [
    'AI coding tool review',
    'Cursor AI editor',
    'Claude Code CLI',
    'GitHub Copilot review',
    'Windsurf IDE',
    'MCP server',
    'Cline VS Code',
    'AI pair programming',
  ];

  for (const query of hnQueries) {
    const rateLimitKey = `toolreview:hn:${query.replace(/\s+/g, '_')}`;
    const nowEpoch = Math.floor(Date.now() / 1000);
    const lastFetch = await env.RATE_LIMIT.get(rateLimitKey);
    if (lastFetch && (nowEpoch - parseInt(lastFetch, 10)) < RATE_LIMIT_SECONDS) continue;

    try {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=points>5&hitsPerPage=15`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'AllThingsAI-ToolReviewScraper/1.0' },
      });

      if (!resp.ok) continue;
      const data = await resp.json();

      await env.RATE_LIMIT.put(rateLimitKey, String(nowEpoch), { expirationTtl: RATE_LIMIT_SECONDS });

      for (const hit of (data.hits || [])) {
        const text = `${hit.title || ''} ${hit.story_text || ''}`.slice(0, 2000);
        if (text.trim().length < 15) continue;

        const analysis = analyzeToolReview(text, hit.points || 0);
        if (analysis.tools.length === 0) continue;

        reviews.push({
          source: 'hn-tools',
          post_id: hit.objectID,
          author: hit.author,
          text,
          ...analysis,
        });
      }

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`[ToolReview] HN query "${query}": ${err.message}`);
    }
  }

  return reviews;
}

/**
 * Main entry: scrape, analyze, store raw reviews, then aggregate into tool_reviews + coding_tools
 */
export async function scrapeToolReviews(env) {
  console.log('[ToolReview] Starting tool/plugin review scrape...');

  let totalReviews = 0;
  const allRawReviews = [];

  // Reddit scrape
  for (const sub of TOOL_SUBREDDITS) {
    try {
      const reviews = await scrapeSubredditToolReviews(sub, env);
      totalReviews += reviews.length;
      allRawReviews.push(...reviews);
      console.log(`[ToolReview] ${sub.sub}: ${reviews.length} relevant reviews`);
    } catch (err) {
      console.error(`[ToolReview] ${sub.sub}: error:`, err.message);
    }
  }

  // HN scrape
  try {
    const hnReviews = await scrapeHNToolReviews(env);
    totalReviews += hnReviews.length;
    allRawReviews.push(...hnReviews);
    console.log(`[ToolReview] HN: ${hnReviews.length} relevant reviews`);
  } catch (err) {
    console.error(`[ToolReview] HN error:`, err.message);
  }

  if (allRawReviews.length === 0) {
    console.log('[ToolReview] No new reviews found (may be rate limited)');
    return { totalReviews: 0, toolsUpdated: 0, pluginsUpdated: 0 };
  }

  // Deduplicate by post_id
  const seen = new Set();
  const deduped = allRawReviews.filter(r => {
    const key = `${r.source}:${r.post_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`[ToolReview] Deduped: ${allRawReviews.length} → ${deduped.length} unique`);

  // Store raw reviews
  const rawInsert = env.DB.prepare(`
    INSERT OR IGNORE INTO tool_review_raw
      (tool_slug, tool_type, source, post_id, author, text, score, user_type, sentiment, coding_satisfaction, scraped_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const rawBatch = [];
  for (const r of deduped) {
    for (const tool of r.tools) {
      rawBatch.push(rawInsert.bind(
        tool.slug, tool.type, r.source, r.post_id, r.author,
        r.text, r.postScore, r.userType, r.sentiment, r.codingSatisfaction
      ));
    }
  }

  if (rawBatch.length) {
    for (let i = 0; i < rawBatch.length; i += 50) {
      await env.DB.batch(rawBatch.slice(i, i + 50));
    }
  }

  // Aggregate from ALL stored raw data (not just this batch) to prevent drift
  const { results: allStored } = await env.DB.prepare(
    'SELECT tool_slug, tool_type, source, sentiment, coding_satisfaction, user_type, score, text FROM tool_review_raw'
  ).all();

  // Group by tool_slug
  const byTool = {};
  for (const r of allStored) {
    if (!byTool[r.tool_slug]) byTool[r.tool_slug] = { type: r.tool_type, reviews: [] };
    byTool[r.tool_slug].reviews.push(r);
  }

  let toolsUpdated = 0;
  let pluginsUpdated = 0;

  for (const [slug, data] of Object.entries(byTool)) {
    const reviews = data.reviews;
    if (reviews.length < 2) continue; // need minimum signal

    // Compute aggregated scores
    const sentiments = reviews.map(r => r.sentiment).filter(s => s != null);
    const satisfactions = reviews.map(r => r.coding_satisfaction).filter(s => s != null);
    const avgSentiment = sentiments.length ? sentiments.reduce((s, v) => s + v, 0) / sentiments.length : 0;
    const avgSatisfaction = satisfactions.length ? Math.round(satisfactions.reduce((s, v) => s + v, 0) / satisfactions.length) : 50;

    // Extract top themes
    const { complaints, praises } = extractTopThemes(reviews);

    // Group by source for per-source breakdown
    const bySrc = {};
    for (const r of reviews) {
      const srcKey = r.source.startsWith('reddit-') ? 'reddit' : r.source.startsWith('hn') ? 'hackernews' : r.source;
      if (!bySrc[srcKey]) bySrc[srcKey] = [];
      bySrc[srcKey].push(r);
    }

    if (data.type === 'tool') {
      // UPSERT into tool_reviews (per source)
      for (const [source, srcReviews] of Object.entries(bySrc)) {
        const srcSentiments = srcReviews.map(r => r.sentiment).filter(s => s != null);
        const srcSatisfactions = srcReviews.map(r => r.coding_satisfaction).filter(s => s != null);
        const srcAvgSentiment = srcSentiments.length ? srcSentiments.reduce((s, v) => s + v, 0) / srcSentiments.length : 0;
        const srcAvgSat = srcSatisfactions.length ? Math.round(srcSatisfactions.reduce((s, v) => s + v, 0) / srcSatisfactions.length) : 50;
        const { complaints: srcComplaints, praises: srcPraises } = extractTopThemes(srcReviews);

        await env.DB.prepare(`
          INSERT INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints, scraped_at)
          SELECT id, ?, ?, ?, ?, ?, ?, datetime('now')
          FROM tools WHERE slug = ?
          ON CONFLICT(tool_id, source) DO UPDATE SET
            sentiment_score = excluded.sentiment_score,
            satisfaction = excluded.satisfaction,
            review_count = excluded.review_count,
            common_praises = excluded.common_praises,
            common_complaints = excluded.common_complaints,
            scraped_at = datetime('now')
        `).bind(
          source,
          Number(srcAvgSentiment.toFixed(3)),
          srcAvgSat,
          srcReviews.length,
          srcPraises.join(', '),
          srcComplaints.join(', '),
          slug,
        ).run();
      }
      toolsUpdated++;
    } else {
      // Update coding_tools community_rating and review_count
      // Convert sentiment (-1 to +1) to rating (1.0 to 5.0)
      const rating = Number(((avgSentiment + 1) * 2 + 1).toFixed(1));
      const clampedRating = Math.max(1.0, Math.min(5.0, rating));

      await env.DB.prepare(
        'UPDATE coding_tools SET community_rating = ?, review_count = ? WHERE slug = ?'
      ).bind(clampedRating, reviews.length, slug).run();
      pluginsUpdated++;
    }
  }

  console.log(`[ToolReview] Done: ${totalReviews} reviews → ${toolsUpdated} tools, ${pluginsUpdated} plugins updated`);
  return { totalReviews, toolsUpdated, pluginsUpdated };
}
