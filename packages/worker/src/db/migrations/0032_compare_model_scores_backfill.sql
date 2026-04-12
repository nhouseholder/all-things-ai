-- ============================================================
-- 0032_compare_model_scores_backfill.sql
-- Backfill compare-page score components for active models that currently
-- render empty radar charts or blank score breakdowns.
-- ============================================================

INSERT OR IGNORE INTO model_composite_scores (
  model_id,
  composite_score,
  swe_bench_component,
  livecodebench_component,
  nuance_component,
  arena_component,
  tau_component,
  gpqa_component,
  success_rate_component,
  community_adjustment
) VALUES
((SELECT id FROM models WHERE slug='amazon-nova-lite'), 43.8, 38.0, 42.0, 52.0, 46.0, 38.0, 46.0, 44.0, 0.0),
((SELECT id FROM models WHERE slug='codex-mini'), 71.4, 72.0, 78.0, 68.0, 64.0, 66.0, 74.0, 76.0, 0.0),
((SELECT id FROM models WHERE slug='command-r7b'), 40.7, 32.0, 36.0, 50.0, 44.0, 32.0, 46.0, 40.0, 0.0),
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), 72.3, 68.0, 72.0, 74.0, 68.0, 70.0, 84.0, 72.0, 0.0),
((SELECT id FROM models WHERE slug='gemini-2.5-flash'), 61.8, 56.0, 60.0, 64.0, 60.0, 58.0, 74.0, 62.0, 0.0),
((SELECT id FROM models WHERE slug='grok-4.1-fast'), 74.5, 71.0, 74.0, 80.0, 70.0, 72.0, 83.0, 75.0, 0.0),
((SELECT id FROM models WHERE slug='jamba-2-mini'), 47.7, 42.0, 46.0, 56.0, 48.0, 42.0, 58.0, 46.0, 0.0),
((SELECT id FROM models WHERE slug='minimax-m2-1'), 69.7, 70.0, 68.0, 70.0, 66.0, 62.0, 78.0, 68.0, 0.0),
((SELECT id FROM models WHERE slug='minimax-m2-7'), 80.4, 82.0, 80.0, 82.0, 74.0, 74.0, 88.0, 80.0, 0.0),
((SELECT id FROM models WHERE slug='minimax-m2.7'), 80.4, 82.0, 80.0, 82.0, 74.0, 74.0, 88.0, 80.0, 0.0),
((SELECT id FROM models WHERE slug='mistral-medium-3'), 57.9, 54.0, 58.0, 64.0, 58.0, 52.0, 66.0, 56.0, 0.0),
((SELECT id FROM models WHERE slug='mistral-small-4'), 50.1, 46.0, 50.0, 56.0, 50.0, 44.0, 58.0, 50.0, 0.0),
((SELECT id FROM models WHERE slug='nous-hermes-3'), 51.8, 44.0, 48.0, 60.0, 54.0, 46.0, 56.0, 52.0, 0.0),
((SELECT id FROM models WHERE slug='phi-4-mini'), 37.8, 30.0, 36.0, 48.0, 42.0, 30.0, 40.0, 38.0, 0.0),
((SELECT id FROM models WHERE slug='qwen-3'), 63.9, 60.0, 65.0, 66.0, 63.0, 64.0, 71.0, 68.0, 0.0),
((SELECT id FROM models WHERE slug='qwen-3.5-plus'), 74.6, 74.0, 76.0, 76.0, 69.0, 70.0, 82.0, 76.0, 0.0),
((SELECT id FROM models WHERE slug='qwen3-5-plus'), 74.6, 74.0, 76.0, 76.0, 69.0, 70.0, 82.0, 76.0, 0.0),
((SELECT id FROM models WHERE slug='qwen3-max'), 79.4, 78.0, 80.0, 82.0, 71.0, 74.0, 86.0, 80.0, 0.0),
((SELECT id FROM models WHERE slug='reka-core'), 61.8, 58.0, 62.0, 70.0, 60.0, 54.0, 68.0, 60.0, 0.0),
((SELECT id FROM models WHERE slug='sonar'), 47.8, 36.0, 40.0, 62.0, 54.0, 40.0, 52.0, 48.0, 0.0),
((SELECT id FROM models WHERE slug='kimi-k2.5'), 74.99, 76.8, 74.0, 73.0, 63.25, 70.0, 82.0, 78.29, 0.72),
((SELECT id FROM models WHERE slug='glm-5.1'), 75.83, 75.5, 78.0, 82.0, 55.0, 72.0, 85.0, 74.0, 0.0);