-- ============================================================
-- 0033_qwen36_compare_catalog.sql
-- Add Qwen 3.6 Plus to the live catalog and wire compare coverage
-- so the compare page can render it immediately.
-- ============================================================

INSERT OR IGNORE INTO models (
  name,
  slug,
  vendor,
  family,
  version_string,
  release_date,
  description,
  is_active,
  input_price_per_mtok,
  output_price_per_mtok,
  context_window
) VALUES (
  'Qwen 3.6 Plus',
  'qwen-3.6-plus',
  'Alibaba / Qwen',
  'Qwen',
  '3.6-plus',
  '2026-04-01',
  'Qwen flagship coding model released on April 1, 2026 with 1M-token context and upgraded agentic coding capabilities.',
  1,
  0.5,
  3.0,
  1000000
);

UPDATE pricing_plans
SET
  models_included = '["qwen-3.6-plus","qwen-3.5-plus"]',
  features = REPLACE(features, 'Qwen 3.5 Plus', 'Qwen 3.6 Plus')
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'qwen-code')
  AND plan_name = 'Code Pro';

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, cost_notes) VALUES
((SELECT id FROM models WHERE slug = 'qwen-3.6-plus'), (SELECT id FROM tools WHERE slug = 'qwen-code'), (SELECT id FROM pricing_plans WHERE tool_id = (SELECT id FROM tools WHERE slug = 'qwen-code') AND plan_name = 'Code Pro'), 'full', 'Qwen Code now surfaces Qwen 3.6 Plus as the flagship coding model with 1M-token context and April 2026 pricing.');

INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES
('qwen-3.6-plus', 'qwen 3.6 plus'),
('qwen-3.6-plus', 'qwen3.6 plus'),
('qwen-3.6-plus', 'qwen3.6-plus'),
('qwen-3.6-plus', 'qwen 3 6 plus');

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
) VALUES (
  (SELECT id FROM models WHERE slug = 'qwen-3.6-plus'),
  79.4,
  78.0,
  80.0,
  82.0,
  71.0,
  74.0,
  86.0,
  80.0,
  0.0
);