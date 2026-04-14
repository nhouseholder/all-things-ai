-- ============================================================
-- 0034_recent_model_releases.sql
-- Ensure recent coding-model releases appear on the News
-- "Recently Added Models" section (driven by recent release_date).
--
-- The models themselves were seeded in earlier migrations
-- (0031 for minimax-m2.7, kimi-k2.5, glm-5.1, qwen-3.5-plus;
--  0033 for qwen-3.6-plus) but without release_date, so the
-- News whats-new query (which uses COALESCE(release_date, updated_at))
-- couldn't date them as recent.
--
-- Backfill release_date + bump updated_at for coding-model releases
-- users asked about.
-- ============================================================

UPDATE models
SET release_date = COALESCE(release_date, '2026-04-01'),
    updated_at = CURRENT_TIMESTAMP
WHERE slug IN (
  'qwen-3.6-plus',
  'qwen-3.5-plus',
  'kimi-k2.5',
  'glm-5.1',
  'minimax-m2.7'
);
