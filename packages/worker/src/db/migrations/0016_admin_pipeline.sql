-- ============================================================
-- 0016_admin_pipeline.sql — Model discovery & enrichment tables
-- Adds pending_models staging table and dynamic model_aliases
-- ============================================================

-- Staging table for models awaiting review
CREATE TABLE IF NOT EXISTS pending_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    vendor TEXT NOT NULL,
    family TEXT,
    release_date TEXT,
    description TEXT,
    input_price_per_mtok REAL,
    output_price_per_mtok REAL,
    cache_hit_price_per_mtok REAL,
    context_window INTEGER,
    is_open_weight INTEGER DEFAULT 0,
    discovery_source TEXT,
    discovery_url TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Dynamic model aliases for community review matching
CREATE TABLE IF NOT EXISTS model_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_slug TEXT NOT NULL,
    alias TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alias_slug ON model_aliases(model_slug);

-- Backfill existing hardcoded aliases into model_aliases table
-- Claude family
INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES
('claude-opus-4.6', 'opus 4.6'), ('claude-opus-4.6', 'opus4.6'), ('claude-opus-4.6', 'claude opus'), ('claude-opus-4.6', 'opus 4'), ('claude-opus-4.6', 'opus46'),
('claude-sonnet-4.6', 'sonnet 4.6'), ('claude-sonnet-4.6', 'sonnet4.6'), ('claude-sonnet-4.6', 'claude sonnet'), ('claude-sonnet-4.6', 'sonnet 4'), ('claude-sonnet-4.6', 'sonnet46'),
('claude-opus-4.5', 'opus 4.5'), ('claude-opus-4.5', 'opus4.5'), ('claude-opus-4.5', 'opus 4.5 model'),
('claude-haiku-4.5', 'haiku 4.5'), ('claude-haiku-4.5', 'haiku4.5'), ('claude-haiku-4.5', 'claude haiku'),
-- GPT family
('gpt-5.4', 'gpt-5.4'), ('gpt-5.4', 'gpt5.4'), ('gpt-5.4', 'gpt 5.4'), ('gpt-5.4', 'chatgpt 5'), ('gpt-5.4', 'gpt-5'),
('gpt-5.4-high', 'gpt-5.4 high'), ('gpt-5.4-high', 'high thinking'),
('gpt-5.4-xhigh', 'gpt-5.4 xhigh'), ('gpt-5.4-xhigh', 'xhigh thinking'),
('gpt-o3', 'o3'), ('gpt-o3', 'gpt o3'), ('gpt-o3', 'openai o3'),
('gpt-5.3-codex', 'codex'), ('gpt-5.3-codex', 'gpt codex'), ('gpt-5.3-codex', 'codex cli'),
-- Gemini family
('gemini-3.1-pro', 'gemini 3.1'), ('gemini-3.1-pro', 'gemini pro'), ('gemini-3.1-pro', 'gemini 3.1 pro'),
('gemini-3-flash', 'gemini flash'), ('gemini-3-flash', 'gemini 3 flash'),
('gemini-3-pro', 'gemini 3 pro'),
-- DeepSeek
('deepseek-v3', 'deepseek v3'), ('deepseek-v3', 'deepseek-v3'), ('deepseek-v3', 'deepseek'),
('deepseek-r1', 'deepseek r1'), ('deepseek-r1', 'deepseek reasoning'),
-- Open source
('llama-4-maverick', 'llama 4'), ('llama-4-maverick', 'llama maverick'), ('llama-4-maverick', 'llama-4'),
('llama-4-scout', 'llama scout'), ('llama-4-scout', 'llama 4 scout'),
('mistral-large-2', 'mistral large'), ('mistral-large-2', 'mistral-large'),
('codestral', 'codestral'), ('codestral', 'mistral code'),
('qwen-3-235b', 'qwen 3'), ('qwen-3-235b', 'qwen-3'), ('qwen-3-235b', 'qwen 235b'),
-- Others
('grok-4', 'grok 4'), ('grok-4', 'grok4'), ('grok-4', 'grok'),
('z-ai-glm-5', 'glm-5'), ('z-ai-glm-5', 'glm 5'), ('z-ai-glm-5', 'z ai'),
('minimax-m2.5', 'minimax'), ('minimax-m2.5', 'minimax m2.5'), ('minimax-m2.5', 'abab');
