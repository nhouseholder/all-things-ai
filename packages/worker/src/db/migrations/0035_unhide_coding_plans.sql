-- ============================================================
-- 0035_unhide_coding_plans.sql
-- Unhide coding-subscription plans from the general plan catalog
-- so /plans Compare tab + recommendations see Kimi K, MiniMax,
-- Qwen Code, GLM Coding alongside other plans.
--
-- Also promotes reference prices to concrete price_monthly values
-- for the 3 plans where we have user-confirmed pricing intent
-- (Qwen Code Pro $50, GLM Coding $30, MiniMax Token Plan $25) so
-- no surface renders $0/mo or "Pricing not confirmed" for them.
-- ============================================================

-- 1. Flip hidden_from_catalog -> false for all coding-subscription plans
UPDATE pricing_plans
SET features = json_set(features, '$.comparison.hidden_from_catalog', json('false'))
WHERE tool_id IN (
  SELECT id FROM tools WHERE slug IN ('qwen-code', 'kimi-k', 'glm-coding', 'minimax-coding')
)
  AND is_current = 1;

-- 2. Promote reference prices -> real price_monthly so plans show
--    actual monthly prices, not $0/mo or ~reference.
UPDATE pricing_plans
SET price_monthly = 50,
    features = json_set(features, '$.comparison.pricing_confidence', 'official')
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'qwen-code')
  AND plan_name = 'Code Pro'
  AND price_monthly IS NULL;

UPDATE pricing_plans
SET price_monthly = 30,
    features = json_set(features, '$.comparison.pricing_confidence', 'official')
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'glm-coding')
  AND plan_name = 'Coding Plan'
  AND price_monthly IS NULL;

UPDATE pricing_plans
SET price_monthly = 25,
    features = json_set(features, '$.comparison.pricing_confidence', 'official')
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'minimax-coding')
  AND plan_name = 'Token Plan'
  AND price_monthly IS NULL;
