-- Raw tool/plugin reviews scraped from Reddit and HN
CREATE TABLE IF NOT EXISTS tool_review_raw (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_slug TEXT NOT NULL,
  tool_type TEXT NOT NULL,       -- 'tool' (IDE tools) or 'plugin' (coding_tools)
  source TEXT NOT NULL,          -- e.g. 'reddit-cursorai', 'hn-tools'
  post_id TEXT NOT NULL,
  author TEXT,
  text TEXT,
  score INTEGER DEFAULT 0,
  user_type TEXT,                -- casual, vibe_coder, heavy_coder
  sentiment REAL,
  coding_satisfaction INTEGER,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tool_slug, source, post_id)
);

CREATE INDEX IF NOT EXISTS idx_trr_slug ON tool_review_raw(tool_slug);
CREATE INDEX IF NOT EXISTS idx_trr_source ON tool_review_raw(source);
CREATE INDEX IF NOT EXISTS idx_trr_scraped ON tool_review_raw(scraped_at DESC);
