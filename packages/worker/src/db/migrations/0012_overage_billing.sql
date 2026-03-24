-- ============================================================
-- 0012_overage_billing.sql — Add real overage/extra-usage billing data to pricing_plans
-- Generated: 2026-03-24
-- Sources researched:
--   GitHub Copilot: docs.github.com/en/copilot/managing-copilot/monitoring-usage-and-entitlements/about-premium-requests
--   Cursor: cursor.com/docs/models-and-pricing
--   Windsurf: docs.windsurf.com/windsurf/accounts/quota + windsurf.com/pricing
--   Claude Code: code.claude.com/docs/en/costs
--   Augment Code: augmentcode.com/pricing
-- ============================================================

-- ============================================================
-- 1. ADD OVERAGE COLUMNS TO pricing_plans
-- ============================================================
ALTER TABLE pricing_plans ADD COLUMN included_requests INTEGER;
ALTER TABLE pricing_plans ADD COLUMN overage_model TEXT;
ALTER TABLE pricing_plans ADD COLUMN overage_rate_description TEXT;
ALTER TABLE pricing_plans ADD COLUMN overage_rate_unit TEXT;
ALTER TABLE pricing_plans ADD COLUMN overage_rate_value REAL;
ALTER TABLE pricing_plans ADD COLUMN fallback_behavior TEXT;
ALTER TABLE pricing_plans ADD COLUMN usage_notes TEXT;

-- ============================================================
-- 2. GITHUB COPILOT — Premium request model
-- Request limits: Free=50, Pro=300, Pro+=1500, Business=300/user, Enterprise=1000/user
-- Multipliers: Claude Opus 4.6 = 3x, Claude Sonnet 4.6 = 1x, GPT-5.4 mini = 0.33x
-- Overage: pay-per-request (exact rate not publicly disclosed by GitHub)
-- Fallback: "included" models (GPT-5.4 mini, GPT-4.1) always available at 0x cost
-- ============================================================
UPDATE pricing_plans
SET included_requests = 50,
    overage_model = 'stopped',
    overage_rate_description = 'No overage available. Upgrade required.',
    fallback_behavior = 'Use free/included models (GPT-5.4 mini, GPT-4.1) at no cost',
    usage_notes = 'Premium models like Claude Sonnet = 1 req each. Claude Opus 4.6 = 3 req each. GPT-5.4 mini = 0.33 req each.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_name = 'Free';

UPDATE pricing_plans
SET included_requests = 300,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Pay-per-premium-request after 300/mo. Exact rate not published by GitHub (estimated ~$0.04/req).',
    fallback_behavior = 'Free/included models remain available after limit',
    usage_notes = 'Claude Sonnet = 1 req each. Claude Opus 4.6 = 3 req each. At 1 req = ~$0.04, Opus costs ~$0.12/use after limit.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_name = 'Pro';

UPDATE pricing_plans
SET included_requests = 1500,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Pay-per-premium-request after 1,500/mo. Exact rate not published by GitHub.',
    fallback_behavior = 'Free/included models remain available after limit',
    usage_notes = '1,500 reqs × 1x model = 1,500 Claude Sonnet uses. 1,500 reqs × 0.33 = ~4,500 GPT-5.4 mini uses. Budget overage in GitHub settings.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_name = 'Pro+';

UPDATE pricing_plans
SET included_requests = 300,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Pay-per-premium-request after 300/user/mo. Org admin must enable overage policy.',
    fallback_behavior = 'Free/included models remain available after limit',
    usage_notes = 'Per-seat limit. Org admin controls whether individual seats can incur overage.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_name = 'Business';

UPDATE pricing_plans
SET included_requests = 1000,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Pay-per-premium-request after 1,000/user/mo. Org admin must enable overage policy.',
    fallback_behavior = 'Free/included models remain available after limit',
    usage_notes = 'Per-seat limit. Includes advanced features (fine-tuning, knowledge bases).'
WHERE tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_name = 'Enterprise';

-- ============================================================
-- 3. CURSOR — Dollar-denominated API credit model
-- Plans include: Pro=$20 credits, Pro+=$70 credits, Ultra=$400 credits
-- Overage: pay-as-you-go at exact underlying model API rates (no markup)
-- No slow mode, no throttling — just charged at API price per token
-- ============================================================
UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'stopped',
    overage_rate_description = 'No overage. Upgrade to Pro for paid credits.',
    fallback_behavior = 'Premium model access stops when free credits exhausted',
    usage_notes = 'Free tier includes limited API credits. Exact dollar amount not published.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='cursor') AND plan_name = 'Pro'
  AND price_monthly = 20;

-- Note: Cursor Pro $20/mo includes $20 in API credits, Pro+ $40/mo includes $70 in API credits
UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Pay-as-you-go at exact model API rates. $20 in API credits included.',
    overage_rate_unit = 'per-million-tokens',
    fallback_behavior = 'Continues at API cost — charged to card on file',
    usage_notes = 'Overage at Claude Sonnet 4.6 rate: $3/1M input, $15/1M output. GPT-5.4: $2.50/$15. No markup vs direct API. No throttling.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='cursor') AND plan_name = 'Pro'
  AND price_monthly = 20;

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Pay-as-you-go at exact model API rates. $70 in API credits included.',
    overage_rate_unit = 'per-million-tokens',
    fallback_behavior = 'Continues at API cost — charged to card on file',
    usage_notes = '$40/mo plan includes $70 in credits (1.75x value). Overage at same API rates: Claude Sonnet 4.6 $3/$15 per MTok.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='cursor') AND plan_name = 'Pro+';

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Pay-as-you-go at exact model API rates. $400 in API credits included.',
    overage_rate_unit = 'per-million-tokens',
    fallback_behavior = 'Continues at API cost — charged to card on file',
    usage_notes = '$200/mo plan includes $400 in credits (2x value). Best for heavy daily usage.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='cursor') AND plan_name = 'Ultra';

-- ============================================================
-- 4. WINDSURF — Quota-based (not publicly quantified)
-- Windsurf uses "Light/Standard/Heavy" quotas — exact token amounts not published
-- Overage: pay-per-use at model API list price
-- ============================================================
UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Light quota included (exact amount not published). Overage at model API list price.',
    fallback_behavior = 'Pay-as-you-go continues when quota exhausted',
    usage_notes = 'Windsurf does not disclose exact token quotas. Described only as "Light." Overage at API list price (e.g., Claude Sonnet: $3/$15 per MTok).'
WHERE tool_id = (SELECT id FROM tools WHERE slug='windsurf') AND plan_name = 'Free';

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Standard quota included (exact amount not published). Overage at model API list price.',
    fallback_behavior = 'Pay-as-you-go continues when quota exhausted',
    usage_notes = 'Standard quota covers most developers per Windsurf docs. Overage at API list price. $15/mo grandfathered rate for existing subscribers.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='windsurf') AND plan_name = 'Pro';

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'pay-per-use',
    overage_rate_description = 'Standard quota per seat. Overage at model API list price.',
    fallback_behavior = 'Pay-as-you-go continues when quota exhausted',
    usage_notes = 'Team-level quota pooling not confirmed. $30/user/mo grandfathered rate.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='windsurf') AND plan_name = 'Teams';

-- ============================================================
-- 5. CLAUDE CODE — Flat subscription, rate-limited not overage-billed
-- These are true flat-fee plans — no overage exists
-- Rate limits increase 5x/20x at Max tiers (not billing, just throughput)
-- ============================================================
UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'throttled',
    overage_rate_description = 'No overage billing. Rate-throttled when limits exceeded.',
    fallback_behavior = 'Requests queue/slow. No extra charges ever.',
    usage_notes = 'Truly unlimited usage within rate limits. Average user: ~$6/day API equiv (~$180/mo). Max 5x covers heavy users. /cost shows token usage but does NOT affect billing.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_name = 'Pro';

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'throttled',
    overage_rate_description = 'No overage billing. 5x higher rate limits vs Pro.',
    fallback_behavior = 'Requests queue/slow at very high usage. No extra charges.',
    usage_notes = '5x more throughput than Pro ($20). Good for all-day agentic workflows. No per-token billing.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_name = 'Max 5x';

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'throttled',
    overage_rate_description = 'No overage billing. 20x higher rate limits vs Pro.',
    fallback_behavior = 'Requests queue/slow at extreme usage. No extra charges.',
    usage_notes = '20x more throughput than Pro ($20). For power users running long parallel agentic tasks.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_name = 'Max 20x';

-- ============================================================
-- 6. AUGMENT CODE — Credit-based with auto top-up
-- Plans: Indie=40k credits/$20, Standard=130k credits/$60, Max=450k credits/$200
-- Top-up: $15 per 24,000 credits (~$0.000625/credit). No service interruption.
-- A complex task ≈ 4,300 credits. Simple task ≈ 300 credits.
-- ============================================================
UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'auto-topup',
    overage_rate_description = '$15 per 24,000 credits auto top-up. ~$0.000625/credit. No interruption.',
    overage_rate_unit = 'per-credit',
    overage_rate_value = 0.000625,
    fallback_behavior = 'Auto top-up fires at $15/24k credits. Service never stops.',
    usage_notes = '40,000 credits/mo included. Complex task ≈ 4,300 credits (~$2.69 overage). Simple task ≈ 300 credits. Top-up credits valid 12 months.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_name = 'Indie';

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'auto-topup',
    overage_rate_description = '$15 per 24,000 credits auto top-up. ~$0.000625/credit.',
    overage_rate_unit = 'per-credit',
    overage_rate_value = 0.000625,
    fallback_behavior = 'Auto top-up fires at $15/24k credits. Service never stops.',
    usage_notes = '130,000 credits/mo included. Supports ~30 complex tasks or ~433 simple tasks before overage.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_name = 'Developer';

-- ============================================================
-- 7. CODEX — Limited public data
-- ChatGPT Pro ($200/mo) required. Task limits not publicly documented.
-- ============================================================
UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'throttled',
    overage_rate_description = 'Task limits not publicly documented. Likely soft throttling under "unlimited" Pro claim.',
    fallback_behavior = 'Unknown — OpenAI has not published specifics',
    usage_notes = 'Codex in ChatGPT requires Pro ($200/mo). OpenAI markets Pro as "unlimited" but no specific task/request count published. Likely rate-limited at high volume.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='codex') AND plan_name = 'Pro';

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'stopped',
    overage_rate_description = 'Plus plan Codex access unconfirmed. May be limited or unavailable.',
    fallback_behavior = 'Unknown',
    usage_notes = 'Codex agentic tasks likely require Pro. Plus may have very limited or no Codex access.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='codex') AND plan_name = 'Plus';

-- ============================================================
-- 8. ROO CODE / AIDER — BYOK, no overage (you pay your API provider directly)
-- ============================================================
UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'none',
    overage_rate_description = 'No overage — you pay your API provider directly (Anthropic, OpenAI, etc.).',
    fallback_behavior = 'Usage limited only by your API provider account and keys',
    usage_notes = 'Tool itself is free. Costs come from API calls: Claude Sonnet 4.6 $3/$15 per MTok, GPT-5.4 $2.50/$15, DeepSeek V3.2 $0.28/$0.42. Best value for high-volume users with API access.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE pricing_plans
SET included_requests = NULL,
    overage_model = 'none',
    overage_rate_description = 'No overage — you pay your API provider directly.',
    fallback_behavior = 'Usage limited only by your API provider account and keys',
    usage_notes = 'Open source CLI. Costs from API: DeepSeek V3.2 at $0.28/$0.42 per MTok is most popular for cost-conscious users. No tool subscription cost ever.'
WHERE tool_id = (SELECT id FROM tools WHERE slug='aider');
