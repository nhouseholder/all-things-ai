-- ============================================================
-- 0005_free_budget_models.sql — Add free & budget models (DeepSeek, Z AI, Llama, Mistral, Qwen)
-- Generated: 2026-03-23
-- ============================================================

-- ============================================================
-- 1. FREE & OPEN-SOURCE MODELS
-- ============================================================

-- DeepSeek family
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('DeepSeek V3', 'deepseek-v3', 'DeepSeek', 'DeepSeek', '2025-12-25', 'Open-source MoE model. 671B total, 37B active params. Extremely competitive coding performance at a fraction of the cost. Free on DeepSeek API (rate limited).', 1, 0.27, 1.10, 0.07, 128000, 1),
('DeepSeek R1', 'deepseek-r1', 'DeepSeek', 'DeepSeek', '2026-01-20', 'Open-source reasoning model. Chain-of-thought reasoning rivaling o3. Free on DeepSeek API (rate limited).', 1, 0.55, 2.19, 0.14, 128000, 1),
('DeepSeek Coder V3', 'deepseek-coder-v3', 'DeepSeek', 'DeepSeek', '2026-02-15', 'Coding-specialized variant. Excellent for boilerplate and feature implementation at ultra-low cost.', 1, 0.27, 1.10, 0.07, 128000, 1);

-- Z AI (GLM-5)
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window) VALUES
('Z AI GLM-5', 'z-ai-glm-5', 'Zhipu AI', 'GLM', '2026-02-01', 'Free-tier model from Zhipu AI. Solid general-purpose performance. Free API access with generous rate limits.', 1, 0.00, 0.00, NULL, 128000),
('Z AI GLM-5 Plus', 'z-ai-glm-5-plus', 'Zhipu AI', 'GLM', '2026-02-15', 'Enhanced GLM-5 with better reasoning. Very low cost API pricing.', 1, 0.10, 0.40, NULL, 128000);

-- Meta Llama (open-weight, free via many providers)
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Llama 4 Maverick', 'llama-4-maverick', 'Meta', 'Llama', '2026-03-01', 'Meta flagship open model. 400B MoE, 17B active. Free via Groq, Together, Fireworks. Strong coding and reasoning.', 1, 0.20, 0.60, NULL, 1000000, 1),
('Llama 4 Scout', 'llama-4-scout', 'Meta', 'Llama', '2026-03-01', 'Lightweight Llama variant. 109B params, 17B active. Ultra-fast inference. Great for quick tasks.', 1, 0.10, 0.30, NULL, 10000000, 1);

-- Mistral
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Mistral Large 2', 'mistral-large-2', 'Mistral AI', 'Mistral', '2025-11-20', 'Top Mistral model. Strong coding, 128K context. Competitive with GPT-4o class models at lower cost.', 1, 2.00, 6.00, NULL, 128000, 0),
('Codestral', 'codestral', 'Mistral AI', 'Mistral', '2025-12-01', 'Coding-specialized Mistral model. Fast, accurate code generation. Free for individual use.', 1, 0.30, 0.90, NULL, 256000, 1);

-- Qwen (Alibaba)
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Qwen 3 235B', 'qwen-3-235b', 'Alibaba', 'Qwen', '2026-01-15', 'Alibaba flagship. 235B MoE model with strong multilingual and coding capabilities. Free on Alibaba Cloud trial.', 1, 0.30, 1.20, NULL, 128000, 1);

-- Google Gemma (free, open-weight)
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Gemma 3 27B', 'gemma-3-27b', 'Google', 'Gemma', '2026-01-20', 'Google open-weight model. Runs locally on consumer GPUs. Free. Great for offline/private coding.', 1, 0.00, 0.00, NULL, 128000, 1);

-- ============================================================
-- 2. BENCHMARKS FOR NEW MODELS
-- ============================================================

-- DeepSeek V3
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='deepseek-v3'), 'SWE-bench Verified', 'coding', 70.0, 100),
((SELECT id FROM models WHERE slug='deepseek-v3'), 'GPQA Diamond', 'reasoning', 81.0, 100),
((SELECT id FROM models WHERE slug='deepseek-v3'), 'LiveCodeBench', 'coding', 75.0, 100),
((SELECT id FROM models WHERE slug='deepseek-v3'), 'Chatbot Arena ELO', 'nuance', 1410, 2000),
((SELECT id FROM models WHERE slug='deepseek-v3'), 'Human Nuance Understanding', 'nuance', 74, 100);

-- DeepSeek R1
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='deepseek-r1'), 'SWE-bench Verified', 'coding', 71.7, 100),
((SELECT id FROM models WHERE slug='deepseek-r1'), 'GPQA Diamond', 'reasoning', 87.5, 100),
((SELECT id FROM models WHERE slug='deepseek-r1'), 'LiveCodeBench', 'coding', 79.0, 100),
((SELECT id FROM models WHERE slug='deepseek-r1'), 'Chatbot Arena ELO', 'nuance', 1430, 2000),
((SELECT id FROM models WHERE slug='deepseek-r1'), 'Human Nuance Understanding', 'nuance', 72, 100);

-- DeepSeek Coder V3
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='deepseek-coder-v3'), 'SWE-bench Verified', 'coding', 68.0, 100),
((SELECT id FROM models WHERE slug='deepseek-coder-v3'), 'LiveCodeBench', 'coding', 76.0, 100),
((SELECT id FROM models WHERE slug='deepseek-coder-v3'), 'Human Nuance Understanding', 'nuance', 68, 100);

-- Z AI GLM-5
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='z-ai-glm-5'), 'SWE-bench Verified', 'coding', 55.0, 100),
((SELECT id FROM models WHERE slug='z-ai-glm-5'), 'GPQA Diamond', 'reasoning', 65.0, 100),
((SELECT id FROM models WHERE slug='z-ai-glm-5'), 'LiveCodeBench', 'coding', 58.0, 100),
((SELECT id FROM models WHERE slug='z-ai-glm-5'), 'Human Nuance Understanding', 'nuance', 60, 100);

-- Z AI GLM-5 Plus
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='z-ai-glm-5-plus'), 'SWE-bench Verified', 'coding', 62.0, 100),
((SELECT id FROM models WHERE slug='z-ai-glm-5-plus'), 'GPQA Diamond', 'reasoning', 72.0, 100),
((SELECT id FROM models WHERE slug='z-ai-glm-5-plus'), 'LiveCodeBench', 'coding', 65.0, 100),
((SELECT id FROM models WHERE slug='z-ai-glm-5-plus'), 'Human Nuance Understanding', 'nuance', 66, 100);

-- Llama 4 Maverick
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='llama-4-maverick'), 'SWE-bench Verified', 'coding', 67.0, 100),
((SELECT id FROM models WHERE slug='llama-4-maverick'), 'GPQA Diamond', 'reasoning', 78.0, 100),
((SELECT id FROM models WHERE slug='llama-4-maverick'), 'LiveCodeBench', 'coding', 72.0, 100),
((SELECT id FROM models WHERE slug='llama-4-maverick'), 'Chatbot Arena ELO', 'nuance', 1400, 2000),
((SELECT id FROM models WHERE slug='llama-4-maverick'), 'Human Nuance Understanding', 'nuance', 71, 100);

-- Llama 4 Scout
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='llama-4-scout'), 'SWE-bench Verified', 'coding', 58.0, 100),
((SELECT id FROM models WHERE slug='llama-4-scout'), 'LiveCodeBench', 'coding', 62.0, 100),
((SELECT id FROM models WHERE slug='llama-4-scout'), 'Human Nuance Understanding', 'nuance', 64, 100);

-- Mistral Large 2
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='mistral-large-2'), 'SWE-bench Verified', 'coding', 62.0, 100),
((SELECT id FROM models WHERE slug='mistral-large-2'), 'GPQA Diamond', 'reasoning', 74.0, 100),
((SELECT id FROM models WHERE slug='mistral-large-2'), 'LiveCodeBench', 'coding', 68.0, 100),
((SELECT id FROM models WHERE slug='mistral-large-2'), 'Chatbot Arena ELO', 'nuance', 1380, 2000),
((SELECT id FROM models WHERE slug='mistral-large-2'), 'Human Nuance Understanding', 'nuance', 70, 100);

-- Codestral
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='codestral'), 'SWE-bench Verified', 'coding', 64.0, 100),
((SELECT id FROM models WHERE slug='codestral'), 'LiveCodeBench', 'coding', 71.0, 100),
((SELECT id FROM models WHERE slug='codestral'), 'Human Nuance Understanding', 'nuance', 65, 100);

-- Qwen 3 235B
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='qwen-3-235b'), 'SWE-bench Verified', 'coding', 65.0, 100),
((SELECT id FROM models WHERE slug='qwen-3-235b'), 'GPQA Diamond', 'reasoning', 76.0, 100),
((SELECT id FROM models WHERE slug='qwen-3-235b'), 'LiveCodeBench', 'coding', 70.0, 100),
((SELECT id FROM models WHERE slug='qwen-3-235b'), 'Human Nuance Understanding', 'nuance', 68, 100);

-- Gemma 3 27B
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='gemma-3-27b'), 'SWE-bench Verified', 'coding', 48.0, 100),
((SELECT id FROM models WHERE slug='gemma-3-27b'), 'LiveCodeBench', 'coding', 52.0, 100),
((SELECT id FROM models WHERE slug='gemma-3-27b'), 'Human Nuance Understanding', 'nuance', 58, 100);

-- ============================================================
-- 3. ADD COMPOSITE SCORES FOR NEW MODELS
-- ============================================================
-- These follow the weighted formula: SWE 25%, LiveCodeBench 15%, Nuance 20%, Arena 10%, GPQA 10%, TAU 10%, Success 10%
-- Approximations based on available benchmarks

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 70.0, 75.0, 74.0, 70.5, 65.0, 81.0, 72.0, 72.4 FROM models WHERE slug='deepseek-v3';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 71.7, 79.0, 72.0, 71.5, 68.0, 87.5, 74.0, 74.8 FROM models WHERE slug='deepseek-r1';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 68.0, 76.0, 68.0, 60.0, 60.0, 70.0, 70.0, 67.5 FROM models WHERE slug='deepseek-coder-v3';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 55.0, 58.0, 60.0, 55.0, 50.0, 65.0, 55.0, 56.9 FROM models WHERE slug='z-ai-glm-5';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 62.0, 65.0, 66.0, 60.0, 55.0, 72.0, 62.0, 63.5 FROM models WHERE slug='z-ai-glm-5-plus';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 67.0, 72.0, 71.0, 70.0, 62.0, 78.0, 68.0, 69.7 FROM models WHERE slug='llama-4-maverick';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 58.0, 62.0, 64.0, 55.0, 50.0, 60.0, 58.0, 58.5 FROM models WHERE slug='llama-4-scout';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 62.0, 68.0, 70.0, 69.0, 58.0, 74.0, 64.0, 66.3 FROM models WHERE slug='mistral-large-2';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 64.0, 71.0, 65.0, 55.0, 55.0, 65.0, 65.0, 63.5 FROM models WHERE slug='codestral';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 65.0, 70.0, 68.0, 60.0, 58.0, 76.0, 66.0, 66.5 FROM models WHERE slug='qwen-3-235b';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 48.0, 52.0, 58.0, 45.0, 40.0, 50.0, 48.0, 49.1 FROM models WHERE slug='gemma-3-27b';

-- ============================================================
-- 4. ADD TASK ESTIMATES FOR FREE/BUDGET MODELS
-- ============================================================

-- DeepSeek V3 task estimates (competitive quality, ultra-low cost)
INSERT OR IGNORE INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, cost_per_task_estimate, avg_minutes_to_complete, time_value_per_task, steering_effort, autonomy_score, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 0.58
    WHEN 'feature-implementation' THEN 0.65
    WHEN 'boilerplate-scaffolding' THEN 0.78
    WHEN 'quick-fixes' THEN 0.80
    WHEN 'multi-file-refactor' THEN 0.55
    WHEN 'code-review' THEN 0.62
    WHEN 'learning-exploring' THEN 0.70
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 12
    WHEN 'feature-implementation' THEN 8
    WHEN 'boilerplate-scaffolding' THEN 4
    WHEN 'quick-fixes' THEN 3
    WHEN 'multi-file-refactor' THEN 14
    WHEN 'code-review' THEN 5
    WHEN 'learning-exploring' THEN 4
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 0.08
    WHEN 'feature-implementation' THEN 0.06
    WHEN 'boilerplate-scaffolding' THEN 0.02
    WHEN 'quick-fixes' THEN 0.01
    WHEN 'multi-file-refactor' THEN 0.10
    WHEN 'code-review' THEN 0.03
    WHEN 'learning-exploring' THEN 0.02
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 25
    WHEN 'feature-implementation' THEN 18
    WHEN 'boilerplate-scaffolding' THEN 8
    WHEN 'quick-fixes' THEN 5
    WHEN 'multi-file-refactor' THEN 30
    WHEN 'code-review' THEN 10
    WHEN 'learning-exploring' THEN 8
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 2.08
    WHEN 'feature-implementation' THEN 1.50
    WHEN 'boilerplate-scaffolding' THEN 0.67
    WHEN 'quick-fixes' THEN 0.42
    WHEN 'multi-file-refactor' THEN 2.50
    WHEN 'code-review' THEN 0.83
    WHEN 'learning-exploring' THEN 0.67
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 'High'
    WHEN 'feature-implementation' THEN 'Medium'
    WHEN 'boilerplate-scaffolding' THEN 'Low'
    WHEN 'quick-fixes' THEN 'Low'
    WHEN 'multi-file-refactor' THEN 'High'
    WHEN 'code-review' THEN 'Medium'
    WHEN 'learning-exploring' THEN 'Low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 5
    WHEN 'feature-implementation' THEN 6
    WHEN 'boilerplate-scaffolding' THEN 8
    WHEN 'quick-fixes' THEN 8
    WHEN 'multi-file-refactor' THEN 4
    WHEN 'code-review' THEN 6
    WHEN 'learning-exploring' THEN 7
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'deepseek-v3';

-- DeepSeek R1 task estimates (strong reasoning, low cost)
INSERT OR IGNORE INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, cost_per_task_estimate, avg_minutes_to_complete, time_value_per_task, steering_effort, autonomy_score, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 0.65
    WHEN 'feature-implementation' THEN 0.68
    WHEN 'boilerplate-scaffolding' THEN 0.75
    WHEN 'quick-fixes' THEN 0.78
    WHEN 'multi-file-refactor' THEN 0.60
    WHEN 'code-review' THEN 0.70
    WHEN 'learning-exploring' THEN 0.72
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 10
    WHEN 'feature-implementation' THEN 7
    WHEN 'boilerplate-scaffolding' THEN 4
    WHEN 'quick-fixes' THEN 3
    WHEN 'multi-file-refactor' THEN 12
    WHEN 'code-review' THEN 5
    WHEN 'learning-exploring' THEN 4
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 0.15
    WHEN 'feature-implementation' THEN 0.12
    WHEN 'boilerplate-scaffolding' THEN 0.04
    WHEN 'quick-fixes' THEN 0.02
    WHEN 'multi-file-refactor' THEN 0.18
    WHEN 'code-review' THEN 0.06
    WHEN 'learning-exploring' THEN 0.04
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 22
    WHEN 'feature-implementation' THEN 16
    WHEN 'boilerplate-scaffolding' THEN 7
    WHEN 'quick-fixes' THEN 4
    WHEN 'multi-file-refactor' THEN 28
    WHEN 'code-review' THEN 9
    WHEN 'learning-exploring' THEN 7
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 1.83
    WHEN 'feature-implementation' THEN 1.33
    WHEN 'boilerplate-scaffolding' THEN 0.58
    WHEN 'quick-fixes' THEN 0.33
    WHEN 'multi-file-refactor' THEN 2.33
    WHEN 'code-review' THEN 0.75
    WHEN 'learning-exploring' THEN 0.58
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 'Medium'
    WHEN 'feature-implementation' THEN 'Medium'
    WHEN 'boilerplate-scaffolding' THEN 'Low'
    WHEN 'quick-fixes' THEN 'Low'
    WHEN 'multi-file-refactor' THEN 'High'
    WHEN 'code-review' THEN 'Medium'
    WHEN 'learning-exploring' THEN 'Low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 6
    WHEN 'feature-implementation' THEN 6
    WHEN 'boilerplate-scaffolding' THEN 8
    WHEN 'quick-fixes' THEN 8
    WHEN 'multi-file-refactor' THEN 5
    WHEN 'code-review' THEN 7
    WHEN 'learning-exploring' THEN 7
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'deepseek-r1';

-- Llama 4 Maverick task estimates
INSERT OR IGNORE INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, cost_per_task_estimate, avg_minutes_to_complete, time_value_per_task, steering_effort, autonomy_score, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 0.52
    WHEN 'feature-implementation' THEN 0.60
    WHEN 'boilerplate-scaffolding' THEN 0.75
    WHEN 'quick-fixes' THEN 0.78
    WHEN 'multi-file-refactor' THEN 0.48
    WHEN 'code-review' THEN 0.58
    WHEN 'learning-exploring' THEN 0.68
  END,
  6, 0.04, 15, 1.25, 'Medium', 6, 'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'llama-4-maverick';

-- Z AI GLM-5 (free tier)
INSERT OR IGNORE INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, cost_per_task_estimate, avg_minutes_to_complete, time_value_per_task, steering_effort, autonomy_score, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 0.35
    WHEN 'feature-implementation' THEN 0.42
    WHEN 'boilerplate-scaffolding' THEN 0.65
    WHEN 'quick-fixes' THEN 0.70
    WHEN 'multi-file-refactor' THEN 0.30
    WHEN 'code-review' THEN 0.45
    WHEN 'learning-exploring' THEN 0.60
  END,
  8, 0.00, 20, 1.67, 'High', 4, 'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'z-ai-glm-5';

-- Codestral (free for individuals)
INSERT OR IGNORE INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, cost_per_task_estimate, avg_minutes_to_complete, time_value_per_task, steering_effort, autonomy_score, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging' THEN 0.50
    WHEN 'feature-implementation' THEN 0.58
    WHEN 'boilerplate-scaffolding' THEN 0.75
    WHEN 'quick-fixes' THEN 0.78
    WHEN 'multi-file-refactor' THEN 0.45
    WHEN 'code-review' THEN 0.55
    WHEN 'learning-exploring' THEN 0.62
  END,
  6, 0.02, 14, 1.17, 'Medium', 6, 'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'codestral';

-- ============================================================
-- 5. ADD MODEL ALTERNATIVES MAPPING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS model_alternatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id INTEGER NOT NULL REFERENCES models(id),
  alternative_model_id INTEGER NOT NULL REFERENCES models(id),
  similarity_score REAL NOT NULL DEFAULT 0.0,
  cost_savings_pct REAL,
  trade_off_notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Alternatives for Claude Opus 4.6 (premium → cheaper alternatives)
INSERT OR IGNORE INTO model_alternatives (model_id, alternative_model_id, similarity_score, cost_savings_pct, trade_off_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 0.85, 80, 'Very close quality for most coding tasks. Slightly less nuanced on complex debugging.'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM models WHERE slug='deepseek-r1'), 0.72, 96, 'Strong reasoning at 1/25th the cost. Less polished output, more steering needed.'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM models WHERE slug='gpt-5.4'), 0.82, 70, 'Comparable quality. Different strengths — GPT stronger on breadth, Claude on depth.'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM models WHERE slug='llama-4-maverick'), 0.65, 98, 'Free open model. Good for boilerplate. Significant quality gap on complex tasks.');

-- Alternatives for Claude Sonnet 4.6
INSERT OR IGNORE INTO model_alternatives (model_id, alternative_model_id, similarity_score, cost_savings_pct, trade_off_notes) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM models WHERE slug='deepseek-v3'), 0.75, 95, 'Extremely cheap. Good for feature implementation and boilerplate. Needs more steering.'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM models WHERE slug='gpt-5.4-low'), 0.78, 50, 'Similar speed, decent quality. Lower reasoning depth.'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM models WHERE slug='codestral'), 0.70, 94, 'Free for personal use. Code-focused. Less general capability.');

-- Alternatives for GPT-5.4
INSERT OR IGNORE INTO model_alternatives (model_id, alternative_model_id, similarity_score, cost_savings_pct, trade_off_notes) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 0.80, 20, 'Slightly cheaper, similar capability. Better nuance, less breadth.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM models WHERE slug='deepseek-r1'), 0.74, 92, 'Strong reasoning model at fraction of cost. Open source.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM models WHERE slug='llama-4-maverick'), 0.68, 97, 'Free open model with large context. Good for many tasks.');

-- Alternatives for GPT-o3
INSERT OR IGNORE INTO model_alternatives (model_id, alternative_model_id, similarity_score, cost_savings_pct, trade_off_notes) VALUES
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM models WHERE slug='deepseek-r1'), 0.78, 95, 'Open-source reasoning model. Competitive chain-of-thought at fraction of cost.'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM models WHERE slug='claude-opus-4.6'), 0.82, 50, 'Different reasoning approach. Strong on coding tasks specifically.'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM models WHERE slug='gpt-5.4-high'), 0.80, 75, 'Same base model, less reasoning depth. Much cheaper per task.');

-- Alternatives for Gemini 3.1 Pro
INSERT OR IGNORE INTO model_alternatives (model_id, alternative_model_id, similarity_score, cost_savings_pct, trade_off_notes) VALUES
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM models WHERE slug='deepseek-v3'), 0.72, 90, 'Similar benchmark range. Cheaper. Less context window.'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM models WHERE slug='qwen-3-235b'), 0.70, 85, 'Open-source alternative. Strong multilingual. Similar coding performance.');
