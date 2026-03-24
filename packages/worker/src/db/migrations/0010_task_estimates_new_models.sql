-- Migration 0010: Task Estimates for New Models
-- Adds model_task_estimates for all models added in 0006/0007/0009
-- that were missing task cost data, preventing them from appearing in Bang for Buck.
--
-- Cost methodology:
--   cost_per_task = (avg_input_tokens * input_price + avg_output_tokens * output_price) / 1,000,000
--   time_value    = (avg_minutes / 60) * 75  (at $75/hr developer rate)
--   avg token estimates by task:
--     complex-debugging:      input=25000, output=8000
--     feature-implementation: input=18000, output=6000
--     boilerplate-scaffolding:input=8000,  output=5000
--     quick-fixes:            input=5000,  output=2000
--     multi-file-refactor:    input=30000, output=10000
--     code-review:            input=12000, output=4000
--     learning-exploring:     input=8000,  output=3000

-- ============================================================
-- 1. GROK 4 — xAI ($3.00/MTok in, $15.00/MTok out)
--    Strong frontier model. High autonomy. Premium pricing.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.82
    WHEN 'feature-implementation' THEN 0.85
    WHEN 'boilerplate-scaffolding'THEN 0.92
    WHEN 'quick-fixes'            THEN 0.95
    WHEN 'multi-file-refactor'    THEN 0.78
    WHEN 'code-review'            THEN 0.88
    WHEN 'learning-exploring'     THEN 0.90
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 1.4
    WHEN 'feature-implementation' THEN 1.2
    WHEN 'boilerplate-scaffolding'THEN 1.1
    WHEN 'quick-fixes'            THEN 1.0
    WHEN 'multi-file-refactor'    THEN 1.6
    WHEN 'code-review'            THEN 1.2
    WHEN 'learning-exploring'     THEN 1.1
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 12.0
    WHEN 'feature-implementation' THEN 9.0
    WHEN 'boilerplate-scaffolding'THEN 5.0
    WHEN 'quick-fixes'            THEN 3.0
    WHEN 'multi-file-refactor'    THEN 18.0
    WHEN 'code-review'            THEN 7.0
    WHEN 'learning-exploring'     THEN 5.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'low'
    WHEN 'feature-implementation' THEN 'low'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'low'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 87
    WHEN 'feature-implementation' THEN 88
    WHEN 'boilerplate-scaffolding'THEN 92
    WHEN 'quick-fixes'            THEN 94
    WHEN 'multi-file-refactor'    THEN 83
    WHEN 'code-review'            THEN 89
    WHEN 'learning-exploring'     THEN 90
  END,
  -- cost: input*3.00 + output*15.00 per MTok
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*3.00 + 8000*15.00)/1000000.0, 3)   -- 0.195
    WHEN 'feature-implementation' THEN ROUND((18000*3.00 + 6000*15.00)/1000000.0, 3)   -- 0.144
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*3.00  + 5000*15.00)/1000000.0, 3)   -- 0.099
    WHEN 'quick-fixes'            THEN ROUND((5000*3.00  + 2000*15.00)/1000000.0, 3)   -- 0.045
    WHEN 'multi-file-refactor'    THEN ROUND((30000*3.00 + 10000*15.00)/1000000.0, 3)  -- 0.240
    WHEN 'code-review'            THEN ROUND((12000*3.00 + 4000*15.00)/1000000.0, 3)   -- 0.096
    WHEN 'learning-exploring'     THEN ROUND((8000*3.00  + 3000*15.00)/1000000.0, 3)   -- 0.069
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(12.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(9.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(5.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(3.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(18.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(7.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(5.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'grok-4';

-- ============================================================
-- 2. GROK 3 — xAI ($0.30/MTok in, $0.90/MTok out)
--    Fast and cheap. Solid coding quality.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.60
    WHEN 'feature-implementation' THEN 0.68
    WHEN 'boilerplate-scaffolding'THEN 0.80
    WHEN 'quick-fixes'            THEN 0.85
    WHEN 'multi-file-refactor'    THEN 0.55
    WHEN 'code-review'            THEN 0.72
    WHEN 'learning-exploring'     THEN 0.78
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 2.8
    WHEN 'feature-implementation' THEN 2.2
    WHEN 'boilerplate-scaffolding'THEN 1.5
    WHEN 'quick-fixes'            THEN 1.2
    WHEN 'multi-file-refactor'    THEN 3.2
    WHEN 'code-review'            THEN 1.8
    WHEN 'learning-exploring'     THEN 1.5
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 22.0
    WHEN 'feature-implementation' THEN 16.0
    WHEN 'boilerplate-scaffolding'THEN 8.0
    WHEN 'quick-fixes'            THEN 5.0
    WHEN 'multi-file-refactor'    THEN 30.0
    WHEN 'code-review'            THEN 12.0
    WHEN 'learning-exploring'     THEN 8.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 65
    WHEN 'feature-implementation' THEN 72
    WHEN 'boilerplate-scaffolding'THEN 80
    WHEN 'quick-fixes'            THEN 84
    WHEN 'multi-file-refactor'    THEN 60
    WHEN 'code-review'            THEN 74
    WHEN 'learning-exploring'     THEN 78
  END,
  -- cost: input*0.30 + output*0.90 per MTok
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.30 + 8000*0.90)/1000000.0, 3)
    WHEN 'feature-implementation' THEN ROUND((18000*0.30 + 6000*0.90)/1000000.0, 3)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.30  + 5000*0.90)/1000000.0, 3)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.30  + 2000*0.90)/1000000.0, 3)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.30 + 10000*0.90)/1000000.0, 3)
    WHEN 'code-review'            THEN ROUND((12000*0.30 + 4000*0.90)/1000000.0, 3)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.30  + 3000*0.90)/1000000.0, 3)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(22.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(16.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(8.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(5.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(30.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(12.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(8.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'grok-3';

-- ============================================================
-- 3. MINIMAX M2.5 — ($0.15/MTok in, $0.60/MTok out)
--    Top SWE-bench score at ultra-low cost. S-tier value.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.78
    WHEN 'feature-implementation' THEN 0.82
    WHEN 'boilerplate-scaffolding'THEN 0.90
    WHEN 'quick-fixes'            THEN 0.92
    WHEN 'multi-file-refactor'    THEN 0.74
    WHEN 'code-review'            THEN 0.84
    WHEN 'learning-exploring'     THEN 0.86
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 1.6
    WHEN 'feature-implementation' THEN 1.4
    WHEN 'boilerplate-scaffolding'THEN 1.1
    WHEN 'quick-fixes'            THEN 1.0
    WHEN 'multi-file-refactor'    THEN 1.8
    WHEN 'code-review'            THEN 1.3
    WHEN 'learning-exploring'     THEN 1.2
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 14.0
    WHEN 'feature-implementation' THEN 10.0
    WHEN 'boilerplate-scaffolding'THEN 6.0
    WHEN 'quick-fixes'            THEN 4.0
    WHEN 'multi-file-refactor'    THEN 20.0
    WHEN 'code-review'            THEN 8.0
    WHEN 'learning-exploring'     THEN 6.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'low'
    WHEN 'feature-implementation' THEN 'low'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 82
    WHEN 'feature-implementation' THEN 85
    WHEN 'boilerplate-scaffolding'THEN 90
    WHEN 'quick-fixes'            THEN 92
    WHEN 'multi-file-refactor'    THEN 78
    WHEN 'code-review'            THEN 86
    WHEN 'learning-exploring'     THEN 87
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.15 + 8000*0.60)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.15 + 6000*0.60)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.15  + 5000*0.60)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.15  + 2000*0.60)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.15 + 10000*0.60)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.15 + 4000*0.60)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.15  + 3000*0.60)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(14.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(10.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(6.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(4.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(20.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(8.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(6.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'minimax-m2.5';

-- ============================================================
-- 4. KIMI K2.5 — Moonshot AI ($0.80/MTok in, $3.20/MTok out)
--    Strong agentic coding. Good value mid-tier.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.70
    WHEN 'feature-implementation' THEN 0.76
    WHEN 'boilerplate-scaffolding'THEN 0.86
    WHEN 'quick-fixes'            THEN 0.90
    WHEN 'multi-file-refactor'    THEN 0.66
    WHEN 'code-review'            THEN 0.78
    WHEN 'learning-exploring'     THEN 0.82
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 2.0
    WHEN 'feature-implementation' THEN 1.7
    WHEN 'boilerplate-scaffolding'THEN 1.2
    WHEN 'quick-fixes'            THEN 1.1
    WHEN 'multi-file-refactor'    THEN 2.4
    WHEN 'code-review'            THEN 1.5
    WHEN 'learning-exploring'     THEN 1.3
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 18.0
    WHEN 'feature-implementation' THEN 13.0
    WHEN 'boilerplate-scaffolding'THEN 7.0
    WHEN 'quick-fixes'            THEN 4.0
    WHEN 'multi-file-refactor'    THEN 25.0
    WHEN 'code-review'            THEN 10.0
    WHEN 'learning-exploring'     THEN 7.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'low'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 74
    WHEN 'feature-implementation' THEN 78
    WHEN 'boilerplate-scaffolding'THEN 86
    WHEN 'quick-fixes'            THEN 90
    WHEN 'multi-file-refactor'    THEN 70
    WHEN 'code-review'            THEN 80
    WHEN 'learning-exploring'     THEN 83
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.80 + 8000*3.20)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.80 + 6000*3.20)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.80  + 5000*3.20)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.80  + 2000*3.20)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.80 + 10000*3.20)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.80 + 4000*3.20)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.80  + 3000*3.20)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(18.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(13.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(7.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(4.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(25.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(10.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(7.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'kimi-k2.5';

-- ============================================================
-- 5. KIMI K2 — Moonshot AI ($0.60/MTok in, $2.40/MTok out)
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.62
    WHEN 'feature-implementation' THEN 0.70
    WHEN 'boilerplate-scaffolding'THEN 0.82
    WHEN 'quick-fixes'            THEN 0.86
    WHEN 'multi-file-refactor'    THEN 0.58
    WHEN 'code-review'            THEN 0.72
    WHEN 'learning-exploring'     THEN 0.76
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 2.4
    WHEN 'feature-implementation' THEN 2.0
    WHEN 'boilerplate-scaffolding'THEN 1.4
    WHEN 'quick-fixes'            THEN 1.2
    WHEN 'multi-file-refactor'    THEN 2.8
    WHEN 'code-review'            THEN 1.6
    WHEN 'learning-exploring'     THEN 1.4
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 20.0
    WHEN 'feature-implementation' THEN 15.0
    WHEN 'boilerplate-scaffolding'THEN 8.0
    WHEN 'quick-fixes'            THEN 5.0
    WHEN 'multi-file-refactor'    THEN 28.0
    WHEN 'code-review'            THEN 11.0
    WHEN 'learning-exploring'     THEN 8.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 66
    WHEN 'feature-implementation' THEN 72
    WHEN 'boilerplate-scaffolding'THEN 82
    WHEN 'quick-fixes'            THEN 86
    WHEN 'multi-file-refactor'    THEN 62
    WHEN 'code-review'            THEN 74
    WHEN 'learning-exploring'     THEN 77
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.60 + 8000*2.40)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.60 + 6000*2.40)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.60  + 5000*2.40)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.60  + 2000*2.40)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.60 + 10000*2.40)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.60 + 4000*2.40)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.60  + 3000*2.40)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(20.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(15.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(8.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(5.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(28.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(11.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(8.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'kimi-k2';

-- ============================================================
-- 6. Z AI GLM-5 PLUS — ($0.10/MTok in, $0.40/MTok out)
--    Near-free pricing. Solid quality.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.52
    WHEN 'feature-implementation' THEN 0.60
    WHEN 'boilerplate-scaffolding'THEN 0.74
    WHEN 'quick-fixes'            THEN 0.80
    WHEN 'multi-file-refactor'    THEN 0.48
    WHEN 'code-review'            THEN 0.65
    WHEN 'learning-exploring'     THEN 0.72
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 3.5
    WHEN 'feature-implementation' THEN 2.8
    WHEN 'boilerplate-scaffolding'THEN 1.8
    WHEN 'quick-fixes'            THEN 1.4
    WHEN 'multi-file-refactor'    THEN 4.0
    WHEN 'code-review'            THEN 2.2
    WHEN 'learning-exploring'     THEN 1.8
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 28.0
    WHEN 'feature-implementation' THEN 20.0
    WHEN 'boilerplate-scaffolding'THEN 10.0
    WHEN 'quick-fixes'            THEN 6.0
    WHEN 'multi-file-refactor'    THEN 38.0
    WHEN 'code-review'            THEN 14.0
    WHEN 'learning-exploring'     THEN 10.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'high'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'medium'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'high'
    WHEN 'code-review'            THEN 'medium'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 52
    WHEN 'feature-implementation' THEN 60
    WHEN 'boilerplate-scaffolding'THEN 72
    WHEN 'quick-fixes'            THEN 79
    WHEN 'multi-file-refactor'    THEN 47
    WHEN 'code-review'            THEN 64
    WHEN 'learning-exploring'     THEN 71
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.10 + 8000*0.40)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.10 + 6000*0.40)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.10  + 5000*0.40)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.10  + 2000*0.40)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.10 + 10000*0.40)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.10 + 4000*0.40)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.10  + 3000*0.40)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(28.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(20.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(10.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(6.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(38.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(14.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(10.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'z-ai-glm-5-plus';

-- ============================================================
-- 7. QWEN 3.5 — Alibaba ($0.50/MTok in, $2.00/MTok out)
--    Strong Chinese flagship. Competitive coding.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.65
    WHEN 'feature-implementation' THEN 0.72
    WHEN 'boilerplate-scaffolding'THEN 0.84
    WHEN 'quick-fixes'            THEN 0.88
    WHEN 'multi-file-refactor'    THEN 0.60
    WHEN 'code-review'            THEN 0.74
    WHEN 'learning-exploring'     THEN 0.80
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 2.2
    WHEN 'feature-implementation' THEN 1.8
    WHEN 'boilerplate-scaffolding'THEN 1.3
    WHEN 'quick-fixes'            THEN 1.1
    WHEN 'multi-file-refactor'    THEN 2.6
    WHEN 'code-review'            THEN 1.6
    WHEN 'learning-exploring'     THEN 1.3
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 20.0
    WHEN 'feature-implementation' THEN 14.0
    WHEN 'boilerplate-scaffolding'THEN 7.0
    WHEN 'quick-fixes'            THEN 4.0
    WHEN 'multi-file-refactor'    THEN 28.0
    WHEN 'code-review'            THEN 10.0
    WHEN 'learning-exploring'     THEN 7.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 68
    WHEN 'feature-implementation' THEN 74
    WHEN 'boilerplate-scaffolding'THEN 83
    WHEN 'quick-fixes'            THEN 87
    WHEN 'multi-file-refactor'    THEN 63
    WHEN 'code-review'            THEN 76
    WHEN 'learning-exploring'     THEN 80
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.50 + 8000*2.00)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.50 + 6000*2.00)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.50  + 5000*2.00)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.50  + 2000*2.00)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.50 + 10000*2.00)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.50 + 4000*2.00)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.50  + 3000*2.00)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(20.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(14.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(7.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(4.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(28.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(10.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(7.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'qwen-3.5';

-- ============================================================
-- 8. MISTRAL LARGE 3 — ($2.00/MTok in, $6.00/MTok out)
--    Strong EU model. Good coding, competitive mid-tier.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.62
    WHEN 'feature-implementation' THEN 0.70
    WHEN 'boilerplate-scaffolding'THEN 0.82
    WHEN 'quick-fixes'            THEN 0.87
    WHEN 'multi-file-refactor'    THEN 0.57
    WHEN 'code-review'            THEN 0.72
    WHEN 'learning-exploring'     THEN 0.78
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 2.4
    WHEN 'feature-implementation' THEN 2.0
    WHEN 'boilerplate-scaffolding'THEN 1.4
    WHEN 'quick-fixes'            THEN 1.2
    WHEN 'multi-file-refactor'    THEN 2.8
    WHEN 'code-review'            THEN 1.6
    WHEN 'learning-exploring'     THEN 1.4
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 22.0
    WHEN 'feature-implementation' THEN 16.0
    WHEN 'boilerplate-scaffolding'THEN 8.0
    WHEN 'quick-fixes'            THEN 5.0
    WHEN 'multi-file-refactor'    THEN 30.0
    WHEN 'code-review'            THEN 12.0
    WHEN 'learning-exploring'     THEN 8.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 65
    WHEN 'feature-implementation' THEN 72
    WHEN 'boilerplate-scaffolding'THEN 81
    WHEN 'quick-fixes'            THEN 86
    WHEN 'multi-file-refactor'    THEN 60
    WHEN 'code-review'            THEN 74
    WHEN 'learning-exploring'     THEN 78
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*2.00 + 8000*6.00)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*2.00 + 6000*6.00)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*2.00  + 5000*6.00)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*2.00  + 2000*6.00)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*2.00 + 10000*6.00)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*2.00 + 4000*6.00)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*2.00  + 3000*6.00)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(22.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(16.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(8.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(5.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(30.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(12.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(8.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'mistral-large-3';

-- ============================================================
-- 9. DEEPSEEK V3.2 — ($0.27/MTok in, $1.10/MTok out)
--    Updated DeepSeek flagship. Excellent value.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.70
    WHEN 'feature-implementation' THEN 0.76
    WHEN 'boilerplate-scaffolding'THEN 0.86
    WHEN 'quick-fixes'            THEN 0.90
    WHEN 'multi-file-refactor'    THEN 0.65
    WHEN 'code-review'            THEN 0.76
    WHEN 'learning-exploring'     THEN 0.82
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 2.0
    WHEN 'feature-implementation' THEN 1.6
    WHEN 'boilerplate-scaffolding'THEN 1.2
    WHEN 'quick-fixes'            THEN 1.1
    WHEN 'multi-file-refactor'    THEN 2.4
    WHEN 'code-review'            THEN 1.4
    WHEN 'learning-exploring'     THEN 1.2
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 20.0
    WHEN 'feature-implementation' THEN 14.0
    WHEN 'boilerplate-scaffolding'THEN 7.0
    WHEN 'quick-fixes'            THEN 4.0
    WHEN 'multi-file-refactor'    THEN 26.0
    WHEN 'code-review'            THEN 9.0
    WHEN 'learning-exploring'     THEN 7.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'low'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 72
    WHEN 'feature-implementation' THEN 78
    WHEN 'boilerplate-scaffolding'THEN 86
    WHEN 'quick-fixes'            THEN 90
    WHEN 'multi-file-refactor'    THEN 67
    WHEN 'code-review'            THEN 79
    WHEN 'learning-exploring'     THEN 83
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.27 + 8000*1.10)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.27 + 6000*1.10)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.27  + 5000*1.10)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.27  + 2000*1.10)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.27 + 10000*1.10)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.27 + 4000*1.10)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.27  + 3000*1.10)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(20.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(14.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(7.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(4.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(26.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(9.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(7.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'deepseek-v3.2';

-- ============================================================
-- 10. MINIMAX M1 — ($0.30/MTok in, $1.10/MTok out)
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.52
    WHEN 'feature-implementation' THEN 0.60
    WHEN 'boilerplate-scaffolding'THEN 0.74
    WHEN 'quick-fixes'            THEN 0.80
    WHEN 'multi-file-refactor'    THEN 0.48
    WHEN 'code-review'            THEN 0.64
    WHEN 'learning-exploring'     THEN 0.70
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 3.2
    WHEN 'feature-implementation' THEN 2.5
    WHEN 'boilerplate-scaffolding'THEN 1.6
    WHEN 'quick-fixes'            THEN 1.3
    WHEN 'multi-file-refactor'    THEN 3.8
    WHEN 'code-review'            THEN 2.0
    WHEN 'learning-exploring'     THEN 1.6
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 26.0
    WHEN 'feature-implementation' THEN 19.0
    WHEN 'boilerplate-scaffolding'THEN 10.0
    WHEN 'quick-fixes'            THEN 6.0
    WHEN 'multi-file-refactor'    THEN 36.0
    WHEN 'code-review'            THEN 13.0
    WHEN 'learning-exploring'     THEN 10.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'high'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'medium'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'high'
    WHEN 'code-review'            THEN 'medium'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 53
    WHEN 'feature-implementation' THEN 61
    WHEN 'boilerplate-scaffolding'THEN 73
    WHEN 'quick-fixes'            THEN 79
    WHEN 'multi-file-refactor'    THEN 48
    WHEN 'code-review'            THEN 64
    WHEN 'learning-exploring'     THEN 70
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.30 + 8000*1.10)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.30 + 6000*1.10)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.30  + 5000*1.10)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.30  + 2000*1.10)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.30 + 10000*1.10)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.30 + 4000*1.10)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.30  + 3000*1.10)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(26.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(19.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(10.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(6.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(36.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(13.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(10.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'minimax-m1';

-- ============================================================
-- 11. COMMAND A — Cohere ($2.50/MTok in, $10.00/MTok out)
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.55
    WHEN 'feature-implementation' THEN 0.63
    WHEN 'boilerplate-scaffolding'THEN 0.76
    WHEN 'quick-fixes'            THEN 0.82
    WHEN 'multi-file-refactor'    THEN 0.50
    WHEN 'code-review'            THEN 0.68
    WHEN 'learning-exploring'     THEN 0.74
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 3.0
    WHEN 'feature-implementation' THEN 2.4
    WHEN 'boilerplate-scaffolding'THEN 1.6
    WHEN 'quick-fixes'            THEN 1.3
    WHEN 'multi-file-refactor'    THEN 3.5
    WHEN 'code-review'            THEN 1.9
    WHEN 'learning-exploring'     THEN 1.5
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 24.0
    WHEN 'feature-implementation' THEN 17.0
    WHEN 'boilerplate-scaffolding'THEN 9.0
    WHEN 'quick-fixes'            THEN 5.0
    WHEN 'multi-file-refactor'    THEN 34.0
    WHEN 'code-review'            THEN 12.0
    WHEN 'learning-exploring'     THEN 9.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 56
    WHEN 'feature-implementation' THEN 64
    WHEN 'boilerplate-scaffolding'THEN 75
    WHEN 'quick-fixes'            THEN 81
    WHEN 'multi-file-refactor'    THEN 51
    WHEN 'code-review'            THEN 68
    WHEN 'learning-exploring'     THEN 74
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*2.50 + 8000*10.00)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*2.50 + 6000*10.00)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*2.50  + 5000*10.00)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*2.50  + 2000*10.00)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*2.50 + 10000*10.00)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*2.50 + 4000*10.00)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*2.50  + 3000*10.00)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(24.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(17.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(9.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(5.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(34.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(12.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(9.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'command-a';

-- ============================================================
-- 12. PHI-4 REASONING — Microsoft (Free / $0 self-hosted)
--    Tiny but punchy reasoning model. Free.
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.46
    WHEN 'feature-implementation' THEN 0.55
    WHEN 'boilerplate-scaffolding'THEN 0.70
    WHEN 'quick-fixes'            THEN 0.78
    WHEN 'multi-file-refactor'    THEN 0.42
    WHEN 'code-review'            THEN 0.60
    WHEN 'learning-exploring'     THEN 0.72
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 4.0
    WHEN 'feature-implementation' THEN 3.2
    WHEN 'boilerplate-scaffolding'THEN 2.0
    WHEN 'quick-fixes'            THEN 1.5
    WHEN 'multi-file-refactor'    THEN 4.8
    WHEN 'code-review'            THEN 2.5
    WHEN 'learning-exploring'     THEN 2.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 35.0
    WHEN 'feature-implementation' THEN 25.0
    WHEN 'boilerplate-scaffolding'THEN 12.0
    WHEN 'quick-fixes'            THEN 7.0
    WHEN 'multi-file-refactor'    THEN 48.0
    WHEN 'code-review'            THEN 16.0
    WHEN 'learning-exploring'     THEN 12.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'high'
    WHEN 'feature-implementation' THEN 'high'
    WHEN 'boilerplate-scaffolding'THEN 'medium'
    WHEN 'quick-fixes'            THEN 'medium'
    WHEN 'multi-file-refactor'    THEN 'high'
    WHEN 'code-review'            THEN 'medium'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 45
    WHEN 'feature-implementation' THEN 54
    WHEN 'boilerplate-scaffolding'THEN 68
    WHEN 'quick-fixes'            THEN 76
    WHEN 'multi-file-refactor'    THEN 40
    WHEN 'code-review'            THEN 59
    WHEN 'learning-exploring'     THEN 70
  END,
  0.00, -- Free (self-hosted)
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(35.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(25.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(12.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(7.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(48.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(16.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(12.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'phi-4-reasoning';

-- ============================================================
-- 13. AMAZON NOVA PREMIER — ($2.50/MTok in, $12.50/MTok out)
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.58
    WHEN 'feature-implementation' THEN 0.65
    WHEN 'boilerplate-scaffolding'THEN 0.78
    WHEN 'quick-fixes'            THEN 0.83
    WHEN 'multi-file-refactor'    THEN 0.54
    WHEN 'code-review'            THEN 0.68
    WHEN 'learning-exploring'     THEN 0.74
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 2.8
    WHEN 'feature-implementation' THEN 2.2
    WHEN 'boilerplate-scaffolding'THEN 1.5
    WHEN 'quick-fixes'            THEN 1.2
    WHEN 'multi-file-refactor'    THEN 3.2
    WHEN 'code-review'            THEN 1.8
    WHEN 'learning-exploring'     THEN 1.4
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 23.0
    WHEN 'feature-implementation' THEN 16.0
    WHEN 'boilerplate-scaffolding'THEN 8.0
    WHEN 'quick-fixes'            THEN 5.0
    WHEN 'multi-file-refactor'    THEN 32.0
    WHEN 'code-review'            THEN 11.0
    WHEN 'learning-exploring'     THEN 8.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 60
    WHEN 'feature-implementation' THEN 67
    WHEN 'boilerplate-scaffolding'THEN 77
    WHEN 'quick-fixes'            THEN 83
    WHEN 'multi-file-refactor'    THEN 55
    WHEN 'code-review'            THEN 69
    WHEN 'learning-exploring'     THEN 75
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*2.50 + 8000*12.50)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*2.50 + 6000*12.50)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*2.50  + 5000*12.50)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*2.50  + 2000*12.50)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*2.50 + 10000*12.50)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*2.50 + 4000*12.50)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*2.50  + 3000*12.50)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(23.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(16.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(8.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(5.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(32.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(11.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(8.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'amazon-nova-premier';

-- ============================================================
-- 14. AMAZON NOVA PRO — ($0.80/MTok in, $3.20/MTok out)
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.48
    WHEN 'feature-implementation' THEN 0.56
    WHEN 'boilerplate-scaffolding'THEN 0.70
    WHEN 'quick-fixes'            THEN 0.76
    WHEN 'multi-file-refactor'    THEN 0.44
    WHEN 'code-review'            THEN 0.62
    WHEN 'learning-exploring'     THEN 0.70
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 3.5
    WHEN 'feature-implementation' THEN 2.8
    WHEN 'boilerplate-scaffolding'THEN 1.8
    WHEN 'quick-fixes'            THEN 1.4
    WHEN 'multi-file-refactor'    THEN 4.2
    WHEN 'code-review'            THEN 2.2
    WHEN 'learning-exploring'     THEN 1.8
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 30.0
    WHEN 'feature-implementation' THEN 22.0
    WHEN 'boilerplate-scaffolding'THEN 11.0
    WHEN 'quick-fixes'            THEN 6.0
    WHEN 'multi-file-refactor'    THEN 40.0
    WHEN 'code-review'            THEN 14.0
    WHEN 'learning-exploring'     THEN 11.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'high'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'medium'
    WHEN 'quick-fixes'            THEN 'medium'
    WHEN 'multi-file-refactor'    THEN 'high'
    WHEN 'code-review'            THEN 'medium'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 48
    WHEN 'feature-implementation' THEN 56
    WHEN 'boilerplate-scaffolding'THEN 69
    WHEN 'quick-fixes'            THEN 75
    WHEN 'multi-file-refactor'    THEN 43
    WHEN 'code-review'            THEN 62
    WHEN 'learning-exploring'     THEN 69
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.80 + 8000*3.20)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.80 + 6000*3.20)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.80  + 5000*3.20)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.80  + 2000*3.20)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.80 + 10000*3.20)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.80 + 4000*3.20)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.80  + 3000*3.20)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(30.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(22.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(11.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(6.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(40.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(14.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(11.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'amazon-nova-pro';

-- ============================================================
-- 15. DOUBAO PRO — ByteDance ($0.40/MTok in, $1.60/MTok out)
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.50
    WHEN 'feature-implementation' THEN 0.58
    WHEN 'boilerplate-scaffolding'THEN 0.72
    WHEN 'quick-fixes'            THEN 0.78
    WHEN 'multi-file-refactor'    THEN 0.46
    WHEN 'code-review'            THEN 0.62
    WHEN 'learning-exploring'     THEN 0.70
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 3.3
    WHEN 'feature-implementation' THEN 2.6
    WHEN 'boilerplate-scaffolding'THEN 1.7
    WHEN 'quick-fixes'            THEN 1.3
    WHEN 'multi-file-refactor'    THEN 3.9
    WHEN 'code-review'            THEN 2.1
    WHEN 'learning-exploring'     THEN 1.6
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 27.0
    WHEN 'feature-implementation' THEN 19.0
    WHEN 'boilerplate-scaffolding'THEN 10.0
    WHEN 'quick-fixes'            THEN 6.0
    WHEN 'multi-file-refactor'    THEN 37.0
    WHEN 'code-review'            THEN 13.0
    WHEN 'learning-exploring'     THEN 10.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'high'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'medium'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'high'
    WHEN 'code-review'            THEN 'medium'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 51
    WHEN 'feature-implementation' THEN 59
    WHEN 'boilerplate-scaffolding'THEN 71
    WHEN 'quick-fixes'            THEN 77
    WHEN 'multi-file-refactor'    THEN 46
    WHEN 'code-review'            THEN 63
    WHEN 'learning-exploring'     THEN 70
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.40 + 8000*1.60)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.40 + 6000*1.60)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.40  + 5000*1.60)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.40  + 2000*1.60)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.40 + 10000*1.60)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.40 + 4000*1.60)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.40  + 3000*1.60)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(27.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(19.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(10.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(6.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(37.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(13.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(10.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'doubao-pro';

-- ============================================================
-- 16. QWEN 3 235B — Alibaba ($0.30/MTok in, $1.20/MTok out)
-- ============================================================
INSERT OR IGNORE INTO model_task_estimates
  (model_id, task_profile_id, first_attempt_success_rate, avg_messages_to_complete,
   avg_minutes_to_complete, steering_effort, autonomy_score,
   cost_per_task_estimate, time_value_per_task, data_source)
SELECT m.id, tp.id,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 0.60
    WHEN 'feature-implementation' THEN 0.68
    WHEN 'boilerplate-scaffolding'THEN 0.80
    WHEN 'quick-fixes'            THEN 0.85
    WHEN 'multi-file-refactor'    THEN 0.56
    WHEN 'code-review'            THEN 0.70
    WHEN 'learning-exploring'     THEN 0.76
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 2.6
    WHEN 'feature-implementation' THEN 2.1
    WHEN 'boilerplate-scaffolding'THEN 1.4
    WHEN 'quick-fixes'            THEN 1.2
    WHEN 'multi-file-refactor'    THEN 3.0
    WHEN 'code-review'            THEN 1.7
    WHEN 'learning-exploring'     THEN 1.4
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 22.0
    WHEN 'feature-implementation' THEN 16.0
    WHEN 'boilerplate-scaffolding'THEN 8.0
    WHEN 'quick-fixes'            THEN 5.0
    WHEN 'multi-file-refactor'    THEN 30.0
    WHEN 'code-review'            THEN 11.0
    WHEN 'learning-exploring'     THEN 8.0
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 'medium'
    WHEN 'feature-implementation' THEN 'medium'
    WHEN 'boilerplate-scaffolding'THEN 'low'
    WHEN 'quick-fixes'            THEN 'low'
    WHEN 'multi-file-refactor'    THEN 'medium'
    WHEN 'code-review'            THEN 'low'
    WHEN 'learning-exploring'     THEN 'low'
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN 62
    WHEN 'feature-implementation' THEN 70
    WHEN 'boilerplate-scaffolding'THEN 79
    WHEN 'quick-fixes'            THEN 84
    WHEN 'multi-file-refactor'    THEN 57
    WHEN 'code-review'            THEN 72
    WHEN 'learning-exploring'     THEN 76
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND((25000*0.30 + 8000*1.20)/1000000.0, 4)
    WHEN 'feature-implementation' THEN ROUND((18000*0.30 + 6000*1.20)/1000000.0, 4)
    WHEN 'boilerplate-scaffolding'THEN ROUND((8000*0.30  + 5000*1.20)/1000000.0, 4)
    WHEN 'quick-fixes'            THEN ROUND((5000*0.30  + 2000*1.20)/1000000.0, 4)
    WHEN 'multi-file-refactor'    THEN ROUND((30000*0.30 + 10000*1.20)/1000000.0, 4)
    WHEN 'code-review'            THEN ROUND((12000*0.30 + 4000*1.20)/1000000.0, 4)
    WHEN 'learning-exploring'     THEN ROUND((8000*0.30  + 3000*1.20)/1000000.0, 4)
  END,
  CASE tp.slug
    WHEN 'complex-debugging'      THEN ROUND(22.0/60*75, 2)
    WHEN 'feature-implementation' THEN ROUND(16.0/60*75, 2)
    WHEN 'boilerplate-scaffolding'THEN ROUND(8.0/60*75, 2)
    WHEN 'quick-fixes'            THEN ROUND(5.0/60*75, 2)
    WHEN 'multi-file-refactor'    THEN ROUND(30.0/60*75, 2)
    WHEN 'code-review'            THEN ROUND(11.0/60*75, 2)
    WHEN 'learning-exploring'     THEN ROUND(8.0/60*75, 2)
  END,
  'estimated'
FROM models m, task_profiles tp
WHERE m.slug = 'qwen-3-235b';
