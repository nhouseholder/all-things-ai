-- ============================================================
-- 0025_restore_gpt_and_gemini_models.sql
-- Restore GPT and Gemini families to the production dataset.
--
-- Why:
--   Production currently has most GPT/Gemini rows present but inactive.
--   Several "shell" rows (gpt-5.4, gpt-5.4-mini, gpt-5.4-nano,
--   gemini-3.1-pro, gemini-3-pro, gemini-3-flash) also lost the
--   benchmark / task / composite / availability data that powers the UI.
--
-- Goal:
--   1. Reactivate the intended GPT/Gemini models.
--   2. Rehydrate the derived tables the website reads.
--   3. Keep the migration replay-safe via upserts.
-- ============================================================

-- ============================================================
-- 1. REACTIVATE + NORMALIZE MODEL METADATA
-- ============================================================

UPDATE models
SET is_active = 1,
    updated_at = datetime('now')
WHERE slug IN (
  'gpt-4o',
  'gpt-5.3-codex',
  'gpt-5.4',
  'gpt-5.4-low',
  'gpt-5.4-high',
  'gpt-5.4-xhigh',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'gpt-o3',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-3.1-pro',
  'gemini-3-pro',
  'gemini-3-flash'
);

UPDATE models
SET name = 'GPT-4o',
    vendor = 'OpenAI',
    family = 'GPT',
    release_date = '2024-05-13',
    description = 'Previous-generation OpenAI multimodal flagship. Still useful for general coding and multimodal work.',
    input_price_per_mtok = 2.50,
    output_price_per_mtok = 10.00,
    cache_hit_price_per_mtok = NULL,
    context_window = 128000,
    updated_at = datetime('now')
WHERE slug = 'gpt-4o';

UPDATE models
SET name = 'GPT-5.3 Codex',
    vendor = 'OpenAI',
    family = 'Codex',
    release_date = '2026-02-05',
    description = 'OpenAI coding-specialized model. Strong agentic coding and codebase work.',
    input_price_per_mtok = 1.75,
    output_price_per_mtok = 14.00,
    cache_hit_price_per_mtok = NULL,
    context_window = 400000,
    updated_at = datetime('now')
WHERE slug = 'gpt-5.3-codex';

UPDATE models
SET name = 'GPT-5.4 (Medium Thinking)',
    vendor = 'OpenAI',
    family = 'GPT',
    release_date = '2026-03-05',
    description = 'GPT-5.4 with balanced reasoning. Recommended default for most tasks. 1.1M context.',
    input_price_per_mtok = 2.50,
    output_price_per_mtok = 15.00,
    cache_hit_price_per_mtok = 0.25,
    context_window = 1100000,
    updated_at = datetime('now')
WHERE slug = 'gpt-5.4';

UPDATE models
SET name = 'GPT-5.4 (Low Thinking)',
    vendor = 'OpenAI',
    family = 'GPT',
    release_date = '2026-03-05',
    description = 'GPT-5.4 with minimal reasoning. Fastest responses and lower effective cost.',
    input_price_per_mtok = 2.50,
    output_price_per_mtok = 15.00,
    cache_hit_price_per_mtok = 0.25,
    context_window = 1100000,
    updated_at = datetime('now')
WHERE slug = 'gpt-5.4-low';

UPDATE models
SET name = 'GPT-5.4 (High Thinking)',
    vendor = 'OpenAI',
    family = 'GPT',
    release_date = '2026-03-05',
    description = 'GPT-5.4 with deeper reasoning. Better for debugging, review, and multi-step coding.',
    input_price_per_mtok = 2.50,
    output_price_per_mtok = 15.00,
    cache_hit_price_per_mtok = 0.25,
    context_window = 1100000,
    updated_at = datetime('now')
WHERE slug = 'gpt-5.4-high';

UPDATE models
SET name = 'GPT-5.4 (XHigh Thinking)',
    vendor = 'OpenAI',
    family = 'GPT',
    release_date = '2026-03-05',
    description = 'GPT-5.4 with maximum reasoning depth. Best for the hardest coding and algorithmic work.',
    input_price_per_mtok = 2.50,
    output_price_per_mtok = 15.00,
    cache_hit_price_per_mtok = 0.25,
    context_window = 1100000,
    updated_at = datetime('now')
WHERE slug = 'gpt-5.4-xhigh';

UPDATE models
SET name = 'GPT-5.4 Mini',
    vendor = 'OpenAI',
    family = 'GPT',
    release_date = '2026-03-17',
    description = 'Smaller, faster GPT-5.4 variant. Good for routine coding and fast iteration.',
    input_price_per_mtok = 0.75,
    output_price_per_mtok = 4.50,
    cache_hit_price_per_mtok = 0.075,
    context_window = 400000,
    updated_at = datetime('now')
WHERE slug = 'gpt-5.4-mini';

UPDATE models
SET name = 'GPT-5.4 Nano',
    vendor = 'OpenAI',
    family = 'GPT',
    release_date = '2026-03-17',
    description = 'Smallest GPT-5.4 variant. Ultra-low cost, best for simple tasks and scaffolding.',
    input_price_per_mtok = 0.20,
    output_price_per_mtok = 1.25,
    cache_hit_price_per_mtok = 0.02,
    context_window = 400000,
    updated_at = datetime('now')
WHERE slug = 'gpt-5.4-nano';

UPDATE models
SET name = 'Gemini 2.5 Pro',
    vendor = 'Google',
    family = 'Gemini',
    release_date = '2025-03-25',
    description = 'Previous-generation Google flagship with strong reasoning and a 1M context window.',
    input_price_per_mtok = 1.25,
    output_price_per_mtok = 10.00,
    context_window = 1000000,
    updated_at = datetime('now')
WHERE slug = 'gemini-2.5-pro';

UPDATE models
SET name = 'Gemini 2.5 Flash',
    vendor = 'Google',
    family = 'Gemini',
    release_date = '2025-04-17',
    description = 'Fast Google model optimized for speed and cost.',
    input_price_per_mtok = 0.30,
    output_price_per_mtok = 2.50,
    context_window = 1000000,
    updated_at = datetime('now')
WHERE slug = 'gemini-2.5-flash';

UPDATE models
SET name = 'Gemini 3.1 Pro',
    vendor = 'Google',
    family = 'Gemini',
    release_date = '2026-02-01',
    description = 'Google flagship Gemini 3.1 model with top-tier reasoning, coding, and long-context performance.',
    input_price_per_mtok = 2.00,
    output_price_per_mtok = 12.00,
    context_window = 1000000,
    updated_at = datetime('now')
WHERE slug = 'gemini-3.1-pro';

UPDATE models
SET name = 'Gemini 3 Pro',
    vendor = 'Google',
    family = 'Gemini',
    release_date = '2025-12-01',
    description = 'Google flagship Gemini 3 model with strong coding and multimodal capabilities.',
    input_price_per_mtok = 2.00,
    output_price_per_mtok = 12.00,
    context_window = 1000000,
    updated_at = datetime('now')
WHERE slug = 'gemini-3-pro';

UPDATE models
SET name = 'Gemini 3 Flash',
    vendor = 'Google',
    family = 'Gemini',
    release_date = '2025-12-17',
    description = 'Fast Gemini 3 variant optimized for speed and cost.',
    input_price_per_mtok = 0.50,
    output_price_per_mtok = 3.00,
    context_window = 1000000,
    updated_at = datetime('now')
WHERE slug = 'gemini-3-flash';

-- ============================================================
-- 2. BENCHMARKS
-- ============================================================

INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score)
VALUES
((SELECT id FROM models WHERE slug = 'gpt-4o'), 'SWE-bench Verified', 'coding', 38.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-4o'), 'HumanEval', 'coding', 90.2, 100),
((SELECT id FROM models WHERE slug = 'gpt-4o'), 'GPQA Diamond', 'reasoning', 53.6, 100),
((SELECT id FROM models WHERE slug = 'gpt-4o'), 'MMLU Pro', 'reasoning', 74.5, 100),

((SELECT id FROM models WHERE slug = 'gpt-5.3-codex'), 'SWE-bench Verified', 'coding', 80.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.3-codex'), 'LiveCodeBench', 'coding', 84.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.3-codex'), 'GPQA Diamond', 'reasoning', 91.5, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.3-codex'), 'Chatbot Arena ELO', 'nuance', 1464, 2000),
((SELECT id FROM models WHERE slug = 'gpt-5.3-codex'), 'Human Nuance Understanding', 'nuance', 82, 100),

((SELECT id FROM models WHERE slug = 'gpt-5.4'), 'SWE-bench Verified', 'coding', 77.2, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4'), 'LiveCodeBench', 'coding', 82.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4'), 'GPQA Diamond', 'reasoning', 92.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4'), 'MMLU Pro', 'reasoning', 88.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4'), 'Chatbot Arena ELO', 'nuance', 1463, 2000),
((SELECT id FROM models WHERE slug = 'gpt-5.4'), 'TAU-bench Retail', 'agentic', 80.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4'), 'Human Nuance Understanding', 'nuance', 92, 100),

((SELECT id FROM models WHERE slug = 'gpt-5.4-low'), 'SWE-bench Verified', 'coding', 68.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-low'), 'LiveCodeBench', 'coding', 72.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-low'), 'GPQA Diamond', 'reasoning', 78.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-low'), 'Chatbot Arena ELO', 'nuance', 1440, 2000),
((SELECT id FROM models WHERE slug = 'gpt-5.4-low'), 'TAU-bench Retail', 'agentic', 72.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-low'), 'Human Nuance Understanding', 'nuance', 80, 100),

((SELECT id FROM models WHERE slug = 'gpt-5.4-high'), 'SWE-bench Verified', 'coding', 80.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-high'), 'LiveCodeBench', 'coding', 85.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-high'), 'GPQA Diamond', 'reasoning', 92.5, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-high'), 'Chatbot Arena ELO', 'nuance', 1485, 2000),
((SELECT id FROM models WHERE slug = 'gpt-5.4-high'), 'TAU-bench Retail', 'agentic', 82.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-high'), 'Human Nuance Understanding', 'nuance', 93, 100),

((SELECT id FROM models WHERE slug = 'gpt-5.4-xhigh'), 'SWE-bench Verified', 'coding', 82.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-xhigh'), 'LiveCodeBench', 'coding', 86.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-xhigh'), 'GPQA Diamond', 'reasoning', 92.8, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-xhigh'), 'Chatbot Arena ELO', 'nuance', 1485, 2000),
((SELECT id FROM models WHERE slug = 'gpt-5.4-xhigh'), 'TAU-bench Retail', 'agentic', 84.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-xhigh'), 'Human Nuance Understanding', 'nuance', 94, 100),

((SELECT id FROM models WHERE slug = 'gpt-5.4-mini'), 'SWE-bench Verified', 'coding', 48.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-mini'), 'LiveCodeBench', 'coding', 55.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-mini'), 'GPQA Diamond', 'reasoning', 65.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-mini'), 'Chatbot Arena ELO', 'nuance', 1390, 2000),
((SELECT id FROM models WHERE slug = 'gpt-5.4-mini'), 'Human Nuance Understanding', 'nuance', 68, 100),

((SELECT id FROM models WHERE slug = 'gpt-5.4-nano'), 'SWE-bench Verified', 'coding', 33.5, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-nano'), 'GPQA Diamond', 'reasoning', 48.0, 100),
((SELECT id FROM models WHERE slug = 'gpt-5.4-nano'), 'Chatbot Arena ELO', 'nuance', 1337, 2000),
((SELECT id FROM models WHERE slug = 'gpt-5.4-nano'), 'Human Nuance Understanding', 'nuance', 52, 100),

((SELECT id FROM models WHERE slug = 'gemini-3.1-pro'), 'SWE-bench Verified', 'coding', 80.6, 100),
((SELECT id FROM models WHERE slug = 'gemini-3.1-pro'), 'LiveCodeBench', 'coding', 88.0, 100),
((SELECT id FROM models WHERE slug = 'gemini-3.1-pro'), 'GPQA Diamond', 'reasoning', 94.1, 100),
((SELECT id FROM models WHERE slug = 'gemini-3.1-pro'), 'Chatbot Arena ELO', 'nuance', 1493, 2000),
((SELECT id FROM models WHERE slug = 'gemini-3.1-pro'), 'TAU-bench Retail', 'agentic', 81.0, 100),
((SELECT id FROM models WHERE slug = 'gemini-3.1-pro'), 'Human Nuance Understanding', 'nuance', 76, 100),

((SELECT id FROM models WHERE slug = 'gemini-3-pro'), 'SWE-bench Verified', 'coding', 75.0, 100),
((SELECT id FROM models WHERE slug = 'gemini-3-pro'), 'LiveCodeBench', 'coding', 91.7, 100),
((SELECT id FROM models WHERE slug = 'gemini-3-pro'), 'GPQA Diamond', 'reasoning', 91.9, 100),
((SELECT id FROM models WHERE slug = 'gemini-3-pro'), 'MMLU Pro', 'reasoning', 90.1, 100),
((SELECT id FROM models WHERE slug = 'gemini-3-pro'), 'Chatbot Arena ELO', 'nuance', 1486, 2000),
((SELECT id FROM models WHERE slug = 'gemini-3-pro'), 'TAU-bench Retail', 'agentic', 78.0, 100),

((SELECT id FROM models WHERE slug = 'gemini-3-flash'), 'SWE-bench Verified', 'coding', 76.2, 100),
((SELECT id FROM models WHERE slug = 'gemini-3-flash'), 'LiveCodeBench', 'coding', 90.8, 100),
((SELECT id FROM models WHERE slug = 'gemini-3-flash'), 'GPQA Diamond', 'reasoning', 80.5, 100),
((SELECT id FROM models WHERE slug = 'gemini-3-flash'), 'Chatbot Arena ELO', 'nuance', 1475, 2000),
((SELECT id FROM models WHERE slug = 'gemini-3-flash'), 'TAU-bench Retail', 'agentic', 74.0, 100),
((SELECT id FROM models WHERE slug = 'gemini-3-flash'), 'Human Nuance Understanding', 'nuance', 70, 100)
ON CONFLICT(model_id, benchmark_name) DO UPDATE SET
  category = excluded.category,
  score = excluded.score,
  max_score = excluded.max_score,
  measured_at = datetime('now');

-- ============================================================
-- 3. TASK ESTIMATES
-- ============================================================

INSERT INTO model_task_estimates (
  model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
  avg_minutes_to_complete, steering_effort, autonomy_score,
  cost_per_task_estimate, time_value_per_task, data_source
)
VALUES
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.77, 1.8, 10.0, 'low', 82, 0.2295, 12.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.83, 1.6, 8.5, 'low', 82, 0.24, 10.62, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.73, 2.0, 12.0, 'low', 82, 0.46, 15.0, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.89, 1.3, 6.0, 'low', 82, 0.1268, 7.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 4.0, 'low', 82, 0.1625, 5.0, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 2.5, 'low', 82, 0.03, 3.12, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 3.0, 'low', 82, 0.055, 3.75, 'benchmark'),

((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.65, 2.2, 11.0, 'medium', 65, 0.17, 13.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.72, 2.0, 9.0, 'medium', 65, 0.12, 11.25, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 2.8, 'low', 82, 0.081, 3.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 1.8, 'low', 85, 0.015, 2.25, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.50, 3.5, 18.0, 'high', 50, 0.23, 22.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.70, 1.8, 7.0, 'medium', 65, 0.063, 8.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.90, 1.0, 2.5, 'low', 80, 0.028, 3.12, 'estimated'),

((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.82, 1.3, 9.5, 'low', 86, 0.38, 11.88, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.88, 1.2, 7.8, 'low', 86, 0.40, 9.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 4.5, 'low', 86, 0.41, 5.62, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 3.0, 'low', 86, 0.075, 3.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.78, 1.5, 11.0, 'low', 86, 0.77, 13.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.93, 1.0, 5.5, 'low', 86, 0.21, 6.88, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 3.2, 'low', 86, 0.092, 4.0, 'estimated'),

((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.85, 1.2, 12.0, 'low', 88, 0.60, 15.0, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.90, 1.1, 10.0, 'low', 88, 0.63, 12.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 5.5, 'low', 88, 0.65, 6.88, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 4.0, 'low', 88, 0.12, 5.0, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.80, 1.3, 14.0, 'low', 88, 1.22, 17.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.95, 1.0, 7.0, 'low', 88, 0.33, 8.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 4.0, 'low', 88, 0.145, 5.0, 'estimated'),

((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.75, 1.5, 10.5, 'low', 80, 0.166, 13.12, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.80, 1.3, 8.8, 'low', 80, 0.175, 11.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.94, 1.0, 3.8, 'low', 80, 0.149, 4.75, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.96, 1.0, 2.5, 'low', 80, 0.026, 3.12, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.72, 1.7, 13.0, 'low', 80, 0.358, 16.25, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.88, 1.2, 6.5, 'low', 80, 0.118, 8.12, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.92, 1.0, 3.2, 'low', 80, 0.048, 4.0, 'community'),

((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.50, 3.5, 20.0, 'high', 50, 0.1339, 25.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.54, 3.1, 17.0, 'high', 50, 0.1395, 21.25, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.47, 3.9, 24.0, 'high', 50, 0.2691, 30.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.57, 2.4, 12.0, 'high', 50, 0.0702, 15.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.62, 1.8, 8.0, 'high', 50, 0.0877, 10.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.68, 1.1, 5.0, 'high', 50, 0.0099, 6.25, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.65, 1.4, 6.0, 'high', 50, 0.0231, 7.5, 'community'),

((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.25, 6.0, 35.0, 'high', 20, 0.063, 43.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.27, 5.4, 29.8, 'high', 20, 0.067, 37.25, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.24, 6.6, 42.0, 'high', 20, 0.1254, 52.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.29, 4.2, 21.0, 'high', 20, 0.0336, 26.25, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.31, 3.0, 14.0, 'high', 20, 0.0405, 17.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.34, 1.8, 8.8, 'high', 20, 0.0045, 11.0, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.33, 2.4, 10.5, 'high', 20, 0.0109, 13.12, 'estimated'),

((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.80, 1.5, 9.0, 'low', 80, 0.153, 11.25, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.86, 1.4, 7.6, 'low', 80, 0.168, 9.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.76, 1.7, 10.8, 'low', 80, 0.3128, 13.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.92, 1.0, 5.4, 'low', 80, 0.078, 6.75, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.98, 1.0, 3.6, 'low', 80, 0.13, 4.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 2.2, 'low', 80, 0.024, 2.75, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 2.7, 'low', 80, 0.044, 3.38, 'benchmark'),

((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.70, 2.2, 13.0, 'medium', 72, 0.2244, 16.25, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.76, 2.0, 11.0, 'medium', 72, 0.24, 13.75, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.66, 2.4, 15.6, 'medium', 72, 0.4416, 19.5, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.80, 1.5, 7.8, 'medium', 72, 0.117, 9.75, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.88, 1.1, 5.2, 'medium', 72, 0.143, 6.5, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.94, 1.0, 3.2, 'medium', 72, 0.024, 4.0, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.91, 1.0, 3.9, 'medium', 72, 0.044, 4.88, 'community'),

((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.55, 3.0, 18.0, 'high', 55, 0.0765, 22.5, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.59, 2.7, 15.3, 'high', 55, 0.081, 19.12, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.52, 3.3, 21.6, 'high', 55, 0.1518, 27.0, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.63, 2.1, 10.8, 'high', 55, 0.041, 13.5, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.69, 1.5, 7.2, 'high', 55, 0.0488, 9.0, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.74, 1.0, 4.5, 'high', 55, 0.006, 5.62, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.72, 1.2, 5.4, 'high', 55, 0.0132, 6.75, 'community')
ON CONFLICT(model_id, task_profile_id) DO UPDATE SET
  first_attempt_success_rate = excluded.first_attempt_success_rate,
  avg_messages_to_complete = excluded.avg_messages_to_complete,
  avg_minutes_to_complete = excluded.avg_minutes_to_complete,
  steering_effort = excluded.steering_effort,
  autonomy_score = excluded.autonomy_score,
  cost_per_task_estimate = excluded.cost_per_task_estimate,
  time_value_per_task = excluded.time_value_per_task,
  data_source = excluded.data_source,
  updated_at = datetime('now');

-- ============================================================
-- 4. COMMUNITY REVIEWS
-- ============================================================

INSERT INTO community_reviews (
  model_id, source, sentiment_score, coding_satisfaction,
  common_complaints, common_praises, review_count, sample_quotes
)
VALUES
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'reddit-chatgpt', 0.78, 82, '["limited to coding tasks","no general chat"]', '["excellent autonomous coding","great in Codex CLI","GitHub Copilot LTS"]', 780, NULL),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'hackernews', 0.78, 82, '["limited to coding tasks","no general chat"]', '["excellent autonomous coding","great in Codex CLI"]', 520, NULL),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'twitter', 0.78, 82, '["limited to coding tasks","no general chat"]', '["excellent autonomous coding","great in Codex CLI","GitHub Copilot LTS"]', 1200, NULL),

((SELECT id FROM models WHERE slug='gpt-5.4'), 'reddit-claudeai', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 420, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'reddit-locallama', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 310, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'reddit-chatgpt', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 2200, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'hackernews', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 950, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'twitter', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 3100, NULL),

((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'reddit-chatgpt', 0.82, 87, '["expensive at high thinking","slow for simple tasks"]', '["excellent reasoning","strong multi-step coding","reliable"]', 850, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'reddit-claudeai', 0.82, 87, '["expensive at high thinking","slow for simple tasks"]', '["excellent reasoning","strong multi-step coding","reliable"]', 120, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'hackernews', 0.82, 87, '["expensive at high thinking","slow for simple tasks"]', '["excellent reasoning","strong multi-step coding","reliable"]', 380, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'twitter', 0.82, 87, '["expensive at high thinking","slow for simple tasks"]', '["excellent reasoning","strong multi-step coding","reliable"]', 650, NULL),

((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'reddit-chatgpt', 0.83, 88, '["very expensive","overkill for most tasks","slow"]', '["best GPT reasoning","handles hardest problems","near-perfect on complex code"]', 420, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'reddit-claudeai', 0.83, 88, '["very expensive","overkill for most tasks","slow"]', '["best GPT reasoning","handles hardest problems","near-perfect on complex code"]', 80, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'hackernews', 0.83, 88, '["very expensive","overkill for most tasks","slow"]', '["best GPT reasoning","handles hardest problems","near-perfect on complex code"]', 290, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'twitter', 0.83, 88, '["very expensive","overkill for most tasks","slow"]', '["best GPT reasoning","handles hardest problems","near-perfect on complex code"]', 410, NULL),

((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'reddit-claudeai', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 150, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'reddit-locallama', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 220, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'reddit-chatgpt', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 1800, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'hackernews', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 430, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'twitter', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 2200, NULL),

((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'reddit-claudeai', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 280, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'reddit-locallama', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 190, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'reddit-chatgpt', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 410, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'hackernews', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 650, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'twitter', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 1400, NULL),

((SELECT id FROM models WHERE slug='gemini-3-flash'), 'reddit-claudeai', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 120, NULL),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'reddit-locallama', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 340, NULL),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'reddit-chatgpt', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 280, NULL),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'hackernews', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 510, NULL),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'twitter', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 960, NULL)
ON CONFLICT(model_id, source) DO UPDATE SET
  sentiment_score = excluded.sentiment_score,
  coding_satisfaction = excluded.coding_satisfaction,
  common_complaints = excluded.common_complaints,
  common_praises = excluded.common_praises,
  review_count = excluded.review_count,
  sample_quotes = excluded.sample_quotes;

-- ============================================================
-- 5. COMPOSITE SCORES
-- ============================================================

INSERT INTO model_composite_scores (
  model_id, composite_score, swe_bench_component, livecodebench_component,
  nuance_component, arena_component, tau_component, gpqa_component,
  success_rate_component, community_adjustment, updated_at
)
VALUES
((SELECT id FROM models WHERE slug='gpt-4o'), 42.46, 27.14, 0, 0, 0, 0, 15.32, 0, 0, datetime('now')),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 79.30, 20.0, 0, 16.4, 0, 0, 9.15, 15.75, 18.0, datetime('now')),
((SELECT id FROM models WHERE slug='gpt-5.4'), 84.72, 19.3, 12.3, 18.4, 7.0, 8.0, 9.2, 8.77, 1.75, datetime('now')),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), 72.10, 17.0, 10.8, 16.0, 6.0, 0, 7.8, 13.5, 1.0, datetime('now')),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 86.25, 20.0, 12.75, 18.6, 7.25, 0, 9.25, 17.4, 1.0, datetime('now')),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 87.80, 20.5, 12.9, 18.8, 7.38, 0, 9.28, 17.94, 1.0, datetime('now')),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 70.34, 0, 0, 50.0, 0, 0, 0, 19.24, 1.1, datetime('now')),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), 46.29, 0, 0, 36.67, 0, 0, 0, 9.62, 0, datetime('now')),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 86.35, 26.87, 0, 23.47, 10.0, 0, 12.55, 11.97, 1.5, datetime('now')),
((SELECT id FROM models WHERE slug='gemini-3-pro'), 80.88, 23.44, 17.19, 0, 8.91, 9.75, 11.49, 10.1, 0, datetime('now')),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 77.51, 27.21, 19.46, 20.57, 0, 0, 0, 9.07, 1.2, datetime('now'))
ON CONFLICT(model_id) DO UPDATE SET
  composite_score = excluded.composite_score,
  swe_bench_component = excluded.swe_bench_component,
  livecodebench_component = excluded.livecodebench_component,
  nuance_component = excluded.nuance_component,
  arena_component = excluded.arena_component,
  tau_component = excluded.tau_component,
  gpqa_component = excluded.gpqa_component,
  success_rate_component = excluded.success_rate_component,
  community_adjustment = excluded.community_adjustment,
  updated_at = datetime('now');

-- ============================================================
-- 6. MODEL AVAILABILITY
-- ============================================================

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'cursor'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Pro' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4', 'gpt-5.4-mini', 'gemini-3-pro', 'gemini-3-flash');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'cursor'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Pro+' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4', 'gpt-5.4-high', 'gpt-5.4-mini', 'gemini-3.1-pro', 'gemini-3-pro');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'cursor'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Ultra' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4', 'gpt-5.4-high', 'gpt-5.4-xhigh', 'gpt-5.4-mini', 'gemini-3.1-pro', 'gemini-3-pro');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'windsurf'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Free' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4-mini', 'gemini-3-flash');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'windsurf'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Pro' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4', 'gpt-5.4-mini', 'gemini-3-flash');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'windsurf'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Teams' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4', 'gpt-5.4-mini', 'gemini-3-flash');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'full'
FROM models m
JOIN tools t ON t.slug = 'github-copilot'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Free' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4-mini');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'full'
FROM models m
JOIN tools t ON t.slug = 'github-copilot'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Pro' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.3-codex', 'gpt-5.4-mini');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'full'
FROM models m
JOIN tools t ON t.slug = 'github-copilot'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Business' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.3-codex', 'gpt-5.4-mini');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'full'
FROM models m
JOIN tools t ON t.slug = 'github-copilot'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Pro+' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.3-codex', 'gpt-5.4', 'gpt-5.4-high', 'gemini-3.1-pro');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'full'
FROM models m
JOIN tools t ON t.slug = 'github-copilot'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Enterprise' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.3-codex', 'gpt-5.4', 'gemini-3.1-pro');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'full'
FROM models m
JOIN tools t ON t.slug = 'codex'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Plus' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.3-codex', 'gpt-5.4');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'full'
FROM models m
JOIN tools t ON t.slug = 'codex'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Pro' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.3-codex', 'gpt-5.4', 'gpt-5.4-high', 'gpt-5.4-xhigh');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'augment-code'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Community' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4-mini');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'augment-code'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Indie' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4', 'gpt-5.4-mini', 'gemini-3-pro');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level)
SELECT m.id, t.id, p.id, 'credits'
FROM models m
JOIN tools t ON t.slug = 'augment-code'
JOIN pricing_plans p ON p.tool_id = t.id AND p.plan_name = 'Developer' AND p.is_current = 1
WHERE m.slug IN ('gpt-5.4', 'gpt-5.4-high', 'gemini-3.1-pro');
