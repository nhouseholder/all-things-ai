-- ============================================================
-- Migration 0019: Tool & Plugin Ranking Systems
-- Adds composite scoring for IDE tools and coding tools/plugins
-- ============================================================

-- Tool features for feature-coverage scoring (IDE tools like Cursor, Claude Code, etc.)
CREATE TABLE IF NOT EXISTS tool_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    feature TEXT NOT NULL,
    supported INTEGER DEFAULT 1,
    UNIQUE(tool_id, feature)
);
CREATE INDEX IF NOT EXISTS idx_tf_tool ON tool_features(tool_id);

-- Tool reviews (community signals for IDE tools, mirrors community_reviews pattern)
CREATE TABLE IF NOT EXISTS tool_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES tools(id),
    source TEXT NOT NULL,
    sentiment_score REAL DEFAULT 0,
    satisfaction INTEGER DEFAULT 50,
    review_count INTEGER DEFAULT 0,
    common_complaints TEXT,
    common_praises TEXT,
    scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(tool_id, source)
);
CREATE INDEX IF NOT EXISTS idx_tr_tool ON tool_reviews(tool_id);

-- Tool composite scores (IDE tools like Cursor, Claude Code, Windsurf)
CREATE TABLE IF NOT EXISTS tool_composite_scores (
    tool_id INTEGER PRIMARY KEY REFERENCES tools(id),
    model_breadth_score REAL DEFAULT 0,
    pricing_score REAL DEFAULT 0,
    community_score REAL DEFAULT 0,
    feature_score REAL DEFAULT 0,
    freshness_score REAL DEFAULT 0,
    composite_score REAL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Plugin composite scores (coding tools: MCP servers, skills, extensions, agents)
CREATE TABLE IF NOT EXISTS plugin_composite_scores (
    plugin_id INTEGER PRIMARY KEY REFERENCES coding_tools(id),
    stars_score REAL DEFAULT 0,
    freshness_score REAL DEFAULT 0,
    compatibility_score REAL DEFAULT 0,
    community_score REAL DEFAULT 0,
    simplicity_score REAL DEFAULT 0,
    docs_score REAL DEFAULT 0,
    composite_score REAL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Add missing columns to existing tables
-- tools: last_release_date for freshness scoring
ALTER TABLE tools ADD COLUMN last_release_date TEXT;
-- coding_tools: has_docs for documentation scoring
ALTER TABLE coding_tools ADD COLUMN has_docs INTEGER DEFAULT 0;

-- ============================================================
-- Seed: tool_features (10 standard features across IDE tools)
-- ============================================================

-- Get tool IDs by name — features for all known IDE tools
-- Cursor
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'agent_mode', 1 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'inline_edit', 1 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'terminal', 1 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'multi_file', 1 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'git_integration', 1 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'image_support', 1 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'voice_mode', 0 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'web_search', 1 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'custom_rules', 1 FROM tools WHERE slug = 'cursor';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'mcp_support', 1 FROM tools WHERE slug = 'cursor';

-- Claude Code
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'agent_mode', 1 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'inline_edit', 0 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'terminal', 1 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'multi_file', 1 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'git_integration', 1 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'image_support', 1 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'voice_mode', 0 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'web_search', 1 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'custom_rules', 1 FROM tools WHERE slug = 'claude-code';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'mcp_support', 1 FROM tools WHERE slug = 'claude-code';

-- Windsurf
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'agent_mode', 1 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'inline_edit', 1 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'terminal', 1 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'multi_file', 1 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'git_integration', 1 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'image_support', 1 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'voice_mode', 0 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'web_search', 1 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'custom_rules', 1 FROM tools WHERE slug = 'windsurf';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'mcp_support', 1 FROM tools WHERE slug = 'windsurf';

-- GitHub Copilot
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'agent_mode', 1 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'inline_edit', 1 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'terminal', 1 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'multi_file', 1 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'git_integration', 1 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'image_support', 0 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'voice_mode', 1 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'web_search', 1 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'custom_rules', 1 FROM tools WHERE slug = 'github-copilot';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'mcp_support', 1 FROM tools WHERE slug = 'github-copilot';

-- Cody (Sourcegraph)
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'agent_mode', 1 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'inline_edit', 1 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'terminal', 0 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'multi_file', 1 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'git_integration', 0 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'image_support', 0 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'voice_mode', 0 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'web_search', 0 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'custom_rules', 1 FROM tools WHERE slug = 'cody';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'mcp_support', 0 FROM tools WHERE slug = 'cody';

-- Aider
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'agent_mode', 1 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'inline_edit', 0 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'terminal', 1 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'multi_file', 1 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'git_integration', 1 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'image_support', 1 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'voice_mode', 1 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'web_search', 0 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'custom_rules', 1 FROM tools WHERE slug = 'aider';
INSERT OR IGNORE INTO tool_features (tool_id, feature, supported) SELECT id, 'mcp_support', 0 FROM tools WHERE slug = 'aider';

-- ============================================================
-- Seed: tool_reviews (community sentiment for major IDE tools)
-- Sources: reddit, hackernews, twitter
-- ============================================================

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'reddit', 0.72, 78, 340, 'Fast agent mode, great autocomplete, good model selection', 'Expensive, occasional context window issues, buggy tab completion'
FROM tools WHERE slug = 'cursor';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'hackernews', 0.65, 72, 180, 'Powerful for complex projects, good UX', 'High price, telemetry concerns'
FROM tools WHERE slug = 'cursor';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'reddit', 0.82, 85, 280, 'Best autonomous agent, deep codebase understanding, hooks system, MCP ecosystem', 'Terminal-only, steep learning curve, token costs'
FROM tools WHERE slug = 'claude-code';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'hackernews', 0.78, 82, 150, 'Excellent for greenfield + refactoring, great CLI experience', 'No GUI, API costs can spike'
FROM tools WHERE slug = 'claude-code';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'reddit', 0.58, 65, 220, 'Good Cascade agent, nice UI, affordable', 'Inconsistent quality, slower than Cursor, context issues'
FROM tools WHERE slug = 'windsurf';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'hackernews', 0.52, 60, 90, 'Decent free tier', 'Reliability issues, less mature than competitors'
FROM tools WHERE slug = 'windsurf';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'reddit', 0.55, 62, 450, 'Good inline completions, works everywhere, free tier', 'Agent mode behind competitors, workspace less context-aware'
FROM tools WHERE slug = 'github-copilot';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'hackernews', 0.48, 58, 280, 'Enterprise integration, familiar GitHub ecosystem', 'Not as capable as Cursor/Claude Code for complex tasks'
FROM tools WHERE slug = 'github-copilot';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'reddit', 0.45, 55, 80, 'Good codebase search, bring your own model', 'Smaller community, fewer features than top tools'
FROM tools WHERE slug = 'cody';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'reddit', 0.70, 76, 190, 'Great for terminal users, excellent git integration, open source', 'CLI only, setup complexity, no inline edit'
FROM tools WHERE slug = 'aider';

INSERT OR IGNORE INTO tool_reviews (tool_id, source, sentiment_score, satisfaction, review_count, common_praises, common_complaints)
SELECT id, 'hackernews', 0.68, 74, 120, 'Transparent pricing (BYOK), voice mode, active development', 'Learning curve, requires API keys'
FROM tools WHERE slug = 'aider';

-- ============================================================
-- Seed: last_release_date for tools (freshness)
-- ============================================================
UPDATE tools SET last_release_date = '2026-03-20' WHERE slug = 'cursor';
UPDATE tools SET last_release_date = '2026-03-24' WHERE slug = 'claude-code';
UPDATE tools SET last_release_date = '2026-03-18' WHERE slug = 'windsurf';
UPDATE tools SET last_release_date = '2026-03-15' WHERE slug = 'github-copilot';
UPDATE tools SET last_release_date = '2026-02-28' WHERE slug = 'cody';
UPDATE tools SET last_release_date = '2026-03-22' WHERE slug = 'aider';

-- ============================================================
-- Seed: has_docs for coding tools (plugins)
-- ============================================================
UPDATE coding_tools SET has_docs = 1 WHERE slug IN (
  'claude-code-hooks', 'cursor-rules', 'modelcontextprotocol-servers',
  'mcpso', 'glama-mcp', 'openctx', 'aider-chat', 'continue-dev',
  'tabby-ml', 'cline', 'roo-code', 'open-interpreter',
  'sweep-ai', 'codegen-sh', 'devin', 'bolt-new'
);

-- Backfill community_rating for top coding tools based on stars + community signal
UPDATE coding_tools SET community_rating = 4.6, review_count = 85 WHERE slug = 'modelcontextprotocol-servers';
UPDATE coding_tools SET community_rating = 4.3, review_count = 45 WHERE slug = 'claude-code-hooks';
UPDATE coding_tools SET community_rating = 4.5, review_count = 120 WHERE slug = 'cursor-rules';
UPDATE coding_tools SET community_rating = 4.2, review_count = 60 WHERE slug = 'cline';
UPDATE coding_tools SET community_rating = 4.4, review_count = 95 WHERE slug = 'aider-chat';
UPDATE coding_tools SET community_rating = 4.1, review_count = 35 WHERE slug = 'continue-dev';
UPDATE coding_tools SET community_rating = 4.0, review_count = 30 WHERE slug = 'tabby-ml';
UPDATE coding_tools SET community_rating = 3.8, review_count = 20 WHERE slug = 'open-interpreter';
UPDATE coding_tools SET community_rating = 4.7, review_count = 150 WHERE slug = 'bolt-new';
UPDATE coding_tools SET community_rating = 4.3, review_count = 55 WHERE slug = 'roo-code';
UPDATE coding_tools SET community_rating = 3.9, review_count = 25 WHERE slug = 'sweep-ai';
UPDATE coding_tools SET community_rating = 4.5, review_count = 110 WHERE slug = 'devin';
UPDATE coding_tools SET community_rating = 4.2, review_count = 40 WHERE slug = 'mcpso';
UPDATE coding_tools SET community_rating = 4.1, review_count = 30 WHERE slug = 'glama-mcp';
UPDATE coding_tools SET community_rating = 4.4, review_count = 70 WHERE slug = 'codegen-sh';
