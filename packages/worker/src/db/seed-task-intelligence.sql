-- ============================================================
-- seed-task-intelligence.sql — Task Intelligence Data
-- Generated: 2026-03-22
-- ============================================================

-- ============================================================
-- 1. CLEAN EXISTING DATA (FK-safe order)
-- ============================================================
DELETE FROM task_tool_recommendations;
DELETE FROM community_reviews;
DELETE FROM model_composite_scores;
DELETE FROM model_task_estimates;
DELETE FROM task_profiles;

-- ============================================================
-- 2. TASK PROFILES
-- ============================================================
INSERT INTO task_profiles (name, slug, description, avg_input_tokens, avg_output_tokens, complexity, sort_order) VALUES
('Complex Debugging', 'complex-debugging', 'Deep investigation of subtle bugs requiring full codebase understanding, multi-step reasoning, and nuanced problem solving', 15000, 6000, 5, 1),
('Feature Implementation', 'feature-implementation', 'Building new features end-to-end: understanding requirements, designing approach, writing code, handling edge cases', 12000, 8000, 4, 2),
('Boilerplate/Scaffolding', 'boilerplate-scaffolding', 'Generating project structure, config files, repetitive patterns, and standard code templates', 5000, 10000, 2, 3),
('Quick Fixes', 'quick-fixes', 'Small targeted changes: typos, one-line fixes, simple refactors, config tweaks', 3000, 1500, 1, 4),
('Multi-file Refactor', 'multi-file-refactor', 'Large-scale code restructuring across many files requiring consistent changes and architectural understanding', 20000, 12000, 5, 5),
('Code Review', 'code-review', 'Reviewing code for bugs, security issues, performance problems, and suggesting improvements', 15000, 4000, 3, 6),
('Learning/Exploring', 'learning-exploring', 'Explaining code, answering questions, exploring APIs, prototyping ideas', 4000, 3000, 1, 7);

-- ============================================================
-- 3. MODEL TASK ESTIMATES (98 rows — 14 models x 7 tasks)
-- ============================================================
-- Cost formula: msgs * (task_input_tokens * model_input_price + task_output_tokens * model_output_price) / 1,000,000
-- Time value: minutes * ($75/hr / 60)

INSERT INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, avg_minutes_to_complete, steering_effort, autonomy_score, cost_per_task_estimate, time_value_per_task, data_source) VALUES
-- claude-opus-4.6 ($5.00 in / $25.00 out)
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.85, 1.2, 8.0, 'low', 92, 0.27, 10.0, 'benchmark'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.92, 1.1, 6.8, 'low', 92, 0.286, 8.5, 'benchmark'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.81, 1.3, 9.6, 'low', 92, 0.52, 12.0, 'benchmark'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.98, 1.0, 4.8, 'low', 92, 0.175, 6.0, 'benchmark'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.98, 1.0, 3.2, 'low', 92, 0.275, 4.0, 'benchmark'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 2.0, 'low', 92, 0.0525, 2.5, 'benchmark'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 2.4, 'low', 92, 0.095, 3.0, 'benchmark'),

-- claude-sonnet-4.6 ($3.00 in / $15.00 out)
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.72, 2.0, 12.0, 'medium', 75, 0.27, 15.0, 'community'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.78, 1.8, 10.2, 'medium', 75, 0.2808, 12.75, 'community'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.68, 2.2, 14.4, 'medium', 75, 0.528, 18.0, 'community'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.83, 1.4, 7.2, 'medium', 75, 0.147, 9.0, 'community'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.9, 1.0, 4.8, 'medium', 75, 0.165, 6.0, 'community'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.97, 1.0, 3.0, 'medium', 75, 0.0315, 3.75, 'community'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.94, 1.0, 3.6, 'medium', 75, 0.057, 4.5, 'community'),

-- claude-haiku-4.5 ($1.00 in / $5.00 out)
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.35, 5.0, 28.0, 'high', 30, 0.225, 35.0, 'estimated'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.38, 4.5, 23.8, 'high', 30, 0.234, 29.75, 'estimated'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.33, 5.5, 33.6, 'high', 30, 0.44, 42.0, 'estimated'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.4, 3.5, 16.8, 'high', 30, 0.1225, 21.0, 'estimated'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.44, 2.5, 11.2, 'high', 30, 0.1375, 14.0, 'estimated'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.47, 1.5, 7.0, 'high', 30, 0.0158, 8.75, 'estimated'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.45, 2.0, 8.4, 'high', 30, 0.038, 10.5, 'estimated'),

-- gpt-5.4 ($2.50 in / $15.00 out)
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.77, 1.8, 10.0, 'low', 82, 0.2295, 12.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.83, 1.6, 8.5, 'low', 82, 0.24, 10.62, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.73, 2.0, 12.0, 'low', 82, 0.46, 15.0, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.89, 1.3, 6.0, 'low', 82, 0.1268, 7.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 4.0, 'low', 82, 0.1625, 5.0, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 2.5, 'low', 82, 0.03, 3.12, 'benchmark'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 3.0, 'low', 82, 0.055, 3.75, 'benchmark'),

-- gpt-5.4-mini ($0.75 in / $4.50 out)
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.5, 3.5, 20.0, 'high', 50, 0.1339, 25.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.54, 3.1, 17.0, 'high', 50, 0.1395, 21.25, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.47, 3.9, 24.0, 'high', 50, 0.2691, 30.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.57, 2.4, 12.0, 'high', 50, 0.0702, 15.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.62, 1.8, 8.0, 'high', 50, 0.0877, 10.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.68, 1.1, 5.0, 'high', 50, 0.0099, 6.25, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.65, 1.4, 6.0, 'high', 50, 0.0231, 7.5, 'community'),

-- gpt-5.4-nano ($0.20 in / $1.25 out)
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.25, 6.0, 35.0, 'high', 20, 0.063, 43.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.27, 5.4, 29.8, 'high', 20, 0.067, 37.25, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.24, 6.6, 42.0, 'high', 20, 0.1254, 52.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.29, 4.2, 21.0, 'high', 20, 0.0336, 26.25, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.31, 3.0, 14.0, 'high', 20, 0.0405, 17.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.34, 1.8, 8.8, 'high', 20, 0.0045, 11.0, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.33, 2.4, 10.5, 'high', 20, 0.0109, 13.12, 'estimated'),

-- gpt-o3 ($10.00 in / $40.00 out)
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.68, 2.5, 14.0, 'medium', 70, 0.975, 17.5, 'community'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.73, 2.2, 11.9, 'medium', 70, 0.968, 14.88, 'community'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.65, 2.8, 16.8, 'medium', 70, 1.904, 21.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.78, 1.8, 8.4, 'medium', 70, 0.558, 10.5, 'community'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.85, 1.2, 5.6, 'medium', 70, 0.54, 7.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.92, 1.0, 3.5, 'medium', 70, 0.09, 4.38, 'community'),
((SELECT id FROM models WHERE slug='gpt-o3'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.88, 1.0, 4.2, 'medium', 70, 0.16, 5.25, 'community'),

-- gemini-3.1-pro ($2.00 in / $12.00 out)
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.8, 1.5, 9.0, 'low', 80, 0.153, 11.25, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.86, 1.4, 7.6, 'low', 80, 0.168, 9.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.76, 1.7, 10.8, 'low', 80, 0.3128, 13.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.92, 1.0, 5.4, 'low', 80, 0.078, 6.75, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.98, 1.0, 3.6, 'low', 80, 0.13, 4.5, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 2.2, 'low', 80, 0.024, 2.75, 'benchmark'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 2.7, 'low', 80, 0.044, 3.38, 'benchmark'),

-- gemini-3-pro ($2.00 in / $12.00 out)
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.7, 2.2, 13.0, 'medium', 72, 0.2244, 16.25, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.76, 2.0, 11.0, 'medium', 72, 0.24, 13.75, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.66, 2.4, 15.6, 'medium', 72, 0.4416, 19.5, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.8, 1.5, 7.8, 'medium', 72, 0.117, 9.75, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.88, 1.1, 5.2, 'medium', 72, 0.143, 6.5, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.94, 1.0, 3.2, 'medium', 72, 0.024, 4.0, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.91, 1.0, 3.9, 'medium', 72, 0.044, 4.88, 'community'),

-- gemini-3-flash ($0.50 in / $3.00 out)
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.55, 3.0, 18.0, 'high', 55, 0.0765, 22.5, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.59, 2.7, 15.3, 'high', 55, 0.081, 19.12, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.52, 3.3, 21.6, 'high', 55, 0.1518, 27.0, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.63, 2.1, 10.8, 'high', 55, 0.041, 13.5, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.69, 1.5, 7.2, 'high', 55, 0.0488, 9.0, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.74, 1.0, 4.5, 'high', 55, 0.006, 5.62, 'community'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.72, 1.2, 5.4, 'high', 55, 0.0132, 6.75, 'community'),

-- deepseek-v3.2 ($0.28 in / $0.42 out)
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.48, 3.8, 22.0, 'high', 45, 0.0255, 27.5, 'community'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.52, 3.4, 18.7, 'high', 45, 0.0228, 23.38, 'community'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.46, 4.2, 26.4, 'high', 45, 0.0447, 33.0, 'community'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.55, 2.7, 13.2, 'high', 45, 0.0159, 16.5, 'community'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.6, 1.9, 8.8, 'high', 45, 0.0106, 11.0, 'community'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.65, 1.1, 5.5, 'high', 45, 0.0016, 6.88, 'community'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.62, 1.5, 6.6, 'high', 45, 0.0036, 8.25, 'community'),

-- mistral-large-3 ($2.00 in / $7.00 out)
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.45, 4.0, 22.0, 'high', 42, 0.288, 27.5, 'community'),
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.49, 3.6, 18.7, 'high', 42, 0.288, 23.38, 'community'),
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.43, 4.4, 26.4, 'high', 42, 0.5456, 33.0, 'community'),
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.52, 2.8, 13.2, 'high', 42, 0.1624, 16.5, 'community'),
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.56, 2.0, 8.8, 'high', 42, 0.16, 11.0, 'community'),
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.61, 1.2, 5.5, 'high', 42, 0.0198, 6.88, 'community'),
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.59, 1.6, 6.6, 'high', 42, 0.0464, 8.25, 'community'),

-- qwen-3.5 ($0.50 in / $1.50 out)
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.42, 4.5, 25.0, 'high', 40, 0.0742, 31.25, 'community'),
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.45, 4.0, 21.2, 'high', 40, 0.072, 26.5, 'community'),
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.4, 5.0, 30.0, 'high', 40, 0.14, 37.5, 'community'),
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.48, 3.1, 15.0, 'high', 40, 0.0418, 18.75, 'community'),
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.53, 2.2, 10.0, 'high', 40, 0.0385, 12.5, 'community'),
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.57, 1.3, 6.2, 'high', 40, 0.0049, 7.75, 'community'),
((SELECT id FROM models WHERE slug='qwen-3.5'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.55, 1.8, 7.5, 'high', 40, 0.0117, 9.38, 'community'),

-- grok-4 ($3.00 in / $15.00 out)
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.65, 2.5, 14.0, 'medium', 68, 0.3375, 17.5, 'community'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.7, 2.2, 11.9, 'medium', 68, 0.3432, 14.88, 'community'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.62, 2.8, 16.8, 'medium', 68, 0.672, 21.0, 'community'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.75, 1.8, 8.4, 'medium', 68, 0.189, 10.5, 'community'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.81, 1.2, 5.6, 'medium', 68, 0.198, 7.0, 'community'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.88, 1.0, 3.5, 'medium', 68, 0.0315, 4.38, 'community'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.85, 1.0, 4.2, 'medium', 68, 0.057, 5.25, 'community');

-- ============================================================
-- 4. MODEL COMPOSITE SCORES (14 rows)
-- ============================================================
-- Weights: SWE=0.25, Nuance=0.20, LiveCode=0.15, Arena=0.10, TAU=0.10, GPQA=0.10, SuccessRate=0.10
-- Arena normalization: (elo-1200)/400*100, clamped 0-100
-- Community adjustment: (avg_satisfaction/100*5) - 2.5
-- Missing benchmarks: weight redistributed proportionally among available ones

INSERT INTO model_composite_scores (model_id, composite_score, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, community_adjustment) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 88.56, 20.2, 12.75, 19.0, 7.6, 8.5, 9.13, 9.28, 2.1),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 82.08, 26.53, 0, 22.4, 9.0, 11.47, 0, 11.08, 1.6),
((SELECT id FROM models WHERE slug='gpt-5.4'), 84.72, 19.3, 12.3, 18.4, 7.0, 8.0, 9.2, 8.77, 1.75),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 70.34, 0, 0, 50.0, 0, 0, 0, 19.24, 1.1),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), 46.29, 0, 0, 36.67, 0, 0, 0, 9.62, 0),
((SELECT id FROM models WHERE slug='gpt-o3'), 74.34, 38.39, 0, 0, 0, 0, 18.51, 17.44, 0),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 86.35, 26.87, 0, 23.47, 10.0, 0, 12.55, 11.97, 1.5),
((SELECT id FROM models WHERE slug='gemini-3-pro'), 80.88, 23.44, 17.19, 0, 8.91, 9.75, 11.49, 10.1, 0),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 77.51, 27.21, 19.46, 20.57, 0, 0, 0, 9.07, 1.2),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 68.65, 18.06, 13.88, 15.11, 6.11, 0, 8.33, 6.16, 1.0),
((SELECT id FROM models WHERE slug='mistral-large-3'), 59.28, 21.15, 0, 21.54, 7.69, 0, 0, 7.99, 0.9),
((SELECT id FROM models WHERE slug='qwen-3.5'), 58.92, 23.08, 0, 20.31, 8.08, 0, 0, 7.46, 0),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), 40.4, 0, 0, 0, 0, 0, 0, 40.4, 0),
((SELECT id FROM models WHERE slug='grok-4'), 81.26, 0, 0, 42.5, 0, 0, 20.0, 18.76, 0);

-- ============================================================
-- 5. COMMUNITY REVIEWS (40 rows — 8 models x 5 sources)
-- ============================================================

INSERT INTO community_reviews (model_id, source, sentiment_score, coding_satisfaction, common_complaints, common_praises, review_count, sample_quotes) VALUES
-- claude-opus-4.6 (sentiment=0.85, satisfaction=92)
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'reddit-claudeai', 0.85, 92, '["expensive","rate limits on Max 5x"]', '["best for complex tasks","incredible context understanding","agentic gold standard"]', 1240, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'reddit-locallama', 0.85, 92, '["expensive","rate limits on Max 5x"]', '["best for complex tasks","incredible context understanding","agentic gold standard"]', 380, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'reddit-chatgpt', 0.85, 92, '["expensive","rate limits on Max 5x"]', '["best for complex tasks","incredible context understanding","agentic gold standard"]', 520, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'hackernews', 0.85, 92, '["expensive","rate limits on Max 5x"]', '["best for complex tasks","incredible context understanding","agentic gold standard"]', 890, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'twitter', 0.85, 92, '["expensive","rate limits on Max 5x"]', '["best for complex tasks","incredible context understanding","agentic gold standard"]', 2100, NULL),

-- claude-sonnet-4.6 (sentiment=0.78, satisfaction=82)
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'reddit-claudeai', 0.78, 82, '["sometimes lazy on complex tasks","follows instructions too literally"]', '["great value","fast","good enough for 80% of work"]', 1850, NULL),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'reddit-locallama', 0.78, 82, '["sometimes lazy on complex tasks","follows instructions too literally"]', '["great value","fast","good enough for 80% of work"]', 290, NULL),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'reddit-chatgpt', 0.78, 82, '["sometimes lazy on complex tasks","follows instructions too literally"]', '["great value","fast","good enough for 80% of work"]', 610, NULL),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'hackernews', 0.78, 82, '["sometimes lazy on complex tasks","follows instructions too literally"]', '["great value","fast","good enough for 80% of work"]', 720, NULL),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'twitter', 0.78, 82, '["sometimes lazy on complex tasks","follows instructions too literally"]', '["great value","fast","good enough for 80% of work"]', 1650, NULL),

-- gpt-5.4 (sentiment=0.80, satisfaction=85)
((SELECT id FROM models WHERE slug='gpt-5.4'), 'reddit-claudeai', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 420, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'reddit-locallama', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 310, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'reddit-chatgpt', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 2200, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'hackernews', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 950, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'twitter', 0.80, 85, '["inconsistent on edge cases","context window marketing vs reality"]', '["strong debugging","good nuance","fast responses"]', 3100, NULL),

-- deepseek-v3.2 (sentiment=0.72, satisfaction=70)
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'reddit-claudeai', 0.72, 70, '["needs heavy steering","inconsistent quality","censorship on some topics"]', '["unbeatable price","surprisingly good for simple tasks","open weight"]', 180, NULL),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'reddit-locallama', 0.72, 70, '["needs heavy steering","inconsistent quality","censorship on some topics"]', '["unbeatable price","surprisingly good for simple tasks","open weight"]', 2400, NULL),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'reddit-chatgpt', 0.72, 70, '["needs heavy steering","inconsistent quality","censorship on some topics"]', '["unbeatable price","surprisingly good for simple tasks","open weight"]', 340, NULL),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'hackernews', 0.72, 70, '["needs heavy steering","inconsistent quality","censorship on some topics"]', '["unbeatable price","surprisingly good for simple tasks","open weight"]', 1100, NULL),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'twitter', 0.72, 70, '["needs heavy steering","inconsistent quality","censorship on some topics"]', '["unbeatable price","surprisingly good for simple tasks","open weight"]', 1800, NULL),

-- gemini-3.1-pro (sentiment=0.76, satisfaction=80)
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'reddit-claudeai', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 280, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'reddit-locallama', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 190, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'reddit-chatgpt', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 410, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'hackernews', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 650, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'twitter', 0.76, 80, '["sometimes hallucinates","verbose outputs"]', '["great reasoning","huge context window","good code generation"]', 1400, NULL),

-- gpt-5.4-mini (sentiment=0.68, satisfaction=72)
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'reddit-claudeai', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 150, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'reddit-locallama', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 220, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'reddit-chatgpt', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 1800, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'hackernews', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 430, NULL),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'twitter', 0.68, 72, '["struggles with complex logic","misses nuance"]', '["fast","cheap","handles routine work well"]', 2200, NULL),

-- gemini-3-flash (sentiment=0.70, satisfaction=74)
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'reddit-claudeai', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 120, NULL),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'reddit-locallama', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 340, NULL),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'reddit-chatgpt', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 280, NULL),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'hackernews', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 510, NULL),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'twitter', 0.70, 74, '["shallow reasoning","misses edge cases"]', '["very fast","great for exploration","cheap"]', 960, NULL),

-- mistral-large-3 (sentiment=0.65, satisfaction=68)
((SELECT id FROM models WHERE slug='mistral-large-3'), 'reddit-claudeai', 0.65, 68, '["trails frontier models","limited tool use"]', '["open weight","good for privacy","decent coding"]', 90, NULL),
((SELECT id FROM models WHERE slug='mistral-large-3'), 'reddit-locallama', 0.65, 68, '["trails frontier models","limited tool use"]', '["open weight","good for privacy","decent coding"]', 1600, NULL),
((SELECT id FROM models WHERE slug='mistral-large-3'), 'reddit-chatgpt', 0.65, 68, '["trails frontier models","limited tool use"]', '["open weight","good for privacy","decent coding"]', 140, NULL),
((SELECT id FROM models WHERE slug='mistral-large-3'), 'hackernews', 0.65, 68, '["trails frontier models","limited tool use"]', '["open weight","good for privacy","decent coding"]', 420, NULL),
((SELECT id FROM models WHERE slug='mistral-large-3'), 'twitter', 0.65, 68, '["trails frontier models","limited tool use"]', '["open weight","good for privacy","decent coding"]', 780, NULL);

-- ============================================================
-- 6. TASK TOOL RECOMMENDATIONS (21 rows — 7 tasks x 3 each)
-- ============================================================

INSERT INTO task_tool_recommendations (task_profile_id, tool_id, plan_id, model_id, recommendation_text, value_proposition, rank) VALUES
-- Complex Debugging
((SELECT id FROM task_profiles WHERE slug='complex-debugging'),
 (SELECT id FROM tools WHERE slug='claude-code'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5x'),
 (SELECT id FROM models WHERE slug='claude-opus-4.6'),
 'Highest autonomy (92) with 85% first-attempt success. The 1M context window means you rarely need to re-explain your codebase.',
 'Best success rate for hard bugs at $100/mo flat rate', 1),

((SELECT id FROM task_profiles WHERE slug='complex-debugging'),
 (SELECT id FROM tools WHERE slug='cursor'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'),
 (SELECT id FROM models WHERE slug='gpt-5.4'),
 'Strong debugging at $60/mo. GPT-5.4 high thinking mode excels at tracing through complex logic.',
 'Multi-model flexibility with strong debugging at lower cost', 2),

((SELECT id FROM task_profiles WHERE slug='complex-debugging'),
 (SELECT id FROM tools WHERE slug='github-copilot'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'),
 (SELECT id FROM models WHERE slug='claude-opus-4.6'),
 'Opus in VS Code at $39/mo — fewer Opus requests than Claude Code but cheaper entry point.',
 'Cheapest path to Opus for occasional complex debugging', 3),

-- Feature Implementation
((SELECT id FROM task_profiles WHERE slug='feature-implementation'),
 (SELECT id FROM tools WHERE slug='claude-code'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5x'),
 (SELECT id FROM models WHERE slug='claude-sonnet-4.6'),
 'Best value for features — Sonnet handles 80% of feature work at Opus-level context understanding.',
 'Sonnet for features with Opus fallback on same plan', 1),

((SELECT id FROM task_profiles WHERE slug='feature-implementation'),
 (SELECT id FROM tools WHERE slug='cursor'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='claude-sonnet-4.6'),
 'Multi-model flexibility at $20/mo. Sonnet for features, switch to Opus for blockers.',
 'Affordable multi-model IDE for everyday feature work', 2),

((SELECT id FROM task_profiles WHERE slug='feature-implementation'),
 (SELECT id FROM tools WHERE slug='windsurf'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='claude-sonnet-4.6'),
 'Cascade agent excels at multi-file feature work. $15/mo entry point.',
 'Lowest cost IDE with strong agentic capabilities', 3),

-- Boilerplate/Scaffolding
((SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'),
 (SELECT id FROM tools WHERE slug='github-copilot'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='gpt-5.4-mini'),
 'Perfect for scaffolding at $10/mo. All models converge on boilerplate quality.',
 'Best price-to-performance for repetitive code generation', 1),

((SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'),
 (SELECT id FROM tools WHERE slug='roo-code'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'),
 (SELECT id FROM models WHERE slug='deepseek-v3.2'),
 'Free tool + cheapest API. Boilerplate does not need frontier intelligence.',
 'Near-zero cost for scaffolding and templates', 2),

((SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'),
 (SELECT id FROM tools WHERE slug='cursor'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='gemini-3-flash'),
 'Fast completions for repetitive patterns.',
 'Speed-optimized boilerplate with multi-model fallback', 3),

-- Quick Fixes
((SELECT id FROM task_profiles WHERE slug='quick-fixes'),
 (SELECT id FROM tools WHERE slug='github-copilot'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Free'),
 (SELECT id FROM models WHERE slug='gpt-5.4-mini'),
 '$0/mo — inline suggestions handle most quick fixes without chat.',
 'Free tier handles the majority of one-line fixes', 1),

((SELECT id FROM task_profiles WHERE slug='quick-fixes'),
 (SELECT id FROM tools WHERE slug='claude-code'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='claude-haiku-4.5'),
 'Fast, cheap, handles simple changes. $20/mo base plan.',
 'CLI workflow for rapid fixes with Haiku speed', 2),

((SELECT id FROM task_profiles WHERE slug='quick-fixes'),
 (SELECT id FROM tools WHERE slug='aider'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'),
 (SELECT id FROM models WHERE slug='gpt-5.4-nano'),
 'CLI workflow, $0.20/M input — pennies per fix.',
 'Absolute lowest cost per fix for CLI users', 3),

-- Multi-file Refactor
((SELECT id FROM task_profiles WHERE slug='multi-file-refactor'),
 (SELECT id FROM tools WHERE slug='claude-code'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5x'),
 (SELECT id FROM models WHERE slug='claude-opus-4.6'),
 'Opus with 1M context is unmatched for large refactors spanning 20+ files.',
 'Highest autonomy and context for sweeping changes', 1),

((SELECT id FROM task_profiles WHERE slug='multi-file-refactor'),
 (SELECT id FROM tools WHERE slug='windsurf'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='claude-sonnet-4.6'),
 'Cascade agent specializes in coordinated multi-file changes.',
 'Agentic multi-file edits at $15/mo', 2),

((SELECT id FROM task_profiles WHERE slug='multi-file-refactor'),
 (SELECT id FROM tools WHERE slug='cursor'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'),
 (SELECT id FROM models WHERE slug='gpt-5.4'),
 'Composer mode handles multi-file edits with strong context.',
 'Visual diff-based refactoring with premium models', 3),

-- Code Review
((SELECT id FROM task_profiles WHERE slug='code-review'),
 (SELECT id FROM tools WHERE slug='claude-code'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='claude-sonnet-4.6'),
 'Sonnet catches bugs efficiently. No need for Opus on review tasks.',
 'Best value for thorough code review at $20/mo', 1),

((SELECT id FROM task_profiles WHERE slug='code-review'),
 (SELECT id FROM tools WHERE slug='github-copilot'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='claude-sonnet-4.6'),
 'Integrated VS Code review at $10/mo.',
 'Cheapest path to Sonnet-quality code review', 2),

((SELECT id FROM task_profiles WHERE slug='code-review'),
 (SELECT id FROM tools WHERE slug='cursor'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'),
 (SELECT id FROM models WHERE slug='gemini-3-pro'),
 'Good reasoning for architectural review feedback.',
 'Strong reasoning model for design-level review', 3),

-- Learning/Exploring
((SELECT id FROM task_profiles WHERE slug='learning-exploring'),
 (SELECT id FROM tools WHERE slug='roo-code'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='roo-code') AND plan_name='Free (BYOK)'),
 (SELECT id FROM models WHERE slug='deepseek-v3.2'),
 'Free tool + near-free API. Perfect for experimental prompting.',
 'Zero tool cost for unlimited exploration', 1),

((SELECT id FROM task_profiles WHERE slug='learning-exploring'),
 (SELECT id FROM tools WHERE slug='github-copilot'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Free'),
 (SELECT id FROM models WHERE slug='gpt-5.4-mini'),
 '$0/mo for learning. Good explanations at no cost.',
 'Free tier with solid explanation quality', 2),

((SELECT id FROM task_profiles WHERE slug='learning-exploring'),
 (SELECT id FROM tools WHERE slug='aider'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='aider') AND plan_name='Free (BYOK)'),
 (SELECT id FROM models WHERE slug='gemini-3-flash'),
 'Fast responses for rapid iteration and exploration.',
 'Speed-first CLI exploration at minimal API cost', 3);
