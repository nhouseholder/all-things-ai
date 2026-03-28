-- Industry Alerts: tracks detected changes from AI vendor blogs, pricing pages, and news sources
CREATE TABLE IF NOT EXISTS industry_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,             -- e.g. 'openai-blog', 'anthropic-pricing', 'hn'
  source_url TEXT NOT NULL,
  event_type TEXT NOT NULL,         -- 'new-model', 'pricing-change', 'new-plan', 'new-feature', 'new-product', 'announcement', 'other'
  title TEXT NOT NULL,
  summary TEXT,                     -- AI-generated summary of the change
  raw_snippet TEXT,                 -- raw text snippet that triggered detection
  importance TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  is_read INTEGER DEFAULT 0,
  is_dismissed INTEGER DEFAULT 0,
  detected_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT,                -- when the source content was published (if known)
  metadata TEXT,                    -- JSON blob for extra structured data (prices, model names, etc.)
  UNIQUE(source, title)             -- prevent duplicate alerts for same source+title
);

CREATE INDEX IF NOT EXISTS idx_alerts_detected ON industry_alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON industry_alerts(is_read, is_dismissed, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON industry_alerts(event_type);

-- Content hashes: tracks page content hashes for change detection
CREATE TABLE IF NOT EXISTS content_hashes (
  source_key TEXT PRIMARY KEY,      -- unique key per monitored page (e.g. 'openai-blog')
  content_hash TEXT NOT NULL,       -- SHA-256 of page content
  last_checked TEXT NOT NULL DEFAULT (datetime('now')),
  last_changed TEXT                 -- when content last changed
);
