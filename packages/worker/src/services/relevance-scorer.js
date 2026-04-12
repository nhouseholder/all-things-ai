import { SCORING_WEIGHTS, KEYWORDS, SOURCE_WEIGHTS, TAG_WEIGHTS } from '../config/scoring-weights.js';
import { USER_PROFILE } from '../config/user-profile.js';

function clampInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

async function scoreItems(env, items) {
  if (!items.length) {
    return { scored: 0, avgScore: 0 };
  }

  let totalScore = 0;

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
    batch.push(updateStmt.bind(clampedScore, JSON.stringify(tags), item.id));
    totalScore += clampedScore;
  }

  for (let index = 0; index < batch.length; index += 50) {
    await env.DB.batch(batch.slice(index, index + 50));
  }

  return {
    scored: items.length,
    avgScore: Math.round(totalScore / items.length),
  };
}

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

  const { avgScore } = await scoreItems(env, items);
  console.log(`[SCORER] Scored ${items.length} items, avg score: ${avgScore}`);
}

export async function rescoreRecentNews(env, options = {}) {
  const days = clampInteger(options.days, 45, 1, 90);
  const limit = clampInteger(options.limit, 250, 25, 1000);

  const recent = await env.DB.prepare(`
    SELECT id, title, summary, source, published_at
    FROM news_items
    WHERE datetime(published_at) >= datetime('now', ?)
    ORDER BY published_at DESC
    LIMIT ?
  `).bind(`-${days} days`, limit).all();

  const items = recent.results;
  if (!items.length) {
    console.log('[SCORER] No recent items found to rescore');
    return { rescored: 0, avgScore: 0, days, limit };
  }

  const { scored, avgScore } = await scoreItems(env, items);
  console.log(`[SCORER] Rescored ${scored} recent items, avg score: ${avgScore}`);
  return { rescored: scored, avgScore, days, limit };
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
    /\$\s*\d+(?:\.\d+)?\s*(?:\/|per\s+)(?:month|mo|seat|user|year|yr)\b/,
    'price', 'pricing', 'cost', 'subscription', 'tier', 'seat', 'per seat',
    'team plan', 'enterprise plan', 'usage cap', 'rate limit', 'quota', 'credits',
    'pro+', 'pro plus', 'max plan', 'monthly billing', 'annual billing',
    'monthly subscription', 'annual subscription', 'pro plan', 'starter plan', 'business plan',
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
  const mentionsModelIdentity = matchesAnyPattern(normalizedText, [
    /\b(?:claude|gpt|chatgpt|gemini|codex|copilot|glm|qwen|deepseek|grok|mistral|llama|kimi|minimax|phi|gemma|yi|command|jamba|mythos|sonar)(?:[\s-]+[a-z0-9.+-]+){0,2}\b/,
  ]);
  const mentionsModelContext = matchesAnyPattern(normalizedText, [
    'model', 'models', 'capability', 'capabilities', 'checkpoint', 'checkpoints', 'weights', 'reasoning',
  ]) || mentionsBenchmarks || mentionsCodingTerms;
  const mentionsInvestigationTerms = matchesAnyPattern(normalizedText, [
    'investigation', 'probe', 'lawsuit', 'sues', 'suing', 'shooting', 'safety',
    'protect the internet', 'regulator', 'antitrust', 'hearing',
  ]);
  const mentionsModelReleaseSpecifics = matchesAnyPattern(normalizedText, [
    'new model', 'model release', 'capability', 'capabilities', 'benchmark', 'swe-bench', 'livecodebench', 'code generation',
  ]);
  const isPlanOnlyStory = mentionsPlanTerms && !mentionsModelReleaseSpecifics;

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
  if (mentionsCodingVendors && mentionsReleaseTerms && mentionsModelIdentity && mentionsModelContext && !mentionsInvestigationTerms && !isPlanOnlyStory) {
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
