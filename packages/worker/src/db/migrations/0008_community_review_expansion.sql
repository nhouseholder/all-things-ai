-- Migration: Expand community reviews with user-type breakdown and raw review storage
-- Adds columns for casual/vibe-coder/heavy-coder breakdown and raw review text cache

-- Add user-type breakdown columns to community_reviews
ALTER TABLE community_reviews ADD COLUMN casual_sentiment REAL DEFAULT 0 CHECK(casual_sentiment BETWEEN -1 AND 1);
ALTER TABLE community_reviews ADD COLUMN casual_satisfaction INTEGER DEFAULT 50 CHECK(casual_satisfaction BETWEEN 0 AND 100);
ALTER TABLE community_reviews ADD COLUMN casual_count INTEGER DEFAULT 0;

ALTER TABLE community_reviews ADD COLUMN vibe_coder_sentiment REAL DEFAULT 0 CHECK(vibe_coder_sentiment BETWEEN -1 AND 1);
ALTER TABLE community_reviews ADD COLUMN vibe_coder_satisfaction INTEGER DEFAULT 50 CHECK(vibe_coder_satisfaction BETWEEN 0 AND 100);
ALTER TABLE community_reviews ADD COLUMN vibe_coder_count INTEGER DEFAULT 0;

ALTER TABLE community_reviews ADD COLUMN heavy_coder_sentiment REAL DEFAULT 0 CHECK(heavy_coder_sentiment BETWEEN -1 AND 1);
ALTER TABLE community_reviews ADD COLUMN heavy_coder_satisfaction INTEGER DEFAULT 50 CHECK(heavy_coder_satisfaction BETWEEN 0 AND 100);
ALTER TABLE community_reviews ADD COLUMN heavy_coder_count INTEGER DEFAULT 0;

-- Raw review cache: stores individual scraped comments for audit trail
CREATE TABLE IF NOT EXISTS community_review_raw (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_slug TEXT NOT NULL,
    source TEXT NOT NULL,
    post_id TEXT NOT NULL,
    author TEXT,
    text TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    user_type TEXT NOT NULL DEFAULT 'casual' CHECK(user_type IN ('casual','vibe_coder','heavy_coder')),
    sentiment REAL DEFAULT 0 CHECK(sentiment BETWEEN -1 AND 1),
    coding_satisfaction INTEGER CHECK(coding_satisfaction BETWEEN 0 AND 100),
    keywords_matched TEXT,
    scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(source, post_id, author)
);
CREATE INDEX IF NOT EXISTS idx_crr_model ON community_review_raw(model_slug);
CREATE INDEX IF NOT EXISTS idx_crr_source ON community_review_raw(source);
