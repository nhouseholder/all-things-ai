-- ============================================================
-- 0006_expanded_model_roster.sql — Add Kimi, MiniMax, Cohere, AI21, Microsoft, Amazon, etc.
-- Generated: 2026-03-23
-- ============================================================

-- ============================================================
-- 1. NEW MODELS
-- ============================================================

-- Moonshot AI — Kimi
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Kimi K2', 'kimi-k2', 'Moonshot AI', 'Kimi', '2026-02-20', 'Moonshot flagship. MoE architecture (1T total, 32B active). Exceptional coding performance rivaling top models at budget pricing. 128K context.', 1, 0.60, 2.40, 0.15, 128000, 1),
('Kimi K2.5', 'kimi-k2.5', 'Moonshot AI', 'Kimi', '2026-03-10', 'Enhanced Kimi with improved agentic capabilities and vision. Strong on SWE-bench. 128K context.', 1, 0.80, 3.20, 0.20, 128000, 0);

-- MiniMax
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('MiniMax-M1', 'minimax-m1', 'MiniMax', 'MiniMax', '2026-01-15', 'MiniMax flagship reasoning model. Lightning MoE with 456B total params. Strong on math and coding. Free tier available.', 1, 0.30, 1.10, 0.08, 1000000, 1),
('MiniMax-01', 'minimax-01', 'MiniMax', 'MiniMax', '2025-12-01', 'MiniMax previous gen. 4M context window. Good for long-document coding tasks.', 1, 0.20, 0.80, NULL, 4000000, 1);

-- Cohere
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Command A', 'command-a', 'Cohere', 'Command', '2026-03-15', 'Cohere latest. 128K context, strong RAG and enterprise coding. Competitive pricing with good agentic performance.', 1, 2.50, 10.00, NULL, 128000, 0),
('Command R+', 'command-r-plus', 'Cohere', 'Command', '2025-08-01', 'Cohere enterprise model. Excellent RAG, 128K context. Strong on structured outputs and tool use.', 1, 2.50, 10.00, NULL, 128000, 0),
('Command R7B', 'command-r7b', 'Cohere', 'Command', '2025-12-01', 'Lightweight Cohere model. 7B params, runs locally. Free for personal use. Good for quick tasks.', 1, 0.04, 0.15, NULL, 128000, 1);

-- AI21 Labs
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Jamba 2 Large', 'jamba-2-large', 'AI21 Labs', 'Jamba', '2026-01-20', 'Hybrid SSM-Transformer architecture. 256K context. Strong on long-context coding and document understanding.', 1, 2.00, 8.00, NULL, 256000, 0),
('Jamba 2 Mini', 'jamba-2-mini', 'AI21 Labs', 'Jamba', '2026-01-20', 'Lightweight Jamba. Good speed/quality tradeoff for coding tasks. 256K context.', 1, 0.20, 0.40, NULL, 256000, 0);

-- Microsoft
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Phi-4', 'phi-4', 'Microsoft', 'Phi', '2025-12-15', 'Microsoft small-but-mighty model. 14B params, punches far above weight. Runs on consumer hardware. Free and open.', 1, 0.00, 0.00, NULL, 16000, 1),
('Phi-4 Mini', 'phi-4-mini', 'Microsoft', 'Phi', '2026-02-01', 'Ultra-small 3.8B model. Runs on phones and laptops. Surprisingly capable for quick fixes and boilerplate.', 1, 0.00, 0.00, NULL, 128000, 1),
('Phi-4 Reasoning', 'phi-4-reasoning', 'Microsoft', 'Phi', '2026-03-01', 'Phi-4 with chain-of-thought reasoning. 14B params with o1-style thinking. Open-weight.', 1, 0.00, 0.00, NULL, 16000, 1);

-- Amazon
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Amazon Nova Pro', 'amazon-nova-pro', 'Amazon', 'Nova', '2025-12-01', 'Amazon flagship via Bedrock. Strong on enterprise tasks, 300K context. Competitive with mid-tier models.', 1, 0.80, 3.20, NULL, 300000, 0),
('Amazon Nova Premier', 'amazon-nova-premier', 'Amazon', 'Nova', '2026-02-15', 'Amazon top-tier. Best Bedrock model for complex reasoning and agentic workflows.', 1, 2.50, 12.50, NULL, 1000000, 0),
('Amazon Nova Lite', 'amazon-nova-lite', 'Amazon', 'Nova', '2025-12-01', 'Budget Amazon model. Low latency, good for simple tasks. Very cheap via Bedrock.', 1, 0.06, 0.24, NULL, 300000, 0);

-- Reka AI
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Reka Core', 'reka-core', 'Reka AI', 'Reka', '2025-11-01', 'Multimodal model with strong code understanding. Good for code review and debugging with visual context.', 1, 3.00, 15.00, NULL, 128000, 0);

-- 01.AI (Yi)
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Yi Lightning', 'yi-lightning', '01.AI', 'Yi', '2025-10-01', 'Ultra-fast inference model from 01.AI. Great speed/cost ratio. Good for rapid prototyping.', 1, 0.14, 0.28, NULL, 16000, 1),
('Yi Large', 'yi-large', '01.AI', 'Yi', '2026-01-15', '01.AI flagship. Competitive reasoning and coding at moderate cost.', 1, 1.00, 4.00, NULL, 128000, 0);

-- ByteDance
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Doubao Pro', 'doubao-pro', 'ByteDance', 'Doubao', '2026-02-01', 'ByteDance flagship. Strong general capabilities. Very popular in China. Competitive pricing globally.', 1, 0.40, 1.60, NULL, 128000, 0);

-- Baidu
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Ernie 4.5', 'ernie-4.5', 'Baidu', 'Ernie', '2026-02-15', 'Baidu next-gen. MoE architecture. Strong on Chinese-language coding but improving on English tasks.', 1, 0.55, 2.20, NULL, 128000, 0);

-- StepFun
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Step-2', 'step-2', 'StepFun', 'Step', '2026-01-10', 'Chinese reasoning model. Trillion-param MoE. Strong on math and STEM coding tasks.', 1, 0.50, 2.00, NULL, 256000, 1);

-- Nous Research (open-source community)
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Nous Hermes 3', 'nous-hermes-3', 'Nous Research', 'Hermes', '2025-12-15', 'Community fine-tune of Llama. Strong instruction following. Popular on local inference. Free.', 1, 0.00, 0.00, NULL, 128000, 1);

-- Perplexity (inference-optimized for search/coding)
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('Sonar Pro', 'sonar-pro', 'Perplexity', 'Sonar', '2026-02-01', 'Perplexity search-augmented model. Grounded in real-time web data. Great for research-heavy coding tasks.', 1, 3.00, 15.00, NULL, 200000, 0),
('Sonar', 'sonar', 'Perplexity', 'Sonar', '2026-02-01', 'Lightweight Perplexity model. Fast, search-augmented. Good for quick lookups during coding.', 1, 1.00, 1.00, NULL, 128000, 0);

-- HuggingFace / BigCode
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('StarCoder 2', 'starcoder-2', 'BigCode', 'StarCoder', '2025-06-01', 'Open-source code model from BigCode/HuggingFace. 15B params. Free. Strong on autocomplete and code generation.', 1, 0.00, 0.00, NULL, 16000, 1);

-- Shanghai AI Lab
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, is_open_weight) VALUES
('InternLM 3', 'internlm-3', 'Shanghai AI Lab', 'InternLM', '2026-01-20', 'Open-source research model. Strong on benchmarks for its size. Popular in academic settings. Free.', 1, 0.00, 0.00, NULL, 128000, 1);

-- ============================================================
-- 2. BENCHMARKS
-- ============================================================

-- Kimi K2
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='kimi-k2'), 'SWE-bench Verified', 'coding', 65.9, 100),
((SELECT id FROM models WHERE slug='kimi-k2'), 'GPQA Diamond', 'reasoning', 77.5, 100),
((SELECT id FROM models WHERE slug='kimi-k2'), 'LiveCodeBench', 'coding', 71.0, 100),
((SELECT id FROM models WHERE slug='kimi-k2'), 'Chatbot Arena ELO', 'nuance', 1395, 2000),
((SELECT id FROM models WHERE slug='kimi-k2'), 'Human Nuance Understanding', 'nuance', 70, 100);

-- Kimi K2.5
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='kimi-k2.5'), 'SWE-bench Verified', 'coding', 70.2, 100),
((SELECT id FROM models WHERE slug='kimi-k2.5'), 'GPQA Diamond', 'reasoning', 80.0, 100),
((SELECT id FROM models WHERE slug='kimi-k2.5'), 'LiveCodeBench', 'coding', 74.0, 100),
((SELECT id FROM models WHERE slug='kimi-k2.5'), 'Human Nuance Understanding', 'nuance', 73, 100);

-- MiniMax-M1
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='minimax-m1'), 'SWE-bench Verified', 'coding', 56.0, 100),
((SELECT id FROM models WHERE slug='minimax-m1'), 'GPQA Diamond', 'reasoning', 70.0, 100),
((SELECT id FROM models WHERE slug='minimax-m1'), 'LiveCodeBench', 'coding', 60.0, 100),
((SELECT id FROM models WHERE slug='minimax-m1'), 'Human Nuance Understanding', 'nuance', 65, 100);

-- MiniMax-01
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='minimax-01'), 'SWE-bench Verified', 'coding', 50.0, 100),
((SELECT id FROM models WHERE slug='minimax-01'), 'GPQA Diamond', 'reasoning', 65.0, 100),
((SELECT id FROM models WHERE slug='minimax-01'), 'LiveCodeBench', 'coding', 54.0, 100),
((SELECT id FROM models WHERE slug='minimax-01'), 'Human Nuance Understanding', 'nuance', 62, 100);

-- Command A
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='command-a'), 'SWE-bench Verified', 'coding', 58.0, 100),
((SELECT id FROM models WHERE slug='command-a'), 'GPQA Diamond', 'reasoning', 72.0, 100),
((SELECT id FROM models WHERE slug='command-a'), 'LiveCodeBench', 'coding', 62.0, 100),
((SELECT id FROM models WHERE slug='command-a'), 'Human Nuance Understanding', 'nuance', 68, 100);

-- Command R+
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='command-r-plus'), 'SWE-bench Verified', 'coding', 52.0, 100),
((SELECT id FROM models WHERE slug='command-r-plus'), 'GPQA Diamond', 'reasoning', 68.0, 100),
((SELECT id FROM models WHERE slug='command-r-plus'), 'LiveCodeBench', 'coding', 56.0, 100),
((SELECT id FROM models WHERE slug='command-r-plus'), 'Human Nuance Understanding', 'nuance', 66, 100);

-- Jamba 2 Large
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='jamba-2-large'), 'SWE-bench Verified', 'coding', 50.0, 100),
((SELECT id FROM models WHERE slug='jamba-2-large'), 'GPQA Diamond', 'reasoning', 66.0, 100),
((SELECT id FROM models WHERE slug='jamba-2-large'), 'LiveCodeBench', 'coding', 55.0, 100),
((SELECT id FROM models WHERE slug='jamba-2-large'), 'Human Nuance Understanding', 'nuance', 64, 100);

-- Phi-4
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='phi-4'), 'SWE-bench Verified', 'coding', 48.0, 100),
((SELECT id FROM models WHERE slug='phi-4'), 'GPQA Diamond', 'reasoning', 62.0, 100),
((SELECT id FROM models WHERE slug='phi-4'), 'LiveCodeBench', 'coding', 55.0, 100),
((SELECT id FROM models WHERE slug='phi-4'), 'Human Nuance Understanding', 'nuance', 60, 100);

-- Phi-4 Reasoning
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='phi-4-reasoning'), 'SWE-bench Verified', 'coding', 55.0, 100),
((SELECT id FROM models WHERE slug='phi-4-reasoning'), 'GPQA Diamond', 'reasoning', 72.0, 100),
((SELECT id FROM models WHERE slug='phi-4-reasoning'), 'LiveCodeBench', 'coding', 60.0, 100),
((SELECT id FROM models WHERE slug='phi-4-reasoning'), 'Human Nuance Understanding', 'nuance', 58, 100);

-- Amazon Nova Pro
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='amazon-nova-pro'), 'SWE-bench Verified', 'coding', 48.0, 100),
((SELECT id FROM models WHERE slug='amazon-nova-pro'), 'GPQA Diamond', 'reasoning', 60.0, 100),
((SELECT id FROM models WHERE slug='amazon-nova-pro'), 'LiveCodeBench', 'coding', 52.0, 100),
((SELECT id FROM models WHERE slug='amazon-nova-pro'), 'Human Nuance Understanding', 'nuance', 62, 100);

-- Amazon Nova Premier
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='amazon-nova-premier'), 'SWE-bench Verified', 'coding', 58.0, 100),
((SELECT id FROM models WHERE slug='amazon-nova-premier'), 'GPQA Diamond', 'reasoning', 70.0, 100),
((SELECT id FROM models WHERE slug='amazon-nova-premier'), 'LiveCodeBench', 'coding', 62.0, 100),
((SELECT id FROM models WHERE slug='amazon-nova-premier'), 'Human Nuance Understanding', 'nuance', 66, 100);

-- Yi Lightning
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='yi-lightning'), 'SWE-bench Verified', 'coding', 42.0, 100),
((SELECT id FROM models WHERE slug='yi-lightning'), 'LiveCodeBench', 'coding', 48.0, 100),
((SELECT id FROM models WHERE slug='yi-lightning'), 'Human Nuance Understanding', 'nuance', 58, 100);

-- Yi Large
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='yi-large'), 'SWE-bench Verified', 'coding', 54.0, 100),
((SELECT id FROM models WHERE slug='yi-large'), 'GPQA Diamond', 'reasoning', 68.0, 100),
((SELECT id FROM models WHERE slug='yi-large'), 'LiveCodeBench', 'coding', 60.0, 100),
((SELECT id FROM models WHERE slug='yi-large'), 'Human Nuance Understanding', 'nuance', 65, 100);

-- Doubao Pro
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='doubao-pro'), 'SWE-bench Verified', 'coding', 52.0, 100),
((SELECT id FROM models WHERE slug='doubao-pro'), 'GPQA Diamond', 'reasoning', 70.0, 100),
((SELECT id FROM models WHERE slug='doubao-pro'), 'LiveCodeBench', 'coding', 58.0, 100),
((SELECT id FROM models WHERE slug='doubao-pro'), 'Human Nuance Understanding', 'nuance', 64, 100);

-- Ernie 4.5
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='ernie-4.5'), 'SWE-bench Verified', 'coding', 50.0, 100),
((SELECT id FROM models WHERE slug='ernie-4.5'), 'GPQA Diamond', 'reasoning', 72.0, 100),
((SELECT id FROM models WHERE slug='ernie-4.5'), 'LiveCodeBench', 'coding', 55.0, 100),
((SELECT id FROM models WHERE slug='ernie-4.5'), 'Human Nuance Understanding', 'nuance', 62, 100);

-- Step-2
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='step-2'), 'SWE-bench Verified', 'coding', 56.0, 100),
((SELECT id FROM models WHERE slug='step-2'), 'GPQA Diamond', 'reasoning', 74.0, 100),
((SELECT id FROM models WHERE slug='step-2'), 'LiveCodeBench', 'coding', 62.0, 100),
((SELECT id FROM models WHERE slug='step-2'), 'Human Nuance Understanding', 'nuance', 66, 100);

-- Sonar Pro
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='sonar-pro'), 'SWE-bench Verified', 'coding', 48.0, 100),
((SELECT id FROM models WHERE slug='sonar-pro'), 'GPQA Diamond', 'reasoning', 64.0, 100),
((SELECT id FROM models WHERE slug='sonar-pro'), 'LiveCodeBench', 'coding', 52.0, 100),
((SELECT id FROM models WHERE slug='sonar-pro'), 'Human Nuance Understanding', 'nuance', 70, 100);

-- StarCoder 2
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='starcoder-2'), 'SWE-bench Verified', 'coding', 35.0, 100),
((SELECT id FROM models WHERE slug='starcoder-2'), 'LiveCodeBench', 'coding', 45.0, 100),
((SELECT id FROM models WHERE slug='starcoder-2'), 'Human Nuance Understanding', 'nuance', 42, 100);

-- InternLM 3
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='internlm-3'), 'SWE-bench Verified', 'coding', 52.0, 100),
((SELECT id FROM models WHERE slug='internlm-3'), 'GPQA Diamond', 'reasoning', 66.0, 100),
((SELECT id FROM models WHERE slug='internlm-3'), 'LiveCodeBench', 'coding', 58.0, 100),
((SELECT id FROM models WHERE slug='internlm-3'), 'Human Nuance Understanding', 'nuance', 62, 100);

-- ============================================================
-- 3. COMPOSITE SCORES
-- ============================================================

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 65.9, 71.0, 70.0, 69.8, 60.0, 77.5, 66.0, 68.5 FROM models WHERE slug='kimi-k2';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 70.2, 74.0, 73.0, 70.0, 64.0, 80.0, 70.0, 72.0 FROM models WHERE slug='kimi-k2.5';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 56.0, 60.0, 65.0, 58.0, 50.0, 70.0, 58.0, 59.9 FROM models WHERE slug='minimax-m1';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 50.0, 54.0, 62.0, 52.0, 45.0, 65.0, 52.0, 54.6 FROM models WHERE slug='minimax-01';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 58.0, 62.0, 68.0, 62.0, 55.0, 72.0, 60.0, 62.7 FROM models WHERE slug='command-a';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 52.0, 56.0, 66.0, 58.0, 50.0, 68.0, 55.0, 58.1 FROM models WHERE slug='command-r-plus';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 50.0, 55.0, 64.0, 55.0, 48.0, 66.0, 52.0, 56.1 FROM models WHERE slug='jamba-2-large';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 48.0, 55.0, 60.0, 50.0, 42.0, 62.0, 50.0, 52.9 FROM models WHERE slug='phi-4';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 55.0, 60.0, 58.0, 52.0, 48.0, 72.0, 56.0, 57.9 FROM models WHERE slug='phi-4-reasoning';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 48.0, 52.0, 62.0, 52.0, 44.0, 60.0, 50.0, 53.0 FROM models WHERE slug='amazon-nova-pro';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 58.0, 62.0, 66.0, 60.0, 55.0, 70.0, 60.0, 61.9 FROM models WHERE slug='amazon-nova-premier';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 42.0, 48.0, 58.0, 45.0, 38.0, 50.0, 44.0, 46.9 FROM models WHERE slug='yi-lightning';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 54.0, 60.0, 65.0, 58.0, 50.0, 68.0, 56.0, 59.1 FROM models WHERE slug='yi-large';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 52.0, 58.0, 64.0, 56.0, 48.0, 70.0, 54.0, 57.8 FROM models WHERE slug='doubao-pro';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 50.0, 55.0, 62.0, 54.0, 46.0, 72.0, 52.0, 56.3 FROM models WHERE slug='ernie-4.5';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 56.0, 62.0, 66.0, 58.0, 52.0, 74.0, 58.0, 61.0 FROM models WHERE slug='step-2';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 48.0, 52.0, 70.0, 55.0, 44.0, 64.0, 50.0, 55.3 FROM models WHERE slug='sonar-pro';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 35.0, 45.0, 42.0, 35.0, 30.0, 40.0, 38.0, 38.1 FROM models WHERE slug='starcoder-2';

INSERT OR IGNORE INTO model_composite_scores (model_id, swe_bench_component, livecodebench_component, nuance_component, arena_component, tau_component, gpqa_component, success_rate_component, composite_score)
SELECT id, 52.0, 58.0, 62.0, 54.0, 48.0, 66.0, 54.0, 56.6 FROM models WHERE slug='internlm-3';
