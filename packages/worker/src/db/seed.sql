-- ============================================================
-- TOOLS
-- ============================================================
INSERT OR IGNORE INTO tools (name, slug, vendor, category, website_url, pricing_page_url, description) VALUES
('Claude Code', 'claude-code', 'Anthropic', 'cli', 'https://claude.ai', 'https://claude.ai/pricing', 'CLI-based AI coding agent powered by Claude models. Deep context understanding, agentic workflows.'),
('Cursor', 'cursor', 'Anysphere', 'ide', 'https://www.cursor.com', 'https://www.cursor.com/pricing', 'AI-first code editor built on VS Code. Inline completions, chat, composer mode.'),
('Windsurf', 'windsurf', 'Codeium', 'ide', 'https://windsurf.com', 'https://windsurf.com/pricing', 'AI-powered IDE by Codeium. Cascade agent for multi-file edits, flows.'),
('GitHub Copilot', 'github-copilot', 'GitHub/Microsoft', 'ide-plugin', 'https://github.com/features/copilot', 'https://github.com/features/copilot#pricing', 'AI pair programmer as VS Code extension. Inline suggestions, chat, workspace agent.'),
('Codex', 'codex', 'OpenAI', 'agent', 'https://openai.com/codex', 'https://openai.com/pricing', 'OpenAI cloud-based coding agent. Runs tasks in sandboxed environments.'),
('Roo Code', 'roo-code', 'Roo Code', 'ide-plugin', 'https://roocode.com', NULL, 'VS Code extension supporting multiple LLM providers via API keys. Flexible model routing.'),
('Aider', 'aider', 'Aider', 'cli', 'https://aider.chat', NULL, 'Open-source CLI pair programming tool. Works with any LLM API. Git-native.'),
('Antigravity', 'antigravity', 'Antigravity', 'ide', 'https://antigravity.dev', NULL, 'AI coding IDE with multi-model support and competitive pricing.'),
('Amazon Q Developer', 'amazon-q', 'AWS', 'ide-plugin', 'https://aws.amazon.com/q/developer/', NULL, 'AWS AI coding assistant. Deep AWS integration, security scanning.'),
('Tabnine', 'tabnine', 'Tabnine', 'ide-plugin', 'https://www.tabnine.com', 'https://www.tabnine.com/pricing', 'AI code completion with privacy focus. On-prem and cloud options.');

INSERT OR IGNORE INTO tools (name, slug, vendor, category, website_url, pricing_page_url, description) VALUES
('Qwen Code', 'qwen-code', 'Alibaba / Qwen', 'platform', 'https://chat.qwen.ai', 'https://chat.qwen.ai', 'Qwen first-party coding and research workspace across web, desktop, mobile, and API surfaces.'),
('Kimi K', 'kimi-k', 'Moonshot AI', 'platform', 'https://www.kimi.com', 'https://www.kimi.com', 'Moonshot AI coding subscription line built around Kimi K2.5 plus the wider Kimi productivity and research stack.'),
('GLM Coding', 'glm-coding', 'Z.ai / Zhipu AI', 'platform', 'https://z.ai', 'https://z.ai', 'GLM 5.1 coding-focused subscription surface from Z.ai.'),
('MiniMax Coding', 'minimax-coding', 'MiniMax', 'platform', 'https://www.minimax.io', 'https://www.minimax.io/platform', 'MiniMax token plan for interactive coding workflows with documented third-party IDE and agent compatibility.');

-- ============================================================
-- PRICING PLANS (as of March 2026 — best known data)
-- ============================================================
INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, price_yearly, features, models_included) VALUES
-- Claude Code
((SELECT id FROM tools WHERE slug='claude-code'), 'Max 5', 100, 1200, '{"requests":"generous Claude usage","features":["agentic coding","multi-file edits","git integration","MCP support"]}', '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]'),
((SELECT id FROM tools WHERE slug='claude-code'), 'Max 20', 200, 2400, '{"requests":"5x Max 5 usage","features":["everything in Max 5","higher rate limits"]}', '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]'),

-- Cursor
((SELECT id FROM tools WHERE slug='cursor'), 'Pro', 20, 192, '{"requests":"500 fast requests/month","features":["tab completion","chat","composer"]}', '["claude-sonnet-4","gpt-4o","cursor-small"]'),
((SELECT id FROM tools WHERE slug='cursor'), 'Business', 40, 384, '{"requests":"500 fast + unlimited slow","features":["everything in Pro","admin dashboard","SAML SSO"]}', '["claude-sonnet-4","gpt-4o","claude-opus-4"]'),

-- Windsurf
((SELECT id FROM tools WHERE slug='windsurf'), 'Pro', 25, 240, '{"requests":"generous credits","features":["cascade agent","flows","multi-file edits"]}', '["claude-sonnet-4","gpt-4o"]'),

-- GitHub Copilot
((SELECT id FROM tools WHERE slug='github-copilot'), 'Individual', 10, 100, '{"requests":"unlimited completions","features":["inline suggestions","chat","CLI"]}', '["gpt-4o","claude-sonnet-4"]'),
((SELECT id FROM tools WHERE slug='github-copilot'), 'Business', 19, 228, '{"requests":"unlimited","features":["everything Individual","org management","IP indemnity"]}', '["gpt-4o","claude-sonnet-4","claude-opus-4"]'),

-- Codex
((SELECT id FROM tools WHERE slug='codex'), 'Pro', 200, NULL, '{"requests":"included with ChatGPT Pro","features":["cloud sandbox","parallel tasks","git integration"]}', '["codex-1","gpt-4o","o3"]'),

-- Roo Code (BYOK — bring your own key)
((SELECT id FROM tools WHERE slug='roo-code'), 'Free (BYOK)', 0, 0, '{"requests":"limited by your API key","features":["multi-provider","custom models","VS Code"]}', '["any-via-api"]'),

-- Aider (open source)
((SELECT id FROM tools WHERE slug='aider'), 'Free (BYOK)', 0, 0, '{"requests":"limited by your API key","features":["open source","git-native","multi-model"]}', '["any-via-api"]');

INSERT OR IGNORE INTO pricing_plans (tool_id, plan_name, price_monthly, price_yearly, features, models_included, overage_model, usage_notes) VALUES
((SELECT id FROM tools WHERE slug='qwen-code'), 'Code Pro', NULL, NULL, '{"features":["Qwen Studio","Web Dev workspace","Deep Research","Search","API Platform"],"requests":"Public monthly cap details are not clearly documented","comparison":{"track":"coding-subscription","hidden_from_catalog":true,"pricing_confidence":"reference","reference_price_label":"$50/mo reference","reference_price_monthly":50,"model_anchor":"Qwen 3.6 Plus","capability_summary":"Broad first-party coding and research surface with desktop, mobile, and API coverage.","best_for":["research-heavy debugging","web builds","multi-device workflows"],"tradeoffs":["Official monthly checkout pricing was not directly extractable from the reviewed public pages","Third-party IDE integrations are less clearly documented than app surfaces"],"ide_support":["Web","iOS","Android","macOS","Windows","API Platform"],"limit_summary":"Public monthly cap and reset details were not clearly documented on the official surfaces reviewed.","limit_reset":"Not clearly documented","overage_path":"Verify current fair-use and upgrade terms before purchase","support_scope":"First-party app surfaces are documented more clearly than IDE plug-ins."}}', '["qwen-3.6-plus","qwen-3.5-plus"]', 'verify-before-buy', 'Public pricing and cap details should be rechecked on checkout because the official page did not expose them cleanly.'),
((SELECT id FROM tools WHERE slug='kimi-k'), 'Moderato', 15, NULL, '{"features":["Kimi Code","Docs / Slides / Sheets","Deep Research"],"requests":"Entry membership tier with lighter headroom","comparison":{"track":"coding-subscription","hidden_from_catalog":true,"pricing_confidence":"official","model_anchor":"Kimi K2.5","capability_summary":"Entry Kimi coding tier that still brings the broader Kimi research and productivity surface into the workflow.","best_for":["budget daily coding","mixed docs plus code loops"],"tradeoffs":["The public membership page is clearer on tier positioning than exact hard caps"],"ide_support":["Kimi Code","Web","iOS","Android"],"limit_summary":"Entry-tier allowance with lighter priority and headroom than the upper Kimi tiers.","limit_reset":"Tier allowance details vary by membership level","overage_path":"Upgrade to the next Kimi tier for more headroom","support_scope":"Best documented as a first-party coding and research workspace rather than a third-party IDE plug-in."}}', '["kimi-k2.5"]', 'upgrade', 'Kimi emphasizes tier progression and product access; verify current hard-cap details on checkout.'),
((SELECT id FROM tools WHERE slug='kimi-k'), 'Allegretto', 31, NULL, '{"features":["Kimi Code","Deep Research","Docs / Slides / Sheets","Kimi Claw"],"requests":"Mid-tier membership with more frequent coding headroom","comparison":{"track":"coding-subscription","hidden_from_catalog":true,"pricing_confidence":"official","model_anchor":"Kimi K2.5","capability_summary":"Mid-tier Kimi option for developers who want K2.5 access without jumping straight to the heavier plans.","best_for":["regular coding sessions","research plus implementation loops"],"tradeoffs":["Exact numeric hard caps are less explicit than the plan ladder itself"],"ide_support":["Kimi Code","Kimi Claw","Web","iOS","Android"],"limit_summary":"More frequent Kimi Code use and higher priority than Moderato, but still below the heavy-use tiers.","limit_reset":"Tier allowance details vary by membership level","overage_path":"Upgrade to Allegro or Vivace when the allowance is too tight","support_scope":"First-party coding experience plus Moonshot productivity surfaces."}}', '["kimi-k2.5"]', 'upgrade', 'Good middle tier when you want Kimi K2.5 without paying for the heaviest allowance.'),
((SELECT id FROM tools WHERE slug='kimi-k'), 'Allegro', 79, NULL, '{"features":["Kimi Code","Kimi Claw","Deep Research","Agent Swarm"],"requests":"High-usage tier for heavier daily coding","comparison":{"track":"coding-subscription","hidden_from_catalog":true,"pricing_confidence":"official","model_anchor":"Kimi K2.5","capability_summary":"Heavy-use Kimi tier aimed at developers leaning on Kimi for daily coding, research, and agent workflows.","best_for":["full-day coding sessions","agent-assisted implementation"],"tradeoffs":["Still less explicit on exact hard caps than MiniMax is"],"ide_support":["Kimi Code","Kimi Claw","Agent Swarm","Web","iOS","Android"],"limit_summary":"Heavy-use tier with materially more headroom and priority than the lower Kimi plans.","limit_reset":"Tier allowance details vary by membership level","overage_path":"Upgrade to Vivace if you routinely hit the allowance","support_scope":"First-party coding workflow with Moonshot agent features layered on top."}}', '["kimi-k2.5"]', 'upgrade', 'Built for heavier daily use when Moderato or Allegretto would run out of headroom.'),
((SELECT id FROM tools WHERE slug='kimi-k'), 'Vivace', 159, NULL, '{"features":["Kimi Code","Kimi Claw","Agent Swarm","Deep Research","Priority access"],"requests":"Top Kimi tier with the most headroom and priority","comparison":{"track":"coding-subscription","hidden_from_catalog":true,"pricing_confidence":"official","model_anchor":"Kimi K2.5","capability_summary":"Top Kimi tier for buyers who want the broadest Kimi allowance and priority access inside Moonshot''s first-party stack.","best_for":["all-day agent workflows","highest Kimi priority"],"tradeoffs":["The public membership page still emphasizes positioning more than hard usage math"],"ide_support":["Kimi Code","Kimi Claw","Agent Swarm","Web","iOS","Android"],"limit_summary":"Highest-priority Kimi tier with the broadest usage headroom in the published ladder.","limit_reset":"Tier allowance details vary by membership level","overage_path":"This is the top public tier; verify Moonshot support if you need more than the published allowance","support_scope":"Strongest Kimi packaging if you want Moonshot''s first-party coding environment as the center of your workflow."}}', '["kimi-k2.5"]', 'upgrade', 'Top public Kimi tier for buyers who want the most headroom without juggling multiple memberships.'),
((SELECT id FROM tools WHERE slug='glm-coding'), 'Coding Plan', NULL, NULL, '{"features":["GLM 5.1","Coding-plan positioning","Developer workspace"],"requests":"Public monthly cap details are not clearly documented","comparison":{"track":"coding-subscription","hidden_from_catalog":true,"pricing_confidence":"reference","reference_price_label":"$30/mo reference","reference_price_monthly":30,"model_anchor":"GLM 5.1","capability_summary":"Z.ai positions GLM 5.1 as a coding-focused subscription, but the public billing details remain thin.","best_for":["GLM-first workflows","buyers comfortable verifying details before checkout"],"tradeoffs":["Public monthly checkout pricing was not directly extractable from official pages","IDE compatibility details are still sparse in the reviewed public materials"],"ide_support":[],"limit_summary":"Public limit and reset details were not clearly documented on the official pages reviewed.","limit_reset":"Not clearly documented","overage_path":"Verify allowance, upgrade, and reset behavior before purchase","support_scope":"Public IDE compatibility details were limited in the official materials reviewed."}}', '["glm-5.1"]', 'verify-before-buy', 'The public product material makes the coding positioning clear, but not the exact monthly plan rules.'),
((SELECT id FROM tools WHERE slug='minimax-coding'), 'Token Plan', NULL, NULL, '{"features":["MiniMax M2.7","High-speed variant","Third-party coding tool docs","Pay-as-you-go escape hatch"],"requests":"5-hour rolling text quota with daily non-text resets","comparison":{"track":"coding-subscription","hidden_from_catalog":true,"pricing_confidence":"reference","reference_price_label":"$20-30/mo reference","reference_price_monthly":25,"model_anchor":"MiniMax M2.7","capability_summary":"Strong coding plan if you already work inside third-party IDEs or coding agents and want clearer fallback behavior.","best_for":["Claude Code or Cursor workflows","high-frequency interactive prompting","buyers who care about documented reset behavior"],"tradeoffs":["Peak-hour rate limiting can still apply","Weekly quotas may affect newer users","Production usage is nudged toward pay-as-you-go"],"ide_support":["OpenClaw","OpenCode","Claude Code","Cursor","Trae","Cline","Roo Code","Zed"],"limit_summary":"M2.7 text quotas use a 5-hour rolling window; non-text quotas reset daily; peak-hour rate limiting and weekly quotas can apply.","limit_reset":"5-hour rolling for text, daily for non-text","overage_path":"Upgrade, switch to pay-as-you-go, or wait for reset","support_scope":"Official docs explicitly list third-party coding agents and editors.","sources_note":"FAQ and token-plan docs expose the clearest limit and compatibility details in this comparison set."}}', '["minimax-m2.7"]', 'upgrade-or-payg', 'Official docs are unusually clear on reset behavior, fallbacks, and supported coding tools.');

-- ============================================================
-- MODELS
-- ============================================================
INSERT OR IGNORE INTO models (name, slug, vendor, family, release_date, description) VALUES
('Claude Opus 4', 'claude-opus-4', 'Anthropic', 'Claude', '2025-05-22', 'Most capable Claude model. Exceptional at complex reasoning, nuanced understanding, and agentic coding.'),
('Claude Sonnet 4', 'claude-sonnet-4', 'Anthropic', 'Claude', '2025-05-22', 'Balanced Claude model. Strong coding and reasoning at lower cost than Opus.'),
('Claude Haiku 3.5', 'claude-haiku-3.5', 'Anthropic', 'Claude', '2024-10-29', 'Fast and affordable Claude model for simpler tasks.'),
('GPT-4o', 'gpt-4o', 'OpenAI', 'GPT', '2024-05-13', 'OpenAI multimodal flagship. Good all-around coding and reasoning.'),
('GPT-o3', 'gpt-o3', 'OpenAI', 'GPT-o', '2025-04-16', 'OpenAI reasoning model with extended thinking. Strong on complex problems.'),
('Gemini 2.5 Pro', 'gemini-2.5-pro', 'Google', 'Gemini', '2025-03-25', 'Google flagship with 1M context. Strong on code and multimodal tasks.'),
('Gemini 2.5 Flash', 'gemini-2.5-flash', 'Google', 'Gemini', '2025-04-17', 'Fast Google model optimized for speed and cost.'),
('DeepSeek V3', 'deepseek-v3', 'DeepSeek', 'DeepSeek', '2025-03-24', 'Open-weight model with strong coding performance at very low API cost.'),
('Llama 4 Maverick', 'llama-4-maverick', 'Meta', 'Llama', '2025-04-05', 'Meta open-weight model. Competitive coding performance, runs locally or via API.');

INSERT OR IGNORE INTO models (name, slug, vendor, family, description, is_active, input_price_per_mtok, output_price_per_mtok, context_window) VALUES
('Qwen 3.5 Plus', 'qwen-3.5-plus', 'Alibaba / Qwen', 'Qwen', 'Qwen flagship coding-facing model surfaced inside Qwen Code.', 1, NULL, NULL, NULL),
('Qwen 3.6 Plus', 'qwen-3.6-plus', 'Alibaba / Qwen', 'Qwen', 'Qwen flagship coding model released on April 1, 2026 with 1M-token context and upgraded agentic coding capabilities.', 1, 0.5, 3.0, 1000000),
('Kimi K2.5', 'kimi-k2.5', 'Moonshot AI', 'Kimi', 'Moonshot coding model exposed through the Kimi K membership ladder.', 1, NULL, NULL, NULL),
('GLM 5.1', 'glm-5.1', 'Z.ai / Zhipu AI', 'GLM', 'GLM 5.1 coding-oriented model used in the public GLM coding plan materials.', 1, NULL, NULL, NULL),
('MiniMax M2.7', 'minimax-m2.7', 'MiniMax', 'MiniMax', 'MiniMax flagship coding model with official token-plan reset and compatibility documentation.', 1, NULL, NULL, NULL);

-- ============================================================
-- BENCHMARKS (normalized scores where possible)
-- ============================================================
INSERT OR IGNORE INTO benchmarks (model_id, benchmark_name, category, score, max_score, source_url) VALUES
-- Claude Opus 4
((SELECT id FROM models WHERE slug='claude-opus-4'), 'SWE-bench Verified', 'coding', 72.0, 100, 'https://swebench.com'),
((SELECT id FROM models WHERE slug='claude-opus-4'), 'HumanEval', 'coding', 93.0, 100, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4'), 'TAU-bench (airline)', 'debugging', 53.0, 100, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4'), 'GPQA Diamond', 'reasoning', 74.9, 100, NULL),
((SELECT id FROM models WHERE slug='claude-opus-4'), 'MMLU Pro', 'reasoning', 84.3, 100, NULL),

-- Claude Sonnet 4
((SELECT id FROM models WHERE slug='claude-sonnet-4'), 'SWE-bench Verified', 'coding', 72.7, 100, 'https://swebench.com'),
((SELECT id FROM models WHERE slug='claude-sonnet-4'), 'HumanEval', 'coding', 91.0, 100, NULL),
((SELECT id FROM models WHERE slug='claude-sonnet-4'), 'TAU-bench (airline)', 'debugging', 49.0, 100, NULL),
((SELECT id FROM models WHERE slug='claude-sonnet-4'), 'GPQA Diamond', 'reasoning', 70.4, 100, NULL),

-- GPT-4o
((SELECT id FROM models WHERE slug='gpt-4o'), 'SWE-bench Verified', 'coding', 38.0, 100, 'https://swebench.com'),
((SELECT id FROM models WHERE slug='gpt-4o'), 'HumanEval', 'coding', 90.2, 100, NULL),
((SELECT id FROM models WHERE slug='gpt-4o'), 'GPQA Diamond', 'reasoning', 53.6, 100, NULL),
((SELECT id FROM models WHERE slug='gpt-4o'), 'MMLU Pro', 'reasoning', 74.5, 100, NULL),

-- GPT-o3
((SELECT id FROM models WHERE slug='gpt-o3'), 'SWE-bench Verified', 'coding', 69.1, 100, 'https://swebench.com'),
((SELECT id FROM models WHERE slug='gpt-o3'), 'GPQA Diamond', 'reasoning', 83.3, 100, NULL),
((SELECT id FROM models WHERE slug='gpt-o3'), 'MMLU Pro', 'reasoning', 81.9, 100, NULL),

-- Gemini 2.5 Pro
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), 'SWE-bench Verified', 'coding', 63.8, 100, 'https://swebench.com'),
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), 'HumanEval', 'coding', 89.5, 100, NULL),
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), 'GPQA Diamond', 'reasoning', 68.9, 100, NULL),

-- DeepSeek V3
((SELECT id FROM models WHERE slug='deepseek-v3'), 'SWE-bench Verified', 'coding', 42.0, 100, 'https://swebench.com'),
((SELECT id FROM models WHERE slug='deepseek-v3'), 'HumanEval', 'coding', 82.6, 100, NULL),
((SELECT id FROM models WHERE slug='deepseek-v3'), 'GPQA Diamond', 'reasoning', 59.1, 100, NULL);

-- ============================================================
-- MODEL AVAILABILITY (which models on which tool/plan)
-- ============================================================
INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
-- Claude Code → Claude models
((SELECT id FROM models WHERE slug='claude-opus-4'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5'), 'full'),

-- Cursor → multiple models
((SELECT id FROM models WHERE slug='claude-sonnet-4'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gpt-4o'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'full'),

-- Windsurf → models
((SELECT id FROM models WHERE slug='claude-sonnet-4'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gpt-4o'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'full'),

-- GitHub Copilot
((SELECT id FROM models WHERE slug='gpt-4o'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Individual'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Individual'), 'full');

INSERT OR IGNORE INTO model_availability (model_id, tool_id, plan_id, access_level, cost_notes) VALUES
((SELECT id FROM models WHERE slug='qwen-3.5-plus'), (SELECT id FROM tools WHERE slug='qwen-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='qwen-code') AND plan_name='Code Pro'), 'full', 'Qwen Code positions Qwen 3.5 Plus as the coding model anchor, but public plan-limit details are sparse.'),
((SELECT id FROM models WHERE slug='qwen-3.6-plus'), (SELECT id FROM tools WHERE slug='qwen-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='qwen-code') AND plan_name='Code Pro'), 'full', 'Qwen Code now surfaces Qwen 3.6 Plus as the flagship coding model with 1M-token context and April 2026 pricing.'),
((SELECT id FROM models WHERE slug='kimi-k2.5'), (SELECT id FROM tools WHERE slug='kimi-k'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='kimi-k') AND plan_name='Moderato'), 'full', 'Entry Kimi membership tier.'),
((SELECT id FROM models WHERE slug='kimi-k2.5'), (SELECT id FROM tools WHERE slug='kimi-k'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='kimi-k') AND plan_name='Allegretto'), 'full', 'Mid-tier Kimi membership with more headroom.'),
((SELECT id FROM models WHERE slug='kimi-k2.5'), (SELECT id FROM tools WHERE slug='kimi-k'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='kimi-k') AND plan_name='Allegro'), 'full', 'Heavy-use Kimi membership tier.'),
((SELECT id FROM models WHERE slug='kimi-k2.5'), (SELECT id FROM tools WHERE slug='kimi-k'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='kimi-k') AND plan_name='Vivace'), 'full', 'Top public Kimi membership tier.'),
((SELECT id FROM models WHERE slug='glm-5.1'), (SELECT id FROM tools WHERE slug='glm-coding'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='glm-coding') AND plan_name='Coding Plan'), 'full', 'GLM coding-plan product materials emphasize GLM 5.1 but leave plan rules sparse.'),
((SELECT id FROM models WHERE slug='minimax-m2.7'), (SELECT id FROM tools WHERE slug='minimax-coding'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='minimax-coding') AND plan_name='Token Plan'), 'full', 'Official token-plan docs specify reset logic, fallback options, and supported coding tools.');

-- ============================================================
-- USER SUBSCRIPTIONS (current spend)
-- ============================================================
INSERT OR IGNORE INTO user_subscriptions (tool_id, plan_id, monthly_cost, started_at, is_active) VALUES
((SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5'), 100, '2025-01-01', 1),
((SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 25, '2025-03-01', 1);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
INSERT OR IGNORE INTO user_preferences (key, value) VALUES
('primary_languages', '["python","javascript"]'),
('project_types', '["prediction-algorithm","cloudflare-workers","sports-betting","saas"]'),
('monthly_budget', '150'),
('digest_frequency', '"weekly"'),
('digest_email', '""');

-- ============================================================
-- MODEL COMPOSITE SCORES (compare page backfill)
-- ============================================================
INSERT OR IGNORE INTO model_composite_scores (
	model_id,
	composite_score,
	swe_bench_component,
	livecodebench_component,
	nuance_component,
	arena_component,
	tau_component,
	gpqa_component,
	success_rate_component,
	community_adjustment
) VALUES
((SELECT id FROM models WHERE slug='qwen-3.5-plus'), 74.6, 74.0, 76.0, 76.0, 69.0, 70.0, 82.0, 76.0, 0.0),
((SELECT id FROM models WHERE slug='qwen-3.6-plus'), 79.4, 78.0, 80.0, 82.0, 71.0, 74.0, 86.0, 80.0, 0.0),
((SELECT id FROM models WHERE slug='kimi-k2.5'), 74.99, 76.8, 74.0, 73.0, 63.25, 70.0, 82.0, 78.29, 0.72),
((SELECT id FROM models WHERE slug='glm-5.1'), 75.83, 75.5, 78.0, 82.0, 55.0, 72.0, 85.0, 74.0, 0.0),
((SELECT id FROM models WHERE slug='minimax-m2.7'), 80.4, 82.0, 80.0, 82.0, 74.0, 74.0, 88.0, 80.0, 0.0);
