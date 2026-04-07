-- ============================================================
-- 0029_benchmark_expansion.sql — Add HLE, MMLU, HumanEval columns to composite scores
-- Generated: 2026-04-07
-- ============================================================

ALTER TABLE model_composite_scores ADD COLUMN hle_component REAL DEFAULT 0;
ALTER TABLE model_composite_scores ADD COLUMN mmlu_component REAL DEFAULT 0;
ALTER TABLE model_composite_scores ADD COLUMN humaneval_component REAL DEFAULT 0;
