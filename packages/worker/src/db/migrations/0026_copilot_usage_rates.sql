-- 0026_copilot_usage_rates.sql
-- Backfill per-model GitHub Copilot premium-request multipliers so the
-- plans page can show actual usage rates per model.
--
-- Primary source:
--   https://docs.github.com/en/copilot/reference/ai-models/supported-models
--   "Model multipliers" section accessed 2026-03-30
--
-- Notes:
--   - GPT-5.4 High is treated as the GPT-5.4 family for Copilot billing.
--   - The local dataset currently maps an xAI slot to grok-4, but GitHub docs
--     publish a multiplier for "Grok Code Fast 1" instead, so that row is left
--     unchanged here rather than guessed.

-- Free
UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 50 Free premium requests = 50 Claude Sonnet 4.6 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Free'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-sonnet-4.6');

UPDATE model_availability
SET credits_per_request = 0.33,
    cost_notes = '0.33x premium request multiplier. 50 Free premium requests = about 151 GPT-5.4 Mini uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Free'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.4-mini');

-- Pro
UPDATE model_availability
SET credits_per_request = 0.33,
    cost_notes = '0.33x premium request multiplier. 300 Pro premium requests = about 909 Claude Haiku 4.5 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-haiku-4.5');

UPDATE model_availability
SET credits_per_request = 3,
    cost_notes = '3x premium request multiplier. 300 Pro premium requests = 100 Claude Opus 4.5 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-opus-4.5');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 300 Pro premium requests = 300 Claude Sonnet 4.6 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-sonnet-4.6');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 300 Pro premium requests = 300 GPT-5.3 Codex uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.3-codex');

UPDATE model_availability
SET credits_per_request = 0.33,
    cost_notes = '0.33x premium request multiplier. 300 Pro premium requests = about 909 GPT-5.4 Mini uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.4-mini');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 300 Pro premium requests = 300 Gemini 2.5 Pro uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gemini-2.5-pro');

-- Pro+
UPDATE model_availability
SET credits_per_request = 3,
    cost_notes = '3x premium request multiplier. 1,500 Pro+ premium requests = 500 Claude Opus 4.5 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro+'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-opus-4.5');

UPDATE model_availability
SET credits_per_request = 3,
    cost_notes = '3x premium request multiplier. 1,500 Pro+ premium requests = 500 Claude Opus 4.6 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro+'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-opus-4.6');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 1,500 Pro+ premium requests = 1,500 Claude Sonnet 4.6 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro+'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-sonnet-4.6');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 1,500 Pro+ premium requests = 1,500 GPT-5.3 Codex uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro+'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.3-codex');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. GitHub publishes GPT-5.4 at 1x on paid plans; this site treats the High Thinking variant as the same billing family.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro+'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.4-high');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 1,500 Pro+ premium requests = 1,500 GPT-5.4 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro+'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.4');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 1,500 Pro+ premium requests = 1,500 Gemini 3.1 Pro uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Pro+'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gemini-3.1-pro');

-- Business
UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 300 Business premium requests per user = 300 Claude Sonnet 4.6 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Business'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-sonnet-4.6');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 300 Business premium requests per user = 300 GPT-5.3 Codex uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Business'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.3-codex');

UPDATE model_availability
SET credits_per_request = 0.33,
    cost_notes = '0.33x premium request multiplier. 300 Business premium requests per user = about 909 GPT-5.4 Mini uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Business'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.4-mini');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 300 Business premium requests per user = 300 Gemini 2.5 Pro uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Business'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gemini-2.5-pro');

-- Enterprise
UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 1,000 Enterprise premium requests per user = 1,000 Claude Sonnet 4.6 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Enterprise'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'claude-sonnet-4.6');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 1,000 Enterprise premium requests per user = 1,000 GPT-5.3 Codex uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Enterprise'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.3-codex');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 1,000 Enterprise premium requests per user = 1,000 GPT-5.4 uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Enterprise'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gpt-5.4');

UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1x premium request multiplier. 1,000 Enterprise premium requests per user = 1,000 Gemini 3.1 Pro uses.'
WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
  AND plan_id = (
    SELECT id FROM pricing_plans
    WHERE tool_id = (SELECT id FROM tools WHERE slug = 'github-copilot')
      AND plan_name = 'Enterprise'
      AND is_current = 1
  )
  AND model_id = (SELECT id FROM models WHERE slug = 'gemini-3.1-pro');
