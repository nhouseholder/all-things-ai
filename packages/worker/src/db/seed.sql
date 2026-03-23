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
