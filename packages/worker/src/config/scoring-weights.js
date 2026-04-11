// Relevance scoring configuration — all weights tunable
export const SCORING_WEIGHTS = {
  keyword_match: 0.40,
  source_weight: 0.20,
  recency: 0.20,
  category_match: 0.20,
};

// Keywords by priority tier
export const KEYWORDS = {
  high: [
    'claude', 'anthropic', 'claude code', 'opus', 'sonnet',
    'cursor', 'windsurf', 'codex', 'copilot', 'github copilot',
    'gpt-5', 'gpt-5.4', 'gpt-5.4 pro', 'gemini code assist',
    'agentic coding', 'vibe coding', 'app design',
    'cloudflare', 'workers ai',
    'python', 'javascript',
  ],
  medium: [
    'coding assistant', 'ai coding', 'code generation', 'debugging',
    'agent', 'agentic', 'benchmark', 'swe-bench',
    'pricing', 'plan', 'subscription', 'seat', 'per seat', 'team plan',
    'usage cap', 'rate limit', 'quota', 'pro+', 'pro plus', 'max plan',
    'gpt', 'openai', 'gemini', 'google ai',
    'copilot pro', 'copilot pro+', 'claude max', 'claude pro',
    'glm', 'zhipu', 'kimi', 'moonshot', 'minimax',
    'llm', 'language model', 'reasoning',
    'roo code', 'silo code', 'antigravity', 'aider',
  ],
  low: [
    'artificial intelligence', 'machine learning', 'neural network',
    'transformer', 'fine-tuning', 'open source', 'model release',
    'developer workflow', 'software engineering', 'ui generation',
    'design-to-code', 'prototype to code',
  ],
};

// Source reputation scores (0-1)
export const SOURCE_WEIGHTS = {
  'rss:anthropic': 1.0,
  'rss:openai': 1.0,
  'rss:google-ai': 0.9,
  'rss:huggingface': 0.85,
  'rss:techcrunch-ai': 0.8,
  'rss:verge-ai': 0.75,
  'rss:arstechnica': 0.75,
  'reddit:locallama': 0.7,
  'reddit:ml': 0.65,
  'reddit:artificial': 0.6,
  'hn': 0.7,
};

// Relevance tag weights
export const TAG_WEIGHTS = {
  'coding-model': 0.95,
  'coding-plan': 0.92,
  'pricing-change': 1.0,
  'model-release': 0.9,
  'vibe-coding': 0.88,
  'coding-tool': 0.86,
  'tool-update': 0.85,
  'new-tool': 0.8,
  'benchmark': 0.75,
  'tutorial': 0.5,
  'opinion': 0.3,
  'general-ai': 0.2,
};
