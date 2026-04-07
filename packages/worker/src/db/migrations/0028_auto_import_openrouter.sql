-- ============================================================
-- 0028_auto_import_openrouter.sql — Add discovery_source to models for auto-import tracking
-- Generated: 2026-04-07
-- ============================================================

-- Track where a model was discovered (manual seed, openrouter auto-import, news discovery)
ALTER TABLE models ADD COLUMN discovery_source TEXT DEFAULT 'seed';

-- Track the OpenRouter ID directly on the model for faster lookups
ALTER TABLE models ADD COLUMN openrouter_id TEXT;

-- Index for filtering by discovery source
CREATE INDEX IF NOT EXISTS idx_models_discovery_source ON models(discovery_source);
