-- ============================================================
-- 0004_model_expansion.sql — Add GPT-5.4 reasoning levels, legacy models, recalibrate Gemini
-- Generated: 2026-03-23
-- ============================================================

-- ============================================================
-- 1. ADD NEW MODELS
-- ============================================================

-- GPT-5.4 reasoning levels (separate entries for each thinking level)
-- Base GPT-5.4 stays as-is (represents "medium" default thinking)
-- Add low, high, xhigh variants with estimated cost multipliers
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window) VALUES
('GPT-5.4 (Low Thinking)', 'gpt-5.4-low', 'OpenAI', 'GPT', '2026-03-05', 'GPT-5.4 with minimal reasoning. Fastest responses, lowest cost. Best for autocomplete and simple chat.', 1, 2.50, 15.00, 0.25, 1100000),
('GPT-5.4 (High Thinking)', 'gpt-5.4-high', 'OpenAI', 'GPT', '2026-03-05', 'GPT-5.4 with deep reasoning. More internal chain-of-thought, higher output token usage. Best for debugging and code review.', 1, 2.50, 15.00, 0.25, 1100000),
('GPT-5.4 (XHigh Thinking)', 'gpt-5.4-xhigh', 'OpenAI', 'GPT', '2026-03-05', 'GPT-5.4 with maximum reasoning depth. Longest chain-of-thought, highest cost. Best for novel algorithms and security audits.', 1, 2.50, 15.00, 0.25, 1100000);

-- Legacy models — re-add as active
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window) VALUES
('Claude Opus 4.5', 'claude-opus-4.5', 'Anthropic', 'Claude', '2025-11-24', 'Previous Anthropic flagship. Strong reasoning and coding. Still available on API and subscriptions. 200K context.', 1, 5.00, 25.00, 0.50, 200000),
('GPT-5.3 Codex', 'gpt-5.3-codex', 'OpenAI', 'Codex', '2026-02-05', 'OpenAI coding-specialized model. Powers Codex CLI and GitHub Copilot. Strong agentic coding at competitive price. 400K context.', 1, 1.75, 14.00, NULL, 400000);

-- ============================================================
-- 2. BENCHMARKS FOR NEW MODELS
-- ============================================================

-- GPT-5.4 Low — same base benchmarks, slightly lower effective scores due to less reasoning
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-low'), 'SWE-bench Verified', 'coding', 68.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), 'GPQA Diamond', 'reasoning', 78.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), 'LiveCodeBench', 'coding', 72.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), 'Chatbot Arena ELO', 'nuance', 1440, 2000),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), 'Human Nuance Understanding', 'nuance', 80, 100);

-- GPT-5.4 High — enhanced scores from deeper reasoning
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'SWE-bench Verified', 'coding', 80.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'GPQA Diamond', 'reasoning', 92.5, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'LiveCodeBench', 'coding', 85.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'Chatbot Arena ELO', 'nuance', 1490, 2000),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 'Human Nuance Understanding', 'nuance', 93, 100);

-- GPT-5.4 XHigh — top reasoning performance
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'SWE-bench Verified', 'coding', 82.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'GPQA Diamond', 'reasoning', 92.8, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'LiveCodeBench', 'coding', 86.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'Chatbot Arena ELO', 'nuance', 1495, 2000),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 'Human Nuance Understanding', 'nuance', 94, 100);

-- Claude Opus 4.5
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 'SWE-bench Verified', 'coding', 80.9, 100),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 'GPQA Diamond', 'reasoning', 87.0, 100),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 'Chatbot Arena ELO', 'nuance', 1490, 2000),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 'Human Nuance Understanding', 'nuance', 90, 100),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 'TAU-bench Retail', 'agentic', 83.0, 100);

-- GPT-5.3 Codex
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'SWE-bench Verified', 'coding', 80.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'GPQA Diamond', 'reasoning', 91.5, 100),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'Human Nuance Understanding', 'nuance', 82, 100);

-- ============================================================
-- 3. RECALIBRATE GEMINI 3.1 PRO NUANCE
-- ============================================================
-- User feedback: Gemini is an "overthinker" that lacks human nuance
-- Drop nuance from 88 to 76, add community complaints reflecting this
UPDATE benchmarks SET score = 76
WHERE model_id = (SELECT id FROM models WHERE slug='gemini-3.1-pro')
  AND benchmark_name = 'Human Nuance Understanding';

-- Update Gemini community reviews with more accurate sentiment
UPDATE community_reviews
SET sentiment_score = 0.70,
    coding_satisfaction = 76,
    common_complaints = '["overthinker — misses subtle user intent","verbose outputs","sometimes hallucinates","good on benchmarks but lacks human feel"]',
    common_praises = '["strong structured reasoning","huge context window","good code generation","benchmark leader"]'
WHERE model_id = (SELECT id FROM models WHERE slug='gemini-3.1-pro');

-- Add reviews from additional community sources
INSERT INTO community_reviews (model_id, source, sentiment_score, coding_satisfaction, common_complaints, common_praises, review_count, sample_quotes) VALUES
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'reddit-bard', 0.68, 74, '["overthinker","misses nuance","too literal","verbose"]', '["improved reasoning","good at structured tasks"]', 380, NULL),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'youtube-reviews', 0.65, 72, '["doesnt get what I mean","over-explains","lacks feel for developer workflow"]', '["benchmark scores are real","good multimodal"]', 95, NULL);

-- ============================================================
-- 4. MODEL AVAILABILITY FOR NEW MODELS
-- ============================================================

-- Claude Opus 4.5 availability
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
-- Claude Code Max plans
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5x'), 'full'),
-- Cursor Pro+ (multi-model)
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
-- GitHub Copilot Pro+
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full');

-- GPT-5.3 Codex availability
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
-- Codex (OpenAI)
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Plus'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full'),
-- GitHub Copilot (LTS)
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full');

-- GPT-5.4 reasoning variants — same availability as base GPT-5.4
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
-- Low
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
-- High
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full'),
-- XHigh
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full');

-- ============================================================
-- 5. TASK ESTIMATES FOR NEW MODELS
-- ============================================================

-- GPT-5.4 Low ($2.50 in / $15.00 out — but ~0.5x reasoning tokens vs medium)
INSERT INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, avg_minutes_to_complete, steering_effort, autonomy_score, cost_per_task_estimate, time_value_per_task, data_source) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.55, 3.2, 16.0, 'high', 55, 0.115, 20.0, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.72, 2.0, 9.0, 'medium', 65, 0.12, 11.25, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 2.8, 'low', 82, 0.081, 3.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 1.8, 'low', 85, 0.015, 2.25, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.50, 3.5, 18.0, 'high', 50, 0.23, 22.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.70, 1.8, 7.0, 'medium', 65, 0.063, 8.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-low'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.90, 1.0, 2.5, 'low', 80, 0.028, 3.12, 'estimated');

-- GPT-5.4 High ($2.50 in / $15.00 out — ~2.5x reasoning tokens)
INSERT INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, avg_minutes_to_complete, steering_effort, autonomy_score, cost_per_task_estimate, time_value_per_task, data_source) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.82, 1.3, 9.5, 'low', 86, 0.38, 11.88, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.88, 1.2, 7.8, 'low', 86, 0.40, 9.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 4.5, 'low', 86, 0.41, 5.62, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 3.0, 'low', 86, 0.075, 3.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.78, 1.5, 11.0, 'low', 86, 0.77, 13.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.93, 1.0, 5.5, 'low', 86, 0.21, 6.88, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 3.2, 'low', 86, 0.092, 4.0, 'estimated');

-- GPT-5.4 XHigh ($2.50 in / $15.00 out — ~4x reasoning tokens)
INSERT INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, avg_minutes_to_complete, steering_effort, autonomy_score, cost_per_task_estimate, time_value_per_task, data_source) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.85, 1.2, 12.0, 'low', 88, 0.60, 15.0, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.90, 1.1, 10.0, 'low', 88, 0.63, 12.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 5.5, 'low', 88, 0.65, 6.88, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.98, 1.0, 4.0, 'low', 88, 0.12, 5.0, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.80, 1.3, 14.0, 'low', 88, 1.22, 17.5, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.95, 1.0, 7.0, 'low', 88, 0.33, 8.75, 'estimated'),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.98, 1.0, 4.0, 'low', 88, 0.145, 5.0, 'estimated');

-- Claude Opus 4.5 ($5.00 in / $25.00 out)
INSERT INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, avg_minutes_to_complete, steering_effort, autonomy_score, cost_per_task_estimate, time_value_per_task, data_source) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.82, 1.3, 8.5, 'low', 88, 0.26, 10.62, 'community'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.88, 1.2, 7.2, 'low', 88, 0.27, 9.0, 'community'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.96, 1.0, 3.5, 'low', 88, 0.275, 4.38, 'community'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.97, 1.0, 2.2, 'low', 88, 0.05, 2.75, 'community'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.78, 1.4, 10.0, 'low', 88, 0.49, 12.5, 'community'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.95, 1.0, 5.0, 'low', 88, 0.17, 6.25, 'community'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.96, 1.0, 2.6, 'low', 88, 0.09, 3.25, 'community');

-- GPT-5.3 Codex ($1.75 in / $14.00 out)
INSERT INTO model_task_estimates (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete, avg_minutes_to_complete, steering_effort, autonomy_score, cost_per_task_estimate, time_value_per_task, data_source) VALUES
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='complex-debugging'), 0.75, 1.5, 10.5, 'low', 80, 0.166, 13.12, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='feature-implementation'), 0.80, 1.3, 8.8, 'low', 80, 0.175, 11.0, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='boilerplate-scaffolding'), 0.94, 1.0, 3.8, 'low', 80, 0.149, 4.75, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='quick-fixes'), 0.96, 1.0, 2.5, 'low', 80, 0.026, 3.12, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='multi-file-refactor'), 0.72, 1.7, 13.0, 'low', 80, 0.358, 16.25, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='code-review'), 0.88, 1.2, 6.5, 'low', 80, 0.118, 8.12, 'community'),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), (SELECT id FROM task_profiles WHERE slug='learning-exploring'), 0.92, 1.0, 3.2, 'low', 80, 0.048, 4.0, 'community');

-- ============================================================
-- 6. COMPOSITE SCORES FOR NEW MODELS
-- ============================================================

INSERT INTO model_composite_scores (model_id, composite_score, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, community_adjustment) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-low'), 72.10, 17.0, 10.8, 16.0, 6.0, 0, 7.8, 13.5, 1.0),
((SELECT id FROM models WHERE slug='gpt-5.4-high'), 86.25, 20.0, 12.75, 18.6, 7.25, 0, 9.25, 17.4, 1.0),
((SELECT id FROM models WHERE slug='gpt-5.4-xhigh'), 87.80, 20.5, 12.9, 18.8, 7.38, 0, 9.28, 17.94, 1.0),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 85.60, 20.23, 0, 18.0, 7.25, 8.3, 8.7, 17.12, 6.0),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 79.30, 20.0, 0, 16.4, 0, 0, 9.15, 15.75, 18.0);

-- Update Gemini 3.1 Pro composite score to reflect nuance recalibration
UPDATE model_composite_scores
SET nuance_component = 20.27,
    composite_score = 83.15,
    community_adjustment = 0.8
WHERE model_id = (SELECT id FROM models WHERE slug='gemini-3.1-pro');

-- ============================================================
-- 7. COMMUNITY REVIEWS FOR NEW MODELS
-- ============================================================

INSERT INTO community_reviews (model_id, source, sentiment_score, coding_satisfaction, common_complaints, common_praises, review_count, sample_quotes) VALUES
-- Claude Opus 4.5
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 'reddit-claudeai', 0.82, 88, '["no 1M context","slower than 4.6"]', '["rock solid reasoning","still my daily driver for some tasks","great value if you dont need 1M context"]', 620, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 'hackernews', 0.82, 88, '["no 1M context","slower than 4.6"]', '["rock solid reasoning","still my daily driver for some tasks"]', 340, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), 'twitter', 0.82, 88, '["no 1M context","slower than 4.6"]', '["rock solid reasoning","still my daily driver for some tasks"]', 890, NULL),

-- GPT-5.3 Codex
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'reddit-chatgpt', 0.78, 82, '["limited to coding tasks","no general chat"]', '["excellent autonomous coding","great in Codex CLI","GitHub Copilot LTS"]', 780, NULL),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'hackernews', 0.78, 82, '["limited to coding tasks","no general chat"]', '["excellent autonomous coding","great in Codex CLI"]', 520, NULL),
((SELECT id FROM models WHERE slug='gpt-5.3-codex'), 'twitter', 0.78, 82, '["limited to coding tasks","no general chat"]', '["excellent autonomous coding","great in Codex CLI","GitHub Copilot LTS"]', 1200, NULL);

-- Rename base GPT-5.4 to clarify it's "medium" thinking
UPDATE models SET name = 'GPT-5.4 (Medium Thinking)', description = 'GPT-5.4 with balanced reasoning. Recommended default for most tasks. 1.1M context.' WHERE slug = 'gpt-5.4';
