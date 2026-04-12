ALTER TABLE models ADD COLUMN version_string TEXT;

CREATE INDEX IF NOT EXISTS idx_models_version_string ON models(version_string);

ALTER TABLE pending_models ADD COLUMN version_string TEXT;
ALTER TABLE pending_models ADD COLUMN openrouter_id TEXT;
ALTER TABLE pending_models ADD COLUMN metadata TEXT;
ALTER TABLE pending_models ADD COLUMN published_model_id INTEGER;
ALTER TABLE pending_models ADD COLUMN decision_source TEXT;
ALTER TABLE pending_models ADD COLUMN last_seen_at TEXT;

UPDATE pending_models
SET last_seen_at = COALESCE(last_seen_at, created_at, datetime('now'));

CREATE INDEX IF NOT EXISTS idx_pending_status_seen ON pending_models(status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_published_model ON pending_models(published_model_id);

CREATE TABLE IF NOT EXISTS model_candidate_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pending_model_id INTEGER NOT NULL REFERENCES pending_models(id),
  signal_type TEXT NOT NULL CHECK(signal_type IN ('official','catalog','news','community')),
  source_key TEXT NOT NULL,
  source_label TEXT,
  source_url TEXT,
  content_url TEXT,
  signal_hash TEXT NOT NULL UNIQUE,
  title TEXT,
  summary TEXT,
  metadata TEXT,
  detected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_model_candidate_signals_pending ON model_candidate_signals(pending_model_id);
CREATE INDEX IF NOT EXISTS idx_model_candidate_signals_type ON model_candidate_signals(signal_type);