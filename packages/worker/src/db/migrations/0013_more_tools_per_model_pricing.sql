-- ============================================================
-- 0013_more_tools_per_model_pricing.sql
-- Generated: 2026-03-24
-- Changes:
--   1. Add credits_per_request column to model_availability
--   2. Add new tools: Zed AI, JetBrains AI, Tabnine, Continue.dev, Gemini Code Assist
--   3. Add pricing plans for new tools
--   4. Update Antigravity description (site currently offline)
--   5. Add Windsurf per-model credit costs (most granular table researched)
--   6. Add Claude Opus 4.5 availability across all platforms that have it
--   7. Add GitHub Copilot multipliers as per-model notes
--   8. Add Zed AI, JetBrains, Tabnine, Continue.dev model availability
-- Sources:
--   Windsurf: docs.windsurf.com/windsurf/models (credits per request confirmed)
--   GitHub Copilot: docs.github.com/en/copilot/.../about-premium-requests
--   Cursor: cursor.com/docs/models-and-pricing
--   Zed AI: zed.dev/docs/ai/models + zed.dev/pricing
--   JetBrains: jetbrains.com/ai-ides/buy/
--   Tabnine: tabnine.com/pricing
--   Continue.dev: continue.dev/pricing
--   Anthropic: platform.claude.com/docs/about-claude/models
-- ============================================================

-- ============================================================
-- 1. ADD credits_per_request TO model_availability
--    Windsurf is the most granular — each model has a specific credit cost per request
-- ============================================================
-- NOTE: credits_per_request, cost_per_request_usd, cost_notes already added in earlier run

-- ============================================================
-- 2. NEW TOOLS
-- ============================================================
INSERT OR IGNORE INTO tools (name, slug, vendor, category, website_url, description) VALUES
('Zed AI', 'zed-ai', 'Zed Industries', 'ide', 'https://zed.dev', 'Fast, collaborative code editor with built-in AI. Supports Claude, GPT, Gemini, DeepSeek via hosted or BYOK.'),
('JetBrains AI', 'jetbrains-ai', 'JetBrains', 'ide-plugin', 'https://www.jetbrains.com/ai/', 'AI coding assistant integrated into all JetBrains IDEs (IntelliJ, PyCharm, WebStorm, etc.). Multi-model via Grazie platform.'),
('Tabnine', 'tabnine', 'Tabnine', 'ide-plugin', 'https://www.tabnine.com', 'Enterprise AI coding assistant. Deep privacy controls, on-premise option, multi-model (Anthropic, OpenAI, Google, Meta, Mistral).'),
('Continue.dev', 'continue-dev', 'Continue', 'ide-plugin', 'https://continue.dev', 'Open-source AI code assistant. VS Code and JetBrains. BYOK or hosted credits. Pay-per-token model.'),
('Gemini Code Assist', 'gemini-code-assist', 'Google', 'ide-plugin', 'https://cloud.google.com/gemini/docs/codeassist', 'Google AI code completion and chat. Powered by Gemini models. Individual free tier, Standard for teams.');

-- ============================================================
-- 3. PRICING PLANS FOR NEW TOOLS
-- ============================================================

-- Zed AI
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included,
  overage_model, overage_rate_description, fallback_behavior, usage_notes) VALUES
((SELECT id FROM tools WHERE slug='zed-ai'), 'Personal', 0,
  '{"features":["2000 edit predictions/month","BYOK for all providers","Zed AI chat with limits"]}',
  '["any-via-api"]',
  'stopped', 'Free predictions exhausted. Upgrade to Pro or use BYOK.',
  'BYOK continues at your API provider cost.',
  'Free tier includes 2,000 Zed AI edit predictions/month. BYOK (Anthropic, OpenAI, Gemini, Bedrock, Deepseek, Ollama) works without limits.'),
((SELECT id FROM tools WHERE slug='zed-ai'), 'Pro', 10,
  '{"features":["$5 hosted tokens/month included","Claude Opus 4.5 and 4.6 access","pay-per-token beyond $5"]}',
  '["claude-opus-4.6","claude-opus-4.5","claude-sonnet-4.6","gpt-5.4","gemini-3.1-pro","deepseek-v3.2"]',
  'pay-per-use', 'API price +10% for hosted usage beyond included $5/month.',
  'Hosted inference continues at API list +10%. BYOK has no overage.',
  'Pricing: API list price +10%. Claude Opus 4.5/4.6: $5.50/M in, $27.50/M out. Sonnet 4.6: $3.30/M in, $16.50/M out. Haiku 4.5: $1.10/M in, $5.50/M out. GPT-5.4: $2.75/M in, $16.50/M out.');

-- JetBrains AI
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included,
  overage_model, overage_rate_description, fallback_behavior, usage_notes) VALUES
((SELECT id FROM tools WHERE slug='jetbrains-ai'), 'AI Pro', 10,
  '{"features":["AI chat in all JetBrains IDEs","code completion","multi-model via Grazie"]}',
  '["claude-sonnet-4.6","gpt-5.4","gemini-3-pro"]',
  'throttled', 'No overage billing. Rate-limited at high usage.',
  'Usage slows under heavy load. No extra charges.',
  'Billed annually at $100/yr ($8.33/mo) or $10/mo. Commercial license: $200/yr ($16.67/mo) or $20/mo. Claude model availability: Claude available via Grazie platform — exact versions not published by JetBrains.'),
((SELECT id FROM tools WHERE slug='jetbrains-ai'), 'AI Ultimate', 30,
  '{"features":["everything in AI Pro","higher limits","priority model access"]}',
  '["claude-opus-4.6","claude-sonnet-4.6","gpt-5.4","gemini-3.1-pro"]',
  'throttled', 'No overage billing. Higher rate limits than Pro.',
  'Usage slows under heavy load. No extra charges.',
  'Billed annually at $300/yr ($25/mo) or $30/mo. Commercial: $600/yr ($50/mo) or $60/mo.');

-- Tabnine
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included,
  overage_model, overage_rate_description, fallback_behavior, usage_notes) VALUES
((SELECT id FROM tools WHERE slug='tabnine'), 'Code Assistant', 39,
  '{"per_user":true,"features":["AI code completion","chat","multi-model","privacy controls"],"billing":"annual"}',
  '["claude-sonnet-4.6","gpt-5.4","gemini-3-pro"]',
  'throttled', 'Flat-rate seat license. No per-model cost differential. Usage throttled under enterprise policies.',
  'Enterprise usage policies apply.',
  'Annual billing at $39/user/mo. Monthly billing higher. Flat-rate — all models included at no extra cost per model. Tabnine does not publish which specific Claude versions are available.'),
((SELECT id FROM tools WHERE slug='tabnine'), 'Agentic Platform', 59,
  '{"per_user":true,"features":["everything in Code Assistant","agentic tasks","deeper codebase context"],"billing":"annual"}',
  '["claude-opus-4.6","claude-sonnet-4.6","gpt-5.4","gemini-3.1-pro"]',
  'throttled', 'Flat-rate. No per-model overage.',
  'Enterprise usage policies apply.',
  'Annual billing at $59/user/mo. Same flat-rate model — agentic features unlocked, not priced per model.');

-- Continue.dev
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included,
  overage_model, overage_rate_description, fallback_behavior, usage_notes) VALUES
((SELECT id FROM tools WHERE slug='continue-dev'), 'Starter (BYOK)', 0,
  '{"features":["VS Code + JetBrains","BYOK for all providers","open source"]}',
  '["any-via-api"]',
  'none', 'No overage — you pay your API provider directly.',
  'Unlimited usage via your own API keys.',
  'Free and open source. BYOK for Anthropic, OpenAI, Google, Ollama, Deepseek, and more. No tool cost.'),
((SELECT id FROM tools WHERE slug='continue-dev'), 'Starter (Hosted)', 3,
  '{"features":["pay-per-million-tokens","hosted inference","no API keys needed"],"billing":"per-token"}',
  '["claude-sonnet-4.6","gpt-5.4","gemini-3-flash"]',
  'pay-per-use', 'Pay-per-token at $3/million tokens (input + output combined).',
  'Usage continues, billed monthly.',
  '$3/M tokens covers both input AND output combined. Economical for moderate usage. Frontier models available via credit purchase.'),
((SELECT id FROM tools WHERE slug='continue-dev'), 'Team', 20,
  '{"per_user":true,"features":["$10 credits/seat included","shared team account","usage dashboard"]}',
  '["claude-sonnet-4.6","claude-opus-4.6","gpt-5.4","gemini-3-pro"]',
  'pay-per-use', 'Pay-per-token beyond included $10 credits per seat.',
  'Billed at $3/M tokens for overages.',
  '$20/seat/month includes $10 in credits per seat. Overage at $3/M tokens.');

-- Gemini Code Assist
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included,
  overage_model, overage_rate_description, fallback_behavior, usage_notes) VALUES
((SELECT id FROM tools WHERE slug='gemini-code-assist'), 'Individual (Free)', 0,
  '{"features":["code completions","chat","VS Code/JetBrains plugin","individual use only"]}',
  '["gemini-2.5-pro","gemini-3-flash"]',
  'stopped', 'Free tier stops at usage limits. Upgrade to Standard for teams.',
  'Completions continue at reduced rate.',
  'Free for individual developers. Powered by Gemini models. IDE plugin for VS Code, JetBrains, and more.'),
((SELECT id FROM tools WHERE slug='gemini-code-assist'), 'Standard', 19,
  '{"per_user":true,"features":["full code completions","chat","codebase context","enterprise security","JIRA/GitHub integration"]}',
  '["gemini-2.5-pro","gemini-3-pro","gemini-3-flash"]',
  'pay-per-use', 'Overages billed at Vertex AI rates. Gemini 2.5 Pro: $1.25/M in, $10/M out (≤200K ctx).',
  'Continues at Vertex AI pay-per-use rates.',
  '$19/user/month (widely reported; Google pricing page JS-rendered, not confirmed from live page this session). Overage at Vertex AI rates: Gemini 2.5 Pro $1.25/$10 per MTok, Gemini 3 Flash $0.50/$3 per MTok.');

-- ============================================================
-- 4. UPDATE ANTIGRAVITY — mark as offline/unconfirmed
-- ============================================================
UPDATE tools SET description = 'AI coding IDE (claimed multi-model). Website currently offline as of Mar 2026 (nginx default page). Plans/pricing unconfirmed.'
WHERE slug = 'antigravity';

-- ============================================================
-- 5. WINDSURF — Add per-model credit costs to model_availability
--    Source: docs.windsurf.com/windsurf/models (credits per request — confirmed)
--    Self-serve plans use token-based billing; Enterprise uses credit multipliers
--    These credit values reflect the enterprise/team credit multiplier system
-- ============================================================

-- Claude Opus 4.5 on Windsurf Pro — 4 credits/request
UPDATE model_availability
SET credits_per_request = 4,
    cost_notes = '4 credits/request. Cheaper than Opus 4.6 (6 credits). Same performance tier.'
WHERE model_id = (SELECT id FROM models WHERE slug='claude-opus-4.5')
  AND tool_id = (SELECT id FROM tools WHERE slug='windsurf');

-- Claude Opus 4.6 on Windsurf Pro — 6 credits/request
UPDATE model_availability
SET credits_per_request = 6,
    cost_notes = '6 credits/request. 50% more expensive than Opus 4.5 (4 credits). Recommended by Windsurf.'
WHERE model_id = (SELECT id FROM models WHERE slug='claude-opus-4.6')
  AND tool_id = (SELECT id FROM tools WHERE slug='windsurf');

-- Claude Sonnet 4.6 on Windsurf — 4 credits/request
UPDATE model_availability
SET credits_per_request = 4,
    cost_notes = '4 credits/request (same as Opus 4.5 — strong value).'
WHERE model_id = (SELECT id FROM models WHERE slug='claude-sonnet-4.6')
  AND tool_id = (SELECT id FROM tools WHERE slug='windsurf');

-- Claude Haiku 4.5 on Windsurf — 1 credit/request
UPDATE model_availability
SET credits_per_request = 1,
    cost_notes = '1 credit/request. Most economical Claude option on Windsurf.'
WHERE model_id = (SELECT id FROM models WHERE slug='claude-haiku-4.5')
  AND tool_id = (SELECT id FROM tools WHERE slug='windsurf');

-- GPT-5.4 on Windsurf — based on relative API pricing, estimated ~4 credits
UPDATE model_availability
SET credits_per_request = 4,
    cost_notes = 'Approximately 4 credits/request based on Windsurf model pricing tier.'
WHERE model_id = (SELECT id FROM models WHERE slug='gpt-5.4')
  AND tool_id = (SELECT id FROM tools WHERE slug='windsurf');

-- DeepSeek V3.2 on Windsurf — low cost tier
UPDATE model_availability
SET credits_per_request = 0.5,
    cost_notes = '~0.5 credits/request. Very cost-efficient open-weight model.'
WHERE model_id = (SELECT id FROM models WHERE slug='deepseek-v3.2')
  AND tool_id = (SELECT id FROM tools WHERE slug='windsurf');

-- ============================================================
-- 6. ADD CLAUDE OPUS 4.5 AVAILABILITY (where confirmed available)
-- ============================================================

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, credits_per_request, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits', 4, '4 credits/request. Confirmed from docs.windsurf.com/windsurf/models. Better value than Opus 4.6 (6 credits) — same API price.');
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, credits_per_request, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Teams'), 'credits', 4, '4 credits/request. Same as Pro tier.');
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, credits_per_request, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits', NULL, 'API-rate passthrough: $5/M input, $25/M output. Deducted from $20 included credit pool. Identical price to Opus 4.6.');
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, credits_per_request, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits', NULL, 'API-rate passthrough: $5/M input, $25/M output. Deducted from $70 included credit pool.');
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, credits_per_request, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Ultra'), 'credits', NULL, 'API-rate passthrough: $5/M input, $25/M output. Deducted from $400 included credit pool.');
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, credits_per_request, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full', NULL, '3x premium request multiplier. Costs 3 of your 300 monthly requests per use. Same multiplier as Opus 4.6.');
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, credits_per_request, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full', NULL, '3x premium request multiplier. Costs 3 of your 1,500 monthly requests per use. 500 effective Opus uses/month at Pro+.');
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, credits_per_request, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full', NULL, '0.33x multiplier = 100 requests costs only 33 premium requests. Most efficient Claude option on Copilot.');

-- Update existing GitHub Copilot Sonnet entries with multiplier cost_notes
UPDATE model_availability
SET cost_notes = '1x premium request multiplier. 1 Claude Sonnet use = 1 premium request. On Pro: 300 Sonnet uses/month. On Pro+: 1,500/month.'
WHERE model_id = (SELECT id FROM models WHERE slug='claude-sonnet-4.6')
  AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot');

UPDATE model_availability
SET cost_notes = '3x premium request multiplier. 1 Opus use = 3 premium requests. On Pro: 100 Opus uses/month. On Pro+: 500 Opus uses/month.'
WHERE model_id = (SELECT id FROM models WHERE slug='claude-opus-4.6')
  AND tool_id = (SELECT id FROM tools WHERE slug='github-copilot');

-- ============================================================
-- 7. ZED AI — Model availability with per-model USD costs
-- ============================================================

-- Zed AI Pro plan models (all at API + 10%)
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, cost_per_request_usd, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Pro'),
 'credits', NULL, 'API list +10%: $5.50/M input, $27.50/M output. Included $5/mo credit, then pay-per-token.'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Pro'),
 'credits', NULL, 'API list +10%: $5.50/M input, $27.50/M output. Same price as Opus 4.6 — 200K context vs 1M.'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Pro'),
 'credits', NULL, 'API list +10%: $3.30/M input, $16.50/M output.'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Pro'),
 'credits', NULL, 'API list +10%: $1.10/M input, $5.50/M output. Most affordable Claude on Zed.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Pro'),
 'credits', NULL, 'API list +10%: $2.75/M input, $16.50/M output.'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Pro'),
 'credits', NULL, 'API list +10%: ~$2.20/M input, ~$13.20/M output.'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Pro'),
 'credits', NULL, 'API list +10%: ~$0.31/M input, ~$0.46/M output. Most cost-efficient on Zed.'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Personal'),
 'byok', NULL, 'BYOK: you pay Anthropic directly at $5/M input, $25/M output.'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Personal'),
 'byok', NULL, 'BYOK: $5/M input, $25/M output. Excluded from free prediction quota (Pro required for hosted).'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Personal'),
 'byok', NULL, 'BYOK: $3/M input, $15/M output direct to Anthropic.'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='zed-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='zed-ai') AND plan_name='Personal'),
 'byok', NULL, 'BYOK: ~$0.28/M input, ~$0.42/M output. Excellent value for BYOK on Zed.');

-- ============================================================
-- 8. JETBRAINS AI — Model availability
-- ============================================================
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='jetbrains-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='jetbrains-ai') AND plan_name='AI Pro'),
 'full', 'Included in flat $10/mo seat. Claude available via Grazie platform. Exact Claude version not published by JetBrains.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='jetbrains-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='jetbrains-ai') AND plan_name='AI Pro'),
 'full', 'Included in flat $10/mo seat.'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='jetbrains-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='jetbrains-ai') AND plan_name='AI Pro'),
 'full', 'Included in flat $10/mo seat.'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='jetbrains-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='jetbrains-ai') AND plan_name='AI Ultimate'),
 'full', 'Included in flat $30/mo seat (commercial: $60/mo). Higher model tier access.'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='jetbrains-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='jetbrains-ai') AND plan_name='AI Ultimate'),
 'full', 'Included in flat $30/mo seat.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='jetbrains-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='jetbrains-ai') AND plan_name='AI Ultimate'),
 'full', 'Included in flat $30/mo seat.'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='jetbrains-ai'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='jetbrains-ai') AND plan_name='AI Ultimate'),
 'full', 'Included in flat $30/mo seat.');

-- ============================================================
-- 9. TABNINE — Model availability (flat-rate, no per-model cost)
-- ============================================================
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='tabnine'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='tabnine') AND plan_name='Code Assistant'),
 'full', 'Flat $39/user/mo. No per-model premium. Exact Claude version not specified by Tabnine.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='tabnine'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='tabnine') AND plan_name='Code Assistant'),
 'full', 'Flat $39/user/mo. No per-model premium.'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='tabnine'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='tabnine') AND plan_name='Code Assistant'),
 'full', 'Flat $39/user/mo. No per-model premium.'),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='tabnine'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='tabnine') AND plan_name='Agentic Platform'),
 'full', 'Flat $59/user/mo. All models included. Agentic features unlocked.'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='tabnine'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='tabnine') AND plan_name='Agentic Platform'),
 'full', 'Flat $59/user/mo. No per-model cost differential.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='tabnine'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='tabnine') AND plan_name='Agentic Platform'),
 'full', 'Flat $59/user/mo.'),
((SELECT id FROM models WHERE slug='llama-4-maverick'), (SELECT id FROM tools WHERE slug='tabnine'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='tabnine') AND plan_name='Code Assistant'),
 'full', 'Tabnine includes Meta models. Flat rate, no per-model cost.'),
((SELECT id FROM models WHERE slug='mistral-large-3'), (SELECT id FROM tools WHERE slug='tabnine'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='tabnine') AND plan_name='Code Assistant'),
 'full', 'Tabnine includes Mistral models. Flat rate, no per-model cost.');

-- ============================================================
-- 10. CONTINUE.DEV — Model availability (BYOK + hosted)
-- ============================================================
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, cost_notes) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (BYOK)'), 'byok', 'BYOK: $5/M input, $25/M output direct to Anthropic API.'),
((SELECT id FROM models WHERE slug='claude-opus-4.5'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (BYOK)'), 'byok', 'BYOK: $5/M input, $25/M output. Identical price to Opus 4.6, 200K context.'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (BYOK)'), 'byok', 'BYOK: $3/M input, $15/M output.'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (BYOK)'), 'byok', 'BYOK: $1/M input, $5/M output. Most affordable hosted Claude.'),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (BYOK)'), 'byok', 'BYOK: ~$0.28/M input, ~$0.42/M output. Most cost-efficient option.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (BYOK)'), 'byok', 'BYOK: $2.50/M input, $15/M output.'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (Hosted)'), 'credits', '$3/M combined tokens (input+output). Simpler billing than per-direction pricing.'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (Hosted)'), 'credits', '$3/M combined tokens.'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='continue-dev'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='continue-dev') AND plan_name='Starter (Hosted)'), 'credits', '$3/M combined tokens. Gemini Flash is economical at this price.');

-- ============================================================
-- 11. GEMINI CODE ASSIST — Model availability
-- ============================================================
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, cost_notes) VALUES
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), (SELECT id FROM tools WHERE slug='gemini-code-assist'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_name='Individual (Free)'),
 'credits', 'Powered by Gemini models. Individual free tier. Usage-limited.'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='gemini-code-assist'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_name='Individual (Free)'),
 'credits', 'Fast Gemini model. Free tier.'),
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), (SELECT id FROM tools WHERE slug='gemini-code-assist'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_name='Standard'),
 'full', '$19/user/mo. Vertex AI overage: $1.25/M input, $10/M output (≤200K context). Priority tier: $2.25/$18 per MTok.'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='gemini-code-assist'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_name='Standard'),
 'full', '$19/user/mo. Powered by Gemini 3 Pro on Standard tier.'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='gemini-code-assist'),
 (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='gemini-code-assist') AND plan_name='Standard'),
 'full', 'Fast completions via Gemini Flash. Overage: $0.50/M input, $3/M output.');
