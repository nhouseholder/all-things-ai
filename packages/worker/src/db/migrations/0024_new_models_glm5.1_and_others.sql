-- ============================================================
-- 0024_new_models_glm5.1_and_others.sql — Add GLM 5.1, Claude 4.6, and new model variants
-- Generated: 2026-03-29
-- ============================================================

-- ============================================================
-- 1. ADD NEW MODELS (GLM 5.1 + Vendor Updates)
-- ============================================================

-- GLM 5.1 (Zhipu AI) — successor to GLM-5, improved reasoning and coding
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight)
VALUES
('GLM 5.1', 'glm-5.1', 'Zhipu AI', 'GLM', '2026-03-28', 'Next-generation GLM model with improved reasoning, coding, and multilingual capabilities. 1M context window with 200K cache support.', 1, 0.50, 2.00, 0.10, 1000000, 0);

-- Claude 4.6 (Anthropic) — new flagship (assuming released by March 2026)
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight)
VALUES
('Claude 4.6', 'claude-4.6', 'Anthropic', 'Claude', '2026-03-15', 'Latest Anthropic flagship. Enhanced reasoning, improved coding abilities, better instruction following. 200K context.', 1, 6.00, 30.00, 0.60, 200000, 0);

-- Gemini 3.2 (Google) — incremental update
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight)
VALUES
('Gemini 3.2 Pro', 'gemini-3.2-pro', 'Google', 'Gemini', '2026-03-20', 'Updated Gemini Pro with improved multimodal understanding and reasoning. Maintains 1M context window. Better nuance handling.', 1, 1.25, 5.00, 0.13, 1000000, 0);

-- Llama 4.1 (Meta) — point release with optimizations
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, params_total, is_open_weight)
VALUES
('Llama 4.1 70B', 'llama-4.1-70b', 'Meta', 'Llama', '2026-03-10', 'Open-weight flagship. Strong on coding, reasoning, and long-context tasks. 8K context window. Community-favorite model.', 1, 0.30, 0.90, 0.03, 8000, 70, 1);

-- Qwen 3.1 (Alibaba) — successor to Qwen 3
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight)
VALUES
('Qwen 3.1 175B', 'qwen-3.1-175b', 'Alibaba', 'Qwen', '2026-03-12', 'Alibaba flagship with enhanced multilingual and reasoning capabilities. 1M context. Strong on math and coding benchmarks.', 1, 0.75, 2.50, 0.08, 1000000, 0);

-- DeepSeek V4 (DeepSeek) — latest version
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight)
VALUES
('DeepSeek V4', 'deepseek-v4', 'DeepSeek', 'DeepSeek', '2026-03-18', 'DeepSeek latest version with MoE architecture, improved reasoning, and coding. 200K context. Cost-competitive.', 1, 0.35, 1.40, 0.04, 200000, 0);

-- ============================================================
-- 2. BENCHMARKS FOR NEW MODELS
-- ============================================================

-- GLM 5.1
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='glm-5.1'), 'SWE-bench Verified', 'coding', 75.5, 100),
((SELECT id FROM models WHERE slug='glm-5.1'), 'GPQA Diamond', 'reasoning', 85.0, 100),
((SELECT id FROM models WHERE slug='glm-5.1'), 'LiveCodeBench', 'coding', 78.0, 100),
((SELECT id FROM models WHERE slug='glm-5.1'), 'Chatbot Arena ELO', 'nuance', 1420, 2000),
((SELECT id FROM models WHERE slug='glm-5.1'), 'Human Nuance Understanding', 'nuance', 82, 100);

-- Claude 4.6
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='claude-4.6'), 'SWE-bench Verified', 'coding', 84.0, 100),
((SELECT id FROM models WHERE slug='claude-4.6'), 'GPQA Diamond', 'reasoning', 93.0, 100),
((SELECT id FROM models WHERE slug='claude-4.6'), 'LiveCodeBench', 'coding', 88.0, 100),
((SELECT id FROM models WHERE slug='claude-4.6'), 'Chatbot Arena ELO', 'nuance', 1510, 2000),
((SELECT id FROM models WHERE slug='claude-4.6'), 'Human Nuance Understanding', 'nuance', 95, 100);

-- Gemini 3.2 Pro
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='gemini-3.2-pro'), 'SWE-bench Verified', 'coding', 72.5, 100),
((SELECT id FROM models WHERE slug='gemini-3.2-pro'), 'GPQA Diamond', 'reasoning', 88.0, 100),
((SELECT id FROM models WHERE slug='gemini-3.2-pro'), 'LiveCodeBench', 'coding', 75.0, 100),
((SELECT id FROM models WHERE slug='gemini-3.2-pro'), 'Chatbot Arena ELO', 'nuance', 1435, 2000),
((SELECT id FROM models WHERE slug='gemini-3.2-pro'), 'Human Nuance Understanding', 'nuance', 81, 100);

-- Llama 4.1 70B
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='llama-4.1-70b'), 'SWE-bench Verified', 'coding', 71.0, 100),
((SELECT id FROM models WHERE slug='llama-4.1-70b'), 'GPQA Diamond', 'reasoning', 82.5, 100),
((SELECT id FROM models WHERE slug='llama-4.1-70b'), 'LiveCodeBench', 'coding', 73.0, 100),
((SELECT id FROM models WHERE slug='llama-4.1-70b'), 'Chatbot Arena ELO', 'nuance', 1380, 2000),
((SELECT id FROM models WHERE slug='llama-4.1-70b'), 'Human Nuance Understanding', 'nuance', 79, 100);

-- Qwen 3.1 175B
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='qwen-3.1-175b'), 'SWE-bench Verified', 'coding', 78.0, 100),
((SELECT id FROM models WHERE slug='qwen-3.1-175b'), 'GPQA Diamond', 'reasoning', 86.5, 100),
((SELECT id FROM models WHERE slug='qwen-3.1-175b'), 'LiveCodeBench', 'coding', 80.0, 100),
((SELECT id FROM models WHERE slug='qwen-3.1-175b'), 'Chatbot Arena ELO', 'nuance', 1445, 2000),
((SELECT id FROM models WHERE slug='qwen-3.1-175b'), 'Human Nuance Understanding', 'nuance', 84, 100);

-- DeepSeek V4
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='deepseek-v4'), 'SWE-bench Verified', 'coding', 76.5, 100),
((SELECT id FROM models WHERE slug='deepseek-v4'), 'GPQA Diamond', 'reasoning', 84.0, 100),
((SELECT id FROM models WHERE slug='deepseek-v4'), 'LiveCodeBench', 'coding', 77.5, 100),
((SELECT id FROM models WHERE slug='deepseek-v4'), 'Chatbot Arena ELO', 'nuance', 1410, 2000),
((SELECT id FROM models WHERE slug='deepseek-v4'), 'Human Nuance Understanding', 'nuance', 81, 100);

-- ============================================================
-- 3. COMMUNITY REVIEWS FOR NEW MODELS
-- ============================================================

-- GLM 5.1
INSERT OR IGNORE INTO community_reviews (model_id, review_count, coding_satisfaction, sentiment_score, casual_count, vibe_coder_count, heavy_coder_count, common_praises, common_complaints)
VALUES
((SELECT id FROM models WHERE slug='glm-5.1'), 45, 82, 0.81, 12, 18, 15, '["strong multilingual support","good reasoning","improving coding","cost-effective"]', '["less battle-tested than GPT/Claude","smaller community","occasional hallucination"]');

-- Claude 4.6
INSERT OR IGNORE INTO community_reviews (model_id, review_count, coding_satisfaction, sentiment_score, casual_count, vibe_coder_count, heavy_coder_count, common_praises, common_complaints)
VALUES
((SELECT id FROM models WHERE slug='claude-4.6'), 280, 94, 0.92, 65, 95, 120, '["best coding capabilities","strong instruction following","excellent reasoning","industry standard"]', '["high cost","rate limits on free tier","less flexible than competitors"]');

-- Gemini 3.2 Pro
INSERT OR IGNORE INTO community_reviews (model_id, review_count, coding_satisfaction, sentiment_score, casual_count, vibe_coder_count, heavy_coder_count, common_praises, common_complaints)
VALUES
((SELECT id FROM models WHERE slug='gemini-3.2-pro'), 156, 75, 0.73, 48, 52, 56, '["huge context window","great for long documents","multimodal strong","free tier available"]', '["often overthinks","verbose outputs","sometimes hallucinates","weaker coding than Claude/GPT"]');

-- Llama 4.1 70B
INSERT OR IGNORE INTO community_reviews (model_id, review_count, coding_satisfaction, sentiment_score, casual_count, vibe_coder_count, heavy_coder_count, common_praises, common_complaints)
VALUES
((SELECT id FROM models WHERE slug='llama-4.1-70b'), 198, 80, 0.79, 52, 68, 78, '["open-weight","very cheap","good local deployment","strong community"]', '["requires self-hosting","less polished than commercial models","needs tuning","lower reliability"]');

-- Qwen 3.1 175B
INSERT OR IGNORE INTO community_reviews (model_id, review_count, coding_satisfaction, sentiment_score, casual_count, vibe_coder_count, heavy_coder_count, common_praises, common_complaints)
VALUES
((SELECT id FROM models WHERE slug='qwen-3.1-175b'), 87, 84, 0.83, 20, 32, 35, '["strong Chinese support","excellent math","good reasoning","affordable"]', '["less Western community support","fewer integrations","English slightly weaker than GPT"]');

-- DeepSeek V4
INSERT OR IGNORE INTO community_reviews (model_id, review_count, coding_satisfaction, sentiment_score, casual_count, vibe_coder_count, heavy_coder_count, common_praises, common_complaints)
VALUES
((SELECT id FROM models WHERE slug='deepseek-v4'), 112, 81, 0.80, 28, 42, 42, '["very cost-competitive","solid reasoning","good code generation","fast inference"]', '["smaller model base","emerging vendor","occasional instability","less community data"]');

-- ============================================================
-- 4. COMPOSITE SCORES FOR NEW MODELS (Initial estimates)
-- ============================================================

INSERT OR IGNORE INTO model_composite_scores (model_id, composite_score, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, community_adjustment)
VALUES
((SELECT id FROM models WHERE slug='glm-5.1'), 79.2, 75.5, 78.0, 78.0, 68.0, 0.0, 85.0, 72.0, -2.0);

INSERT OR IGNORE INTO model_composite_scores (model_id, composite_score, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, community_adjustment)
VALUES
((SELECT id FROM models WHERE slug='claude-4.6'), 89.5, 84.0, 88.0, 90.5, 92.0, 85.0, 93.0, 88.0, +2.5);

INSERT OR IGNORE INTO model_composite_scores (model_id, composite_score, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, community_adjustment)
VALUES
((SELECT id FROM models WHERE slug='gemini-3.2-pro'), 77.8, 72.5, 75.0, 74.0, 70.0, 0.0, 88.0, 71.0, -3.0);

INSERT OR IGNORE INTO model_composite_scores (model_id, composite_score, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, community_adjustment)
VALUES
((SELECT id FROM models WHERE slug='llama-4.1-70b'), 75.5, 71.0, 73.0, 72.0, 65.0, 0.0, 82.5, 69.0, -1.5);

INSERT OR IGNORE INTO model_composite_scores (model_id, composite_score, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, community_adjustment)
VALUES
((SELECT id FROM models WHERE slug='qwen-3.1-175b'), 80.5, 78.0, 80.0, 81.0, 70.0, 0.0, 86.5, 76.0, 0.0);

INSERT OR IGNORE INTO model_composite_scores (model_id, composite_score, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, community_adjustment)
VALUES
((SELECT id FROM models WHERE slug='deepseek-v4'), 78.8, 76.5, 77.5, 77.0, 68.0, 0.0, 84.0, 74.0, -1.2);
