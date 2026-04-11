-- ============================================================
-- seed-v2.sql — Full data reset for All Things AI
-- Generated: 2026-03-22
-- ============================================================

-- ============================================================
-- 1. DELETE existing data (FK-safe order: children first)
-- ============================================================
DELETE FROM recommendations;
DELETE FROM user_preferences;
DELETE FROM user_subscriptions;
DELETE FROM model_availability;
DELETE FROM benchmarks;
DELETE FROM pricing_plans;
DELETE FROM models;
DELETE FROM tools;

-- ============================================================
-- 2. TOOLS
-- ============================================================
INSERT INTO tools (name, slug, vendor, category, website_url, description) VALUES
('Claude Code', 'claude-code', 'Anthropic', 'cli', 'https://claude.ai', 'CLI-based AI coding agent powered by Claude models. Deep context understanding, agentic workflows, MCP support.'),
('Cursor', 'cursor', 'Anysphere', 'ide', 'https://www.cursor.com', 'AI-first code editor built on VS Code. Inline completions, chat, composer, multi-model support.'),
('Windsurf', 'windsurf', 'Codeium', 'ide', 'https://windsurf.com', 'AI-powered IDE by Codeium. Cascade agent for multi-file edits, flows.'),
('GitHub Copilot', 'github-copilot', 'GitHub/Microsoft', 'ide-plugin', 'https://github.com/features/copilot', 'AI pair programmer as VS Code extension. Inline suggestions, chat, workspace agent.'),
('Codex', 'codex', 'OpenAI', 'agent', 'https://openai.com/codex', 'OpenAI cloud-based coding agent. Runs tasks in sandboxed environments via ChatGPT.'),
('Roo Code', 'roo-code', 'Roo Code', 'ide-plugin', 'https://roocode.com', 'VS Code extension supporting multiple LLM providers via API keys. Flexible model routing.'),
('Aider', 'aider', 'Aider', 'cli', 'https://aider.chat', 'Open-source CLI pair programming tool. Works with any LLM API. Git-native.'),
('Antigravity', 'antigravity', 'Antigravity', 'ide', 'https://antigravity.dev', 'AI coding IDE with multi-model support and competitive pricing.'),
('Augment Code', 'augment-code', 'Augment', 'ide-plugin', 'https://www.augmentcode.com', 'AI-powered coding assistant with deep codebase understanding.'),
('Amazon Q Developer', 'amazon-q', 'AWS', 'ide-plugin', 'https://aws.amazon.com/q/developer/', 'AWS AI coding assistant. Deep AWS integration, security scanning.');

-- ============================================================
-- 3. PRICING PLANS
-- ============================================================

-- Claude Code
INSERT INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='claude-code'), 'Pro', 20, '{"features":["agentic coding","multi-file edits","git integration","MCP support"]}', '["claude-sonnet-4.6","claude-haiku-4.5"]'),
((SELECT id FROM tools WHERE slug='claude-code'), 'Max 5x', 100, '{"features":["everything in Pro","Claude Opus 4.6 access","higher rate limits"]}', '["claude-opus-4.6","claude-sonnet-4.6","claude-haiku-4.5"]'),
((SELECT id FROM tools WHERE slug='claude-code'), 'Max 20x', 200, '{"features":["everything in Max 5x","5x higher rate limits"]}', '["claude-opus-4.6","claude-sonnet-4.6","claude-haiku-4.5"]');

-- Cursor
INSERT INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='cursor'), 'Pro', 20, '{"features":["tab completion","chat","composer","multi-model"]}', '["claude-sonnet-4.6","gpt-5.4","gemini-3-pro"]'),
((SELECT id FROM tools WHERE slug='cursor'), 'Pro+', 60, '{"features":["everything in Pro","more premium model credits"]}', '["claude-opus-4.6","gpt-5.4","gemini-3.1-pro"]'),
((SELECT id FROM tools WHERE slug='cursor'), 'Ultra', 200, '{"features":["everything in Pro+","highest rate limits"]}', '["claude-opus-4.6","gpt-5.4","gemini-3.1-pro"]');

-- Windsurf
INSERT INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='windsurf'), 'Pro', 15, '{"features":["cascade agent","flows","multi-file edits"]}', '["claude-sonnet-4.6","gpt-5.4","gemini-3-flash"]'),
((SELECT id FROM tools WHERE slug='windsurf'), 'Teams', 30, '{"per_user":true,"features":["everything in Pro","team management","admin controls"]}', '["claude-sonnet-4.6","gpt-5.4","gemini-3-flash"]');

-- GitHub Copilot
INSERT INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='github-copilot'), 'Free', 0, '{"requests":"50 premium requests/month","features":["inline suggestions","chat"]}', '["gpt-5.4-mini","claude-sonnet-4.6"]'),
((SELECT id FROM tools WHERE slug='github-copilot'), 'Pro', 10, '{"requests":"300 premium requests/month","features":["inline suggestions","chat","CLI"]}', '["gpt-5.4-mini","claude-sonnet-4.6","gemini-2.5-pro"]'),
((SELECT id FROM tools WHERE slug='github-copilot'), 'Pro+', 39, '{"requests":"1500 premium requests/month","features":["everything in Pro","premium models"]}', '["claude-opus-4.6","gpt-5.4","gemini-3.1-pro","grok-4"]'),
((SELECT id FROM tools WHERE slug='github-copilot'), 'Business', 19, '{"per_user":true,"features":["everything in Pro","org management","IP indemnity"]}', '["gpt-5.4-mini","claude-sonnet-4.6"]'),
((SELECT id FROM tools WHERE slug='github-copilot'), 'Enterprise', 39, '{"per_user":true,"features":["everything in Business","fine-tuning","knowledge bases"]}', '["gpt-5.4","claude-sonnet-4.6","gemini-3.1-pro"]');

-- Codex (via ChatGPT)
INSERT INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='codex'), 'Plus', 20, '{"features":["cloud sandbox","parallel tasks","git integration"]}', '["gpt-5.4","codex-mini"]'),
((SELECT id FROM tools WHERE slug='codex'), 'Pro', 200, '{"features":["everything in Plus","higher rate limits","priority access"]}', '["gpt-5.4","codex-mini"]');

-- Augment Code
INSERT INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='augment-code'), 'Community', 0, '{"features":["basic code completion","chat"]}', '[]'),
((SELECT id FROM tools WHERE slug='augment-code'), 'Indie', 20, '{"features":["advanced completions","codebase context"]}', '[]'),
((SELECT id FROM tools WHERE slug='augment-code'), 'Developer', 50, '{"features":["everything in Indie","priority support","higher limits"]}', '[]');

-- Roo Code (BYOK)
INSERT INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='roo-code'), 'Free (BYOK)', 0, '{"features":["multi-provider","custom models","VS Code"]}', '["any-via-api"]');

-- Aider (BYOK)
INSERT INTO pricing_plans (tool_id, plan_name, price_monthly, features, models_included) VALUES
((SELECT id FROM tools WHERE slug='aider'), 'Free (BYOK)', 0, '{"features":["open source","git-native","multi-model"]}', '["any-via-api"]');

-- ============================================================
-- 4. MODELS (with token pricing)
-- ============================================================

-- Claude family
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window) VALUES
('Claude Opus 4.6', 'claude-opus-4.6', 'Anthropic', 'Claude', '2026-02-05', 'Most capable Claude model. Exceptional at complex reasoning, nuanced understanding, and agentic coding. 1M context.', 1, 5.00, 25.00, 0.50, 1000000),
('Claude Sonnet 4.6', 'claude-sonnet-4.6', 'Anthropic', 'Claude', '2026-02-17', 'Balanced Claude model. Strong coding and reasoning at lower cost. 1M context.', 1, 3.00, 15.00, 0.30, 1000000),
('Claude Haiku 4.5', 'claude-haiku-4.5', 'Anthropic', 'Claude', '2025-10-29', 'Fast and affordable Claude model. 200K context.', 1, 1.00, 5.00, 0.10, 200000),
('Claude Opus 4', 'claude-opus-4', 'Anthropic', 'Claude', '2025-05-22', 'Previous-generation Opus. Superseded by Opus 4.6.', 0, 15.00, 75.00, NULL, 200000),
('Claude Sonnet 4', 'claude-sonnet-4', 'Anthropic', 'Claude', '2025-05-22', 'Previous-generation Sonnet. Superseded by Sonnet 4.6.', 0, 3.00, 15.00, NULL, 200000);

-- OpenAI family
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window) VALUES
('GPT-5.4', 'gpt-5.4', 'OpenAI', 'GPT', '2026-03-05', 'OpenAI flagship. Unified architecture with strong coding and reasoning. Supports reasoning effort levels (none/low/medium/high/xhigh). 1.05M context.', 1, 2.50, 15.00, 0.25, 1050000),
('GPT-5.4 Pro', 'gpt-5.4-pro', 'OpenAI', 'GPT', '2026-03-05', 'OpenAI most advanced model. Enhanced reasoning for complex, high-stakes tasks. 1.05M context. Optimized for agentic coding and multi-step problem solving.', 1, 30.00, 180.00, 3.00, 1050000),
('GPT-5.4 Mini', 'gpt-5.4-mini', 'OpenAI', 'GPT', '2026-03-17', 'Smaller, faster GPT-5.4 variant for coding, computer use, and subagents. 400K context.', 1, 0.75, 4.50, 0.075, 400000),
('GPT-5.4 Nano', 'gpt-5.4-nano', 'OpenAI', 'GPT', '2026-03-17', 'Cheapest GPT-5.4-class model for simple high-volume tasks. 400K context.', 1, 0.20, 1.25, 0.02, 400000),
('GPT-o3', 'gpt-o3', 'OpenAI', 'GPT-o', '2025-04-16', 'OpenAI reasoning model with extended thinking. Strong on complex problems. 200K context.', 1, 10.00, 40.00, NULL, 200000),
('GPT-4o', 'gpt-4o', 'OpenAI', 'GPT', '2024-05-13', 'Previous-generation OpenAI multimodal flagship. Superseded by GPT-5.4. 128K context.', 0, 2.50, 10.00, NULL, 128000),
('Codex Mini', 'codex-mini', 'OpenAI', 'Codex', '2026-01-01', 'Codex coding model optimized for software engineering tasks.', 1, 1.50, 6.00, NULL, NULL);

-- Google family
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, context_window) VALUES
('Gemini 3.1 Pro Preview', 'gemini-3.1-pro', 'Google', 'Gemini', '2026-02-01', 'Latest Gemini preview. Top-tier reasoning and coding. 1M context.', 1, 2.00, 12.00, 1000000),
('Gemini 3 Pro', 'gemini-3-pro', 'Google', 'Gemini', '2025-12-01', 'Google flagship. Strong coding and multimodal. 1M context.', 1, 2.00, 12.00, 1000000),
('Gemini 3 Flash', 'gemini-3-flash', 'Google', 'Gemini', '2025-12-17', 'Fast Google model optimized for speed and cost. 1M context.', 1, 0.50, 3.00, 1000000),
('Gemini 2.5 Pro', 'gemini-2.5-pro', 'Google', 'Gemini', '2025-03-25', 'Previous-gen Google flagship. 1M context.', 1, 1.25, 10.00, 1000000),
('Gemini 2.5 Flash', 'gemini-2.5-flash', 'Google', 'Gemini', '2025-04-17', 'Fast and affordable Gemini model. 1M context.', 1, 0.30, 2.50, 1000000);

-- DeepSeek family
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok, context_window, params_total, params_active, is_open_weight) VALUES
('DeepSeek V3.2', 'deepseek-v3.2', 'DeepSeek', 'DeepSeek', '2025-09-29', 'Open-weight MoE model. Strong coding at very low cost. 128K context.', 1, 0.28, 0.42, 0.028, 128000, '671B', '37B', 1),
('DeepSeek R1', 'deepseek-r1', 'DeepSeek', 'DeepSeek', '2025-01-20', 'Open-weight reasoning model. 128K context.', 1, 0.50, 2.18, NULL, 128000, NULL, NULL, 1);

-- Meta family
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, context_window, params_total, params_active, is_open_weight) VALUES
('Llama 4 Scout', 'llama-4-scout', 'Meta', 'Llama', '2025-04-05', 'Meta open-weight model with massive 10M context window.', 1, 0.10, 0.25, 10000000, '109B', '17B', 1),
('Llama 4 Maverick', 'llama-4-maverick', 'Meta', 'Llama', '2025-04-05', 'Meta open-weight model. Competitive coding performance.', 1, 0.19, 0.49, NULL, '400B', '17B', 1);

-- Mistral family
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, context_window, params_total, params_active, is_open_weight) VALUES
('Mistral Large 3', 'mistral-large-3', 'Mistral', 'Mistral', '2025-12-02', 'Mistral flagship MoE model. 256K context.', 1, 2.00, 7.00, 256000, '675B', '41B', 1),
('Mistral Medium 3', 'mistral-medium-3', 'Mistral', 'Mistral', '2025-05-07', 'Mid-range Mistral model.', 1, 0.40, 2.00, NULL, NULL, NULL, 0),
('Mistral Small 4', 'mistral-small-4', 'Mistral', 'Mistral', '2026-03-17', 'Compact MoE model. Cost-effective.', 1, 0.30, 1.00, NULL, '119B', NULL, 1);

-- Qwen family
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok, params_total, is_open_weight) VALUES
('Qwen 3.5', 'qwen-3.5', 'Alibaba', 'Qwen', '2026-02-16', 'Large open-weight model from Alibaba.', 1, 0.50, 1.50, '397B', 1),
('Qwen 3', 'qwen-3', 'Alibaba', 'Qwen', '2025-04-01', 'Open-weight model from Alibaba.', 1, NULL, NULL, NULL, 1);

-- xAI family
INSERT INTO models (name, slug, vendor, family, release_date, description, is_active, input_price_per_mtok, output_price_per_mtok) VALUES
('Grok 4', 'grok-4', 'xAI', 'Grok', '2025-07-09', 'xAI flagship model. Strong reasoning capabilities.', 1, 3.00, 15.00),
('Grok 4.1 Fast', 'grok-4.1-fast', 'xAI', 'Grok', '2025-11-19', 'Fast, cost-effective Grok variant.', 1, 0.20, 0.50);

-- ============================================================
-- 5. BENCHMARKS
-- ============================================================

-- SWE-bench Verified (coding, max_score=100)
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'SWE-bench Verified', 'coding', 80.8, 100),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'SWE-bench Verified', 'coding', 79.6, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-pro'), 'SWE-bench Verified', 'coding', 85.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'SWE-bench Verified', 'coding', 77.2, 100),
((SELECT id FROM models WHERE slug='gpt-o3'), 'SWE-bench Verified', 'coding', 69.1, 100),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'SWE-bench Verified', 'coding', 80.6, 100),
((SELECT id FROM models WHERE slug='gemini-3-pro'), 'SWE-bench Verified', 'coding', 75.0, 100),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'SWE-bench Verified', 'coding', 76.2, 100),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'SWE-bench Verified', 'coding', 65.0, 100),
((SELECT id FROM models WHERE slug='mistral-large-3'), 'SWE-bench Verified', 'coding', 55.0, 100),
((SELECT id FROM models WHERE slug='qwen-3.5'), 'SWE-bench Verified', 'coding', 60.0, 100);

-- GPQA Diamond (reasoning, max_score=100)
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'GPQA Diamond', 'reasoning', 91.3, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-pro'), 'GPQA Diamond', 'reasoning', 95.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'GPQA Diamond', 'reasoning', 92.0, 100),
((SELECT id FROM models WHERE slug='gpt-o3'), 'GPQA Diamond', 'reasoning', 83.3, 100),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'GPQA Diamond', 'reasoning', 94.1, 100),
((SELECT id FROM models WHERE slug='gemini-3-pro'), 'GPQA Diamond', 'reasoning', 91.9, 100),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'GPQA Diamond', 'reasoning', 75.0, 100),
((SELECT id FROM models WHERE slug='grok-4'), 'GPQA Diamond', 'reasoning', 80.0, 100);

-- MMLU Pro (reasoning, max_score=100)
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='gemini-3-pro'), 'MMLU Pro', 'reasoning', 90.1, 100),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'MMLU Pro', 'reasoning', 89.5, 100),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'MMLU Pro', 'reasoning', 88.0, 100),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'MMLU Pro', 'reasoning', 85.0, 100);

-- LiveCodeBench (coding, max_score=100)
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='gemini-3-pro'), 'LiveCodeBench', 'coding', 91.7, 100),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'LiveCodeBench', 'coding', 90.8, 100),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'LiveCodeBench', 'coding', 85.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'LiveCodeBench', 'coding', 82.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-pro'), 'LiveCodeBench', 'coding', 90.0, 100),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'LiveCodeBench', 'coding', 83.3, 100);

-- Chatbot Arena ELO (nuance, max_score=2000)
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'Chatbot Arena ELO', 'nuance', 1504, 2000),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'Chatbot Arena ELO', 'nuance', 1500, 2000),
((SELECT id FROM models WHERE slug='gemini-3-pro'), 'Chatbot Arena ELO', 'nuance', 1485, 2000),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'Chatbot Arena ELO', 'nuance', 1480, 2000),
((SELECT id FROM models WHERE slug='gpt-5.4-pro'), 'Chatbot Arena ELO', 'nuance', 1530, 2000),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'Chatbot Arena ELO', 'nuance', 1470, 2000),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'Chatbot Arena ELO', 'nuance', 1420, 2000),
((SELECT id FROM models WHERE slug='qwen-3.5'), 'Chatbot Arena ELO', 'nuance', 1410, 2000),
((SELECT id FROM models WHERE slug='mistral-large-3'), 'Chatbot Arena ELO', 'nuance', 1400, 2000);

-- TAU-bench Retail (agentic, max_score=100)
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'TAU-bench Retail', 'agentic', 86.0, 100),
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'TAU-bench Retail', 'agentic', 85.0, 100),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'TAU-bench Retail', 'agentic', 80.0, 100),
((SELECT id FROM models WHERE slug='gemini-3-pro'), 'TAU-bench Retail', 'agentic', 78.0, 100);

-- Human Nuance Understanding (nuance, max_score=100)
INSERT INTO benchmarks (model_id, benchmark_name, category, score, max_score) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), 'Human Nuance Understanding', 'nuance', 95, 100),
((SELECT id FROM models WHERE slug='gpt-5.4'), 'Human Nuance Understanding', 'nuance', 92, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-pro'), 'Human Nuance Understanding', 'nuance', 94, 100),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), 'Human Nuance Understanding', 'nuance', 88, 100),
((SELECT id FROM models WHERE slug='grok-4'), 'Human Nuance Understanding', 'nuance', 85, 100),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), 'Human Nuance Understanding', 'nuance', 84, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), 'Human Nuance Understanding', 'nuance', 75, 100),
((SELECT id FROM models WHERE slug='gemini-3-flash'), 'Human Nuance Understanding', 'nuance', 72, 100),
((SELECT id FROM models WHERE slug='mistral-large-3'), 'Human Nuance Understanding', 'nuance', 70, 100),
((SELECT id FROM models WHERE slug='deepseek-v3.2'), 'Human Nuance Understanding', 'nuance', 68, 100),
((SELECT id FROM models WHERE slug='qwen-3.5'), 'Human Nuance Understanding', 'nuance', 66, 100),
((SELECT id FROM models WHERE slug='llama-4-maverick'), 'Human Nuance Understanding', 'nuance', 62, 100),
((SELECT id FROM models WHERE slug='gpt-5.4-nano'), 'Human Nuance Understanding', 'nuance', 55, 100);

-- ============================================================
-- 6. MODEL AVAILABILITY
-- ============================================================

-- Claude Code Pro
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Pro'), 'full');

-- Claude Code Max 5x
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5x'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5x'), 'full'),
((SELECT id FROM models WHERE slug='claude-haiku-4.5'), (SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5x'), 'full');

-- Cursor Pro
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-pro'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro'), 'credits');

-- Cursor Pro+
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='cursor'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='cursor') AND plan_name='Pro+'), 'credits');

-- Windsurf Pro
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits'),
((SELECT id FROM models WHERE slug='gemini-3-flash'), (SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 'credits');

-- GitHub Copilot Pro
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4-mini'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='claude-sonnet-4.6'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='gemini-2.5-pro'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro'), 'full');

-- GitHub Copilot Pro+
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='claude-opus-4.6'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='gemini-3.1-pro'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full'),
((SELECT id FROM models WHERE slug='grok-4'), (SELECT id FROM tools WHERE slug='github-copilot'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='github-copilot') AND plan_name='Pro+'), 'full');

-- Codex Pro
INSERT INTO model_availability (model_id, tool_id, plan_id, access_level) VALUES
((SELECT id FROM models WHERE slug='gpt-5.4'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full'),
((SELECT id FROM models WHERE slug='codex-mini'), (SELECT id FROM tools WHERE slug='codex'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='codex') AND plan_name='Pro'), 'full');

-- ============================================================
-- 7. USER SUBSCRIPTIONS
-- ============================================================
INSERT INTO user_subscriptions (tool_id, plan_id, monthly_cost, started_at, is_active) VALUES
((SELECT id FROM tools WHERE slug='claude-code'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='claude-code') AND plan_name='Max 5x'), 100, '2025-01-01', 1),
((SELECT id FROM tools WHERE slug='windsurf'), (SELECT id FROM pricing_plans WHERE tool_id=(SELECT id FROM tools WHERE slug='windsurf') AND plan_name='Pro'), 15, '2025-03-01', 1);

-- ============================================================
-- 8. USER PREFERENCES
-- ============================================================
INSERT INTO user_preferences (key, value) VALUES
('primary_languages', '["python","javascript"]'),
('project_types', '["prediction-algorithm","cloudflare-workers","sports-betting","saas"]'),
('monthly_budget', '150'),
('digest_frequency', '"weekly"'),
('digest_email', '""');
