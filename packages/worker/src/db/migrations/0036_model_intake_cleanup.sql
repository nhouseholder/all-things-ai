-- 0036: Repair broken auto-discovery artifacts (2026-04-16)
--
-- Fixes:
--   1. Retire dupe Sonnet 4.6 (id=100) — canonical is Claude Sonnet 4.6 (id=11)
--   2. Retire dupe Haiku 4.5 (id=101) — canonical is Claude Haiku 4.5 (id=12)
--   3. Canonicalize bare "Opus 4.7" (id=99) → "Claude Opus 4.7" with slug/release_date/pricing
--   4. Hand-seed Meta Muse Spark (2026-04-08)
--   5. Purge garbage pending_models rows
--   6. Create model_enrichment_queue and monitor_fetch_failures tables

UPDATE models SET is_active = 0, discovery_source = 'retired-duplicate', updated_at = datetime('now')
  WHERE id IN (100, 101);

UPDATE models
  SET name = 'Claude Opus 4.7',
      slug = 'claude-opus-4.7',
      family = 'Claude',
      version_string = '4.7',
      release_date = '2026-04-16',
      description = 'Flagship Claude model — stronger SWE, sharper instruction following, improved long-running agent reliability. 13% SWE-bench lift over Opus 4.6.',
      input_price_per_mtok = 5.0,
      output_price_per_mtok = 25.0,
      cache_hit_price_per_mtok = 0.5,
      context_window = 200000,
      updated_at = datetime('now')
  WHERE id = 99;

INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES
  ('claude-opus-4.7', 'claude opus 4.7'),
  ('claude-opus-4.7', 'claude-opus-4.7'),
  ('claude-opus-4.7', 'claude-opus-4-7'),
  ('claude-opus-4.7', 'opus 4.7'),
  ('claude-opus-4.7', 'opus-4-7'),
  ('claude-opus-4.7', 'opus-4.7');

INSERT INTO models (
  name, slug, vendor, family, version_string, release_date, description,
  is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok,
  context_window, is_open_weight, discovery_source, openrouter_id, updated_at
) VALUES (
  'Meta Muse Spark', 'meta-muse-spark', 'Meta', 'Muse', 'spark', '2026-04-08',
  'Meta Superintelligence Labs closed-weights model. Uses "thought compression" reinforcement learning. Available on meta.ai only.',
  1, NULL, NULL, NULL, NULL, 0, 'manual-seed', NULL, datetime('now')
);

INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES
  ('meta-muse-spark', 'muse spark'),
  ('meta-muse-spark', 'muse-spark'),
  ('meta-muse-spark', 'meta muse'),
  ('meta-muse-spark', 'meta-muse-spark');

DELETE FROM model_candidate_signals
  WHERE pending_model_id IN (
    SELECT id FROM pending_models WHERE slug IN (
      'sonnet-4-6-sonnet-4-6',
      'claude-sonnet-4-6-sonnet',
      'opus-4-6',
      'sonnet-4-6',
      'haiku-4-5',
      'gemini-large',
      'spec',
      'claude-code'
    )
  );

DELETE FROM pending_models
  WHERE slug IN (
    'sonnet-4-6-sonnet-4-6',
    'claude-sonnet-4-6-sonnet',
    'opus-4-6',
    'sonnet-4-6',
    'haiku-4-5',
    'gemini-large',
    'spec',
    'claude-code'
  );

CREATE TABLE IF NOT EXISTS model_enrichment_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL,
  slug TEXT NOT NULL,
  reason TEXT,
  queued_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT,
  status TEXT DEFAULT 'pending',
  UNIQUE(model_id, reason)
);
CREATE INDEX IF NOT EXISTS idx_enrichment_pending ON model_enrichment_queue(status, queued_at);

CREATE TABLE IF NOT EXISTS monitor_fetch_failures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL,
  error_message TEXT,
  failed_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fetch_failures_source ON monitor_fetch_failures(source_key, failed_at);
