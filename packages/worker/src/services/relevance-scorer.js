import { SCORING_WEIGHTS, KEYWORDS, SOURCE_WEIGHTS, TAG_WEIGHTS } from '../config/scoring-weights.js';
import { USER_PROFILE } from '../config/user-profile.js';

/**
 * Score all unscored news items by relevance to the user.
 * Each item gets a 0-100 score based on keyword match, source reputation,
 * recency, and category match.
 */
export async function scoreUnscored(env) {
  const unscored = await env.DB.prepare(
    `SELECT id, title, summary, source, published_at FROM news_items WHERE relevance_score = 0`
  ).all();

  const items = unscored.results;
  if (!items.length) {
    console.log('[SCORER] No unscored items found');
    return;
  }

  let totalScore = 0;

  // W5: Batch updates instead of individual DB calls
  const updateStmt = env.DB.prepare(
    `UPDATE news_items SET relevance_score = ?, relevance_tags = ? WHERE id = ?`
  );
  const batch = [];

  for (const item of items) {
    const text = `${item.title} ${item.summary || ''}`.toLowerCase();

    const keywordScore = computeKeywordScore(text);
    const sourceScore = computeSourceScore(item.source);
    const recencyScore = computeRecencyScore(item.published_at);
    const { score: categoryScore, tags } = computeCategoryScore(text);

    const finalScore = Math.round(
      keywordScore * SCORING_WEIGHTS.keyword_match +
      sourceScore * SCORING_WEIGHTS.source_weight +
      recencyScore * SCORING_WEIGHTS.recency +
      categoryScore * SCORING_WEIGHTS.category_match
    );

    const clampedScore = Math.max(0, Math.min(100, finalScore));
    const tagsJson = JSON.stringify(tags);

    batch.push(updateStmt.bind(clampedScore, tagsJson, item.id));
    totalScore += clampedScore;
  }

  // Execute in chunks of 50 (D1 batch limit)
  for (let i = 0; i < batch.length; i += 50) {
    await env.DB.batch(batch.slice(i, i + 50));
  }

  const avgScore = Math.round(totalScore / items.length);
  console.log(`[SCORER] Scored ${items.length} items, avg score: ${avgScore}`);
}

/**
 * Check text against keyword tiers.
 * High tier = 10 pts each (max 50), medium = 5 (max 30), low = 2 (max 20).
 * Normalize to 0-100.
 */
function computeKeywordScore(text) {
  let raw = 0;

  for (const kw of KEYWORDS.high) {
    if (text.includes(kw)) {
      raw += 10;
      if (raw >= 50) break;
    }
  }
  raw = Math.min(raw, 50);

  let mediumPts = 0;
  for (const kw of KEYWORDS.medium) {
    if (text.includes(kw)) {
      mediumPts += 5;
      if (mediumPts >= 30) break;
    }
  }
  raw += Math.min(mediumPts, 30);

  let lowPts = 0;
  for (const kw of KEYWORDS.low) {
    if (text.includes(kw)) {
      lowPts += 2;
      if (lowPts >= 20) break;
    }
  }
  raw += Math.min(lowPts, 20);

  // Max possible raw = 50 + 30 + 20 = 100
  return Math.min(100, raw);
}

/**
 * Look up source reputation. Unknown sources get 0.4 default.
 */
function computeSourceScore(source) {
  const weight = SOURCE_WEIGHTS[source] ?? 0.4;
  return weight * 100;
}

/**
 * Score based on how recent the article is.
 * 0h = 100, decays at 0.5 per hour. 7d = ~16.
 */
function computeRecencyScore(publishedAt) {
  if (!publishedAt) return 50;
  const now = Date.now();
  const published = new Date(publishedAt).getTime();
  const hoursAgo = (now - published) / (1000 * 60 * 60);
  return Math.max(0, Math.round(100 - hoursAgo * 0.5));
}

function matchesAnyPattern(text, patterns) {
  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) return pattern.test(text);
    return text.includes(pattern);
  });
}

/**
 * Detect category tags from text and score them.
 * Boost if a tag relates to user's subscribed tools.
 */
export function computeCategoryScore(text) {
  const normalizedText = text.toLowerCase();
  const tags = new Set();

  const mentionsCodingTerms = matchesAnyPattern(normalizedText, [
    'coding', 'code generation', 'developer', 'developers', 'software engineering',
    'swe-bench', 'livecodebench', 'cli', 'agentic coding', 'editor', 'ide',
    'vibe coding', 'app design', 'ui generation', 'design-to-code', 'prototype to code',
  ]);
  const mentionsCodingVendors = matchesAnyPattern(normalizedText, [
    'claude', 'claude code', 'gpt', 'openai', 'codex', 'gemini', 'gemini code assist',
    'copilot', 'github copilot', 'glm', 'zhipu', 'kimi', 'moonshot', 'minimax',
    'cursor', 'windsurf', 'aider', 'roo code', 'antigravity',
  ]);
  const mentionsPlanTerms = matchesAnyPattern(normalizedText, [
    'price', 'pricing', 'cost', 'plan', 'subscription', 'tier', 'seat', 'per seat',
    'team plan', 'enterprise plan', 'usage cap', 'rate limit', 'quota', 'credits',
    'pro+', 'pro plus', 'max plan', 'monthly', 'monthly billing', 'annual billing',
  ]);
  const mentionsReleaseTerms = matchesAnyPattern(normalizedText, [
    'release', 'launch', 'new model', 'announce', 'announced', 'introducing', 'now available', 'rollout',
  ]);
  const mentionsBenchmarks = matchesAnyPattern(normalizedText, [
    'benchmark', 'eval', 'evaluation', 'score', 'performance', 'swe-bench', 'livecodebench', 'gpqa', 'arena',
  ]);
  const mentionsToolTerms = matchesAnyPattern(normalizedText, [
    'tool', 'editor', 'extension', 'plugin', 'cli', 'workspace', 'ide', 'agent', 'assistant', 'copilot', 'cursor', 'windsurf',
  ]);
  const mentionsTutorialTerms = matchesAnyPattern(normalizedText, ['tutorial', 'guide', 'how to', 'walkthrough']);

  if (mentionsCodingVendors && mentionsCodingTerms) {
    tags.add('coding-model');
  }
  if (mentionsPlanTerms && (mentionsCodingVendors || mentionsCodingTerms || mentionsToolTerms)) {
    tags.add('coding-plan');
    tags.add('pricing-change');
  }
  if (mentionsCodingTerms && mentionsToolTerms) {
    tags.add('coding-tool');
    tags.add('tool-update');
  } else if (matchesAnyPattern(normalizedText, ['update', 'upgrade', 'version'])) {
    tags.add('tool-update');
  }
  if (matchesAnyPattern(normalizedText, ['vibe coding', 'app design', 'ui generation', 'design-to-code', 'prototype to code'])) {
    tags.add('vibe-coding');
  }
  if (mentionsCodingVendors && mentionsReleaseTerms) {
    tags.add('model-release');
  }
  if (mentionsBenchmarks) {
    tags.add('benchmark');
  }
  if (matchesAnyPattern(normalizedText, ['new tool', 'introducing', 'now available']) && mentionsToolTerms) {
    tags.add('new-tool');
  }
  if (mentionsTutorialTerms) {
    tags.add('tutorial');
  }

  if (tags.size === 0) {
    tags.add('general-ai');
  }

  // Score = best tag weight, not sum, to avoid over-counting
  let bestWeight = 0;
  for (const tag of tags) {
    const w = TAG_WEIGHTS[tag] ?? 0.2;
    if (w > bestWeight) bestWeight = w;
  }

  let score = bestWeight * 100;

  // Boost if any detected tag relates to user's current tools
  const toolNames = USER_PROFILE.current_tools.map(t => t.toLowerCase());
  const mentionsUserTool = toolNames.some(tool => text.includes(tool));
  if (mentionsUserTool) {
    score = Math.min(100, score + 15);
  }

  return { score: Math.round(score), tags: [...tags] };
}
