-- ============================================================
-- 0014_cost_notes_all_tools.sql
-- Add per-model cost_notes to every model_availability row,
-- add Claude Opus 4.5 to Antigravity, and populate Antigravity
-- overage data.
-- Generated: 2026-03-24
-- ============================================================

-- ============================================================
-- 1. AIDER — BYOK, direct API rates, no markup
-- ============================================================
UPDATE model_availability SET cost_notes = 'BYOK: $1/M input, $5/M output (Anthropic direct). Aider itself is free.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $3/M input, $15/M output (Anthropic direct). Aider itself is free.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $5/M input, $25/M output (Anthropic direct). Identical price to Opus 4.6. Aider itself is free.'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $0.28/M input, $0.42/M output (DeepSeek API). Most popular budget model for Aider users.'
WHERE model_id = 26 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $0.5/M input, $2.18/M output (DeepSeek API).'
WHERE model_id = 27 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $0.75/M input, $4.5/M output (OpenAI direct).'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $2.5/M input, $15/M output (OpenAI direct). Thinking tokens billed at output rate.'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $10/M input, $40/M output (OpenAI direct). Premium reasoning; expensive for long sessions.'
WHERE model_id = 18 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $0.5/M input, $3/M output (Google direct).'
WHERE model_id = 23 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $2/M input, $12/M output (Google direct).'
WHERE model_id = 21 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $0.19/M input, $0.49/M output (via Groq/Together/Fireworks). Free tiers available.'
WHERE model_id = 29 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $2/M input, $7/M output (Mistral API).'
WHERE model_id = 30 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: $0.5/M input, $1.5/M output (Alibaba Cloud API).'
WHERE model_id = 33 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

UPDATE model_availability SET cost_notes = 'BYOK: free via Z AI GLM-5 API (Zhipu AI). No token cost currently.'
WHERE model_id = 45 AND tool_id = (SELECT id FROM tools WHERE slug='aider');

-- ============================================================
-- 2. ROO CODE — BYOK, same as Aider
-- ============================================================
UPDATE model_availability SET cost_notes = 'BYOK: $1/M input, $5/M output (Anthropic direct).'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $3/M input, $15/M output (Anthropic direct).'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $5/M input, $25/M output (Anthropic direct).'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $5/M input, $25/M output (Anthropic direct). Same price as Opus 4.6.'
WHERE model_id = 40 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $0.28/M input, $0.42/M output (DeepSeek API). Top budget pick.'
WHERE model_id = 26 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $0.5/M input, $2.18/M output (DeepSeek API).'
WHERE model_id = 27 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $0.75/M input, $4.5/M output (OpenAI direct).'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $2.5/M input, $15/M output (OpenAI direct).'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $2/M input, $12/M output (Google direct).'
WHERE model_id = 21 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $2/M input, $12/M output (Google direct).'
WHERE model_id = 22 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $0.19/M input, $0.49/M output.'
WHERE model_id = 29 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

UPDATE model_availability SET cost_notes = 'BYOK: $3/M input, $15/M output (xAI API).'
WHERE model_id = 35 AND tool_id = (SELECT id FROM tools WHERE slug='roo-code');

-- ============================================================
-- 3. AMAZON Q DEVELOPER — flat subscription, models included
-- ============================================================
UPDATE model_availability SET cost_notes = 'Included in free tier. Nova Pro: $0.80/M input, $3.20/M output (AWS Bedrock list). No extra charge in Q Free.'
WHERE model_id = 65 AND tool_id = (SELECT id FROM tools WHERE slug='amazon-q') AND plan_id = 32;

UPDATE model_availability SET cost_notes = 'Included in Pro ($19/mo). Nova Pro: $0.80/M input, $3.20/M output list. Your subscription covers usage within Q.'
WHERE model_id = 65 AND tool_id = (SELECT id FROM tools WHERE slug='amazon-q') AND plan_id = 33;

UPDATE model_availability SET cost_notes = 'Included in Pro ($19/mo). Nova Premier: $2.50/M input, $12.50/M output list. For complex Q code tasks.'
WHERE model_id = 66 AND tool_id = (SELECT id FROM tools WHERE slug='amazon-q') AND plan_id = 33;

-- ============================================================
-- 4. AUGMENT CODE — credit-based (~$0.000625/credit)
-- Rough estimates: Haiku = ~300cr, Sonnet = ~800cr, Opus = ~2500cr per complex task
-- ============================================================
UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). Haiku: ~300 credits for simple task ($0.19). Lightweight model for quick edits.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 26;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). Haiku: ~300 credits for simple task ($0.19). Low-cost model on Indie plan.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 27;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). Sonnet: ~800 credits for typical task ($0.50). Main workhorse on Indie.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 27;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). Sonnet: ~800 credits for typical task ($0.50).'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 28;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). Opus 4.6: ~2500 credits for complex task ($1.56). Heavy tasks only.'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 28;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). GPT-5.4 Mini: ~400 credits for typical task ($0.25). Budget option.'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 26;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). GPT-5.4 Mini: ~400 credits for typical task ($0.25).'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 27;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). GPT-5.4 Medium Thinking: ~1200 credits for complex task ($0.75). Reasoning model.'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 27;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). GPT-5.4 Medium Thinking: ~1200 credits for complex task ($0.75).'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 28;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). GPT-5.4 High Thinking: ~2000 credits for complex task ($1.25).'
WHERE model_id = 38 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 28;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). Gemini 3 Pro: ~900 credits for typical task ($0.56). Multimodal support.'
WHERE model_id = 22 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 27;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). Gemini 3.1 Pro Preview: ~900 credits for typical task ($0.56).'
WHERE model_id = 21 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 28;

UPDATE model_availability SET cost_notes = 'Credit-based (~$0.000625/credit). DeepSeek V3.2: ~200 credits for typical task ($0.13). Excellent value.'
WHERE model_id = 26 AND tool_id = (SELECT id FROM tools WHERE slug='augment-code') AND plan_id = 28;

-- ============================================================
-- 5. CLAUDE CODE — flat subscription, no per-token billing
-- ============================================================
UPDATE model_availability SET cost_notes = 'Included in flat subscription ($20/mo). No per-token billing. Rate-throttled at high usage. Primary model on Pro.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_id = 11;

UPDATE model_availability SET cost_notes = 'Included in flat subscription ($20/mo). Lighter model for quick completions. No extra charge.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_id = 11;

UPDATE model_availability SET cost_notes = 'Included in Max 5x ($100/mo). Opus 4.6 is the primary model at Max tiers. No per-token billing ever.'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_id = 12;

UPDATE model_availability SET cost_notes = 'Included in Max 5x ($100/mo). Sonnet available as fallback. No per-token billing.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_id = 12;

UPDATE model_availability SET cost_notes = 'Included in Max 5x ($100/mo). Haiku for lightweight tasks. No per-token billing.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_id = 12;

UPDATE model_availability SET cost_notes = 'Included in Max 20x ($200/mo). No per-token billing. 20x rate limit vs Pro for extreme parallel workloads.'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_id = 13;

UPDATE model_availability SET cost_notes = 'Included in Max 20x ($200/mo). No per-token billing.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_id = 13;

UPDATE model_availability SET cost_notes = 'Included in Max 20x ($200/mo). No per-token billing.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='claude-code') AND plan_id = 13;

-- ============================================================
-- 6. CODEX — ChatGPT subscription-gated
-- ============================================================
UPDATE model_availability SET cost_notes = 'Requires ChatGPT Plus ($20/mo). Codex Mini: $1.50/M input, $6/M output list. Task limits not published.'
WHERE model_id = 20 AND tool_id = (SELECT id FROM tools WHERE slug='codex') AND plan_id = 24;

UPDATE model_availability SET cost_notes = 'Requires ChatGPT Pro ($200/mo). Codex Mini: $1.50/M input, $6/M output list. Pro = "unlimited" (soft throttled).'
WHERE model_id = 20 AND tool_id = (SELECT id FROM tools WHERE slug='codex') AND plan_id = 25;

UPDATE model_availability SET cost_notes = 'Requires ChatGPT Pro ($200/mo). GPT-5.3 Codex: $1.75/M input, $14/M output. Full reasoning model for complex agent tasks.'
WHERE model_id = 41 AND tool_id = (SELECT id FROM tools WHERE slug='codex') AND plan_id = 25;

-- ============================================================
-- 7. GITHUB COPILOT — premium request multiplier system
-- Pro=300 reqs/mo, Pro+=1500 reqs/mo, Business=300/user, Enterprise=1000/user
-- ============================================================
-- GPT-5.4 Mini = 0.33x (free, included)
UPDATE model_availability SET cost_notes = '0.33x multiplier = effectively free. 300 Pro reqs = ~900 GPT-5.4 Mini uses. Never hits limit for typical use.'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 20;

UPDATE model_availability SET cost_notes = '0.33x multiplier = effectively free. 1,500 Pro+ reqs = ~4,500 GPT-5.4 Mini uses.'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 21;

-- Claude Sonnet 4.6 = 1x
UPDATE model_availability SET cost_notes = '1x multiplier. 300 Pro reqs = 300 Sonnet uses/mo. At ~$0.04/overage req, heavy users pay ~$0.04/extra use.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 20;

UPDATE model_availability SET cost_notes = '1x multiplier. 1,500 Pro+ reqs = 1,500 Sonnet uses/mo. Overage ~$0.04/req after limit.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 21;

UPDATE model_availability SET cost_notes = '1x multiplier. 300 Business reqs/user/mo. Admin controls overage policy.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 22;

UPDATE model_availability SET cost_notes = '1x multiplier. 1,000 Enterprise reqs/user/mo. Admin controls overage policy.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 23;

-- Claude Haiku 4.5 = 0.33x
UPDATE model_availability SET cost_notes = '0.33x multiplier. 300 Pro reqs = ~900 Haiku uses. Cheapest Anthropic model on Copilot.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 20;

UPDATE model_availability SET cost_notes = '0.33x multiplier. 1,500 Pro+ reqs = ~4,500 Haiku uses. Very cost-effective.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 21;

-- Claude Opus 4.6 = 3x
UPDATE model_availability SET cost_notes = '3x multiplier. 300 Pro reqs = 100 Opus uses/mo. Overage ~$0.12/req (3x $0.04 est). Use sparingly.'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 20;

UPDATE model_availability SET cost_notes = '3x multiplier. 1,500 Pro+ reqs = 500 Opus uses/mo. Overage ~$0.12/req after limit.'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 21;

-- GPT-5.4 Medium Thinking = 1x
UPDATE model_availability SET cost_notes = '1x multiplier. 300 Pro reqs = 300 uses. Same request weight as Sonnet.'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 20;

UPDATE model_availability SET cost_notes = '1x multiplier. 1,500 Pro+ reqs = 1,500 uses.'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 21;

-- Gemini models on Copilot = 1x estimated
UPDATE model_availability SET cost_notes = '~1x multiplier (estimated). 300 Pro reqs = ~300 Gemini uses. Google model via Copilot.'
WHERE model_id = 21 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 20;

UPDATE model_availability SET cost_notes = '~1x multiplier (estimated). 1,500 Pro+ reqs = ~1,500 Gemini uses.'
WHERE model_id = 21 AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot') AND plan_id = 21;

-- ============================================================
-- 8. GEMINI CODE ASSIST — Google subscription
-- ============================================================
UPDATE model_availability SET cost_notes = 'Included free (Individual plan). Gemini 3.1 Pro: $2/M input, $12/M output list. Free tier has usage limits.'
WHERE model_id = 21 AND tool_id = (SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_id = 45;

UPDATE model_availability SET cost_notes = 'Included in Standard ($19/mo). Gemini 3.1 Pro: $2/M input, $12/M output list. Subscription covers usage within quota.'
WHERE model_id = 21 AND tool_id = (SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_id = 46;

UPDATE model_availability SET cost_notes = 'Included in Standard ($19/mo). Gemini 3 Flash: $0.50/M input, $3/M output list. Fastest model for autocomplete.'
WHERE model_id = 23 AND tool_id = (SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_id = 46;

UPDATE model_availability SET cost_notes = 'Included in Standard ($19/mo). Gemini 3 Pro: $2/M input, $12/M output list.'
WHERE model_id = 22 AND tool_id = (SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_id = 46;

-- ============================================================
-- 9. JETBRAINS AI — subscription-based
-- ============================================================
UPDATE model_availability SET cost_notes = 'Included in AI Pro ($10/mo). Claude Sonnet: $3/M input, $15/M output list. JetBrains subscription covers usage.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='jetbrains-ai');

UPDATE model_availability SET cost_notes = 'Included in AI Pro ($10/mo). Claude Haiku: $1/M input, $5/M output list. Fast completions.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='jetbrains-ai');

UPDATE model_availability SET cost_notes = 'Included in AI Pro ($10/mo). GPT-5.4 Mini: $0.75/M input, $4.50/M output list.'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='jetbrains-ai');

UPDATE model_availability SET cost_notes = 'Included in AI Ultimate ($30/mo). Opus 4.6: $5/M input, $25/M output list. Subscription covers usage.'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='jetbrains-ai');

UPDATE model_availability SET cost_notes = 'Included in AI Ultimate ($30/mo). GPT-5.4 Medium Thinking: $2.50/M input, $15/M output list.'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='jetbrains-ai');

UPDATE model_availability SET cost_notes = 'Included in AI Ultimate ($30/mo). Gemini 3 Pro: $2/M input, $12/M output list.'
WHERE model_id = 22 AND tool_id = (SELECT id FROM tools WHERE slug='jetbrains-ai');

-- ============================================================
-- 10. TABNINE — subscription-based, proprietary models + Claude
-- ============================================================
UPDATE model_availability SET cost_notes = 'Included in Code Assistant ($39/mo). Claude Sonnet: $3/M input, $15/M output list. Subscription covers usage.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='tabnine');

UPDATE model_availability SET cost_notes = 'Included in Agentic Platform ($59/mo). Claude Opus: $5/M input, $25/M output list. For advanced agentic workflows.'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='tabnine');

UPDATE model_availability SET cost_notes = 'Included in Code Assistant ($39/mo). GPT-5.4 Mini: $0.75/M input, $4.50/M output list.'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='tabnine');

UPDATE model_availability SET cost_notes = 'Included in Code Assistant ($39/mo). Gemini 3 Pro: $2/M input, $12/M output list.'
WHERE model_id = 22 AND tool_id = (SELECT id FROM tools WHERE slug='tabnine');

-- ============================================================
-- 11. ANTIGRAVITY — BYOK or credit-based
-- Site is offline as of Mar 2026 but data preserved for reference.
-- Credits plan: $20/mo, estimated ~$0.002/credit (not publicly confirmed).
-- ============================================================

-- Antigravity overage data
UPDATE pricing_plans SET
  overage_model = 'stopped',
  overage_rate_description = 'Site offline as of Mar 2026. No new signups possible.',
  fallback_behavior = 'Service unavailable',
  usage_notes = 'Antigravity (antigravity.dev) appears defunct as of Mar 2026. Domain returns nginx default page. Pricing data preserved for historical reference only.'
WHERE id = 34;

UPDATE pricing_plans SET
  overage_model = 'stopped',
  overage_rate_description = 'Site offline as of Mar 2026. Credits model no longer available.',
  fallback_behavior = 'Service unavailable',
  usage_notes = 'Antigravity credits plan ($20/mo) no longer accessible. Site offline Mar 2026.'
WHERE id = 35;

-- Antigravity cost_notes
UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $1/M input, $5/M output (Anthropic direct) on free tier.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was credits-based: ~$0.002/credit est. Haiku = cheapest Claude option.'
WHERE model_id = 12 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 35;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $5/M input, $25/M output (Anthropic direct).'
WHERE model_id = 10 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $3/M input, $15/M output (Anthropic direct).'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was credits-based: ~$0.002/credit est. Sonnet = mid-tier option.'
WHERE model_id = 11 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 35;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $0.28/M input, $0.42/M output.'
WHERE model_id = 26 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was credits-based: ~$0.002/credit est. DeepSeek = cheapest option.'
WHERE model_id = 26 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 35;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $0.5/M input, $2.18/M output.'
WHERE model_id = 27 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $0.75/M input, $4.5/M output.'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was credits-based: ~$0.002/credit est.'
WHERE model_id = 16 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 35;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $2.5/M input, $15/M output.'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was credits-based: ~$0.002/credit est.'
WHERE model_id = 15 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 35;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $2/M input, $12/M output.'
WHERE model_id = 21 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $3/M input, $15/M output.'
WHERE model_id = 35 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $0.19/M input, $0.49/M output.'
WHERE model_id = 29 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $2/M input, $7/M output.'
WHERE model_id = 30 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

UPDATE model_availability SET cost_notes = 'OFFLINE: Site defunct Mar 2026. Was BYOK: $0.5/M input, $1.5/M output.'
WHERE model_id = 33 AND tool_id = (SELECT id FROM tools WHERE slug='antigravity') AND plan_id = 34;

-- Add Claude Opus 4.5 to Antigravity (BYOK only — site offline but data preserved)
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, cost_notes)
VALUES (
  40,
  (SELECT id FROM tools WHERE slug='antigravity'),
  34,
  'byok',
  'OFFLINE: Site defunct Mar 2026. Was BYOK: $5/M input, $25/M output (Anthropic direct). Same API price as Opus 4.6.'
);
