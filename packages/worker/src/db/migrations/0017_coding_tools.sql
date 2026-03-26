-- ============================================================
-- 0017_coding_tools.sql — AI Coding Tools Directory
-- Database for plugins, skills, agents, MCP servers, repos, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS coding_tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    subcategory TEXT,
    description TEXT NOT NULL,
    short_description TEXT,
    url TEXT,
    github_url TEXT,
    source TEXT DEFAULT 'manual',
    platform TEXT DEFAULT 'universal',
    languages TEXT,
    frameworks TEXT,
    use_cases TEXT,
    setup_complexity TEXT DEFAULT 'easy',
    setup_instructions TEXT,
    requires TEXT,
    pricing TEXT DEFAULT 'free',
    stars INTEGER,
    last_updated TEXT,
    community_rating REAL,
    review_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ct_category ON coding_tools(category);
CREATE INDEX IF NOT EXISTS idx_ct_platform ON coding_tools(platform);

CREATE TABLE IF NOT EXISTS coding_tool_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL REFERENCES coding_tools(id),
    tag TEXT NOT NULL,
    UNIQUE(tool_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_ctt_tag ON coding_tool_tags(tag);
CREATE INDEX IF NOT EXISTS idx_ctt_tool ON coding_tool_tags(tool_id);
