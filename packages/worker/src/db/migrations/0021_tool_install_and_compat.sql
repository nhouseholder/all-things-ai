-- Add install info to tools (IDE tools like Cursor, Claude Code, etc.)
ALTER TABLE tools ADD COLUMN install_url TEXT;
ALTER TABLE tools ADD COLUMN install_method TEXT; -- 'download', 'npm', 'pip', 'brew', 'marketplace', 'web'

-- Add model compatibility to coding_tools (plugins, MCP servers, skills, etc.)
ALTER TABLE coding_tools ADD COLUMN compatible_models TEXT; -- JSON array e.g. '["claude","gpt-4","gemini","any"]'
ALTER TABLE coding_tools ADD COLUMN install_url TEXT;        -- Direct install link

-- ═══════════════════════════════════════════════════════
-- Populate: IDE Tools — install info
-- ═══════════════════════════════════════════════════════
UPDATE tools SET install_url = 'https://docs.anthropic.com/en/docs/claude-code/getting-started', install_method = 'npm' WHERE slug = 'claude-code';
UPDATE tools SET install_url = 'https://www.cursor.com/downloads', install_method = 'download' WHERE slug = 'cursor';
UPDATE tools SET install_url = 'https://windsurf.com/download', install_method = 'download' WHERE slug = 'windsurf';
UPDATE tools SET install_url = 'https://marketplace.visualstudio.com/items?itemName=GitHub.copilot', install_method = 'marketplace' WHERE slug = 'github-copilot';
UPDATE tools SET install_url = 'https://openai.com/codex', install_method = 'web' WHERE slug = 'codex';
UPDATE tools SET install_url = 'https://marketplace.visualstudio.com/items?itemName=RooVeterinaryInc.roo-cline', install_method = 'marketplace' WHERE slug = 'roo-code';
UPDATE tools SET install_url = 'https://aider.chat/docs/install.html', install_method = 'pip' WHERE slug = 'aider';
UPDATE tools SET install_url = 'https://antigravity.dev', install_method = 'download' WHERE slug = 'antigravity';
UPDATE tools SET install_url = 'https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.amazon-q-vscode', install_method = 'marketplace' WHERE slug = 'amazon-q';
UPDATE tools SET install_url = 'https://www.tabnine.com/install', install_method = 'marketplace' WHERE slug = 'tabnine';

-- ═══════════════════════════════════════════════════════
-- Populate: Coding Tools — model compatibility + install URLs
-- ═══════════════════════════════════════════════════════

-- Claude Code ecosystem (Claude-specific)
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]', install_url = 'https://github.com/nhouseholder/nicks-claude-code-superpowers' WHERE slug = 'claude-code-superpowers';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]', install_url = 'https://github.com/anthropics/claude-code' WHERE slug = 'awesome-claude-code';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]', install_url = 'https://github.com/NeoLabHQ/context-engineering-kit' WHERE slug = 'context-engineering-kit';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]', install_url = 'https://github.com/anthropics/claude-code' WHERE slug = 'claude-code-hooks';

-- MCP Servers (universal — work with any MCP-compatible client)
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5","gpt-4o","gemini-2.5-pro"]', install_url = 'https://github.com/ppl-ai/modelcontextprotocol' WHERE slug = 'perplexity-mcp';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5","gpt-4o","gemini-2.5-pro"]', install_url = 'https://github.com/modelcontextprotocol/servers' WHERE slug = 'github-mcp';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5","gpt-4o","gemini-2.5-pro"]', install_url = 'https://github.com/modelcontextprotocol/servers' WHERE slug = 'filesystem-mcp';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5","gpt-4o","gemini-2.5-pro"]', install_url = 'https://github.com/modelcontextprotocol/servers' WHERE slug = 'postgres-mcp';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5","gpt-4o","gemini-2.5-pro"]', install_url = 'https://github.com/modelcontextprotocol/servers' WHERE slug = 'puppeteer-mcp';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5","gpt-4o","gemini-2.5-pro"]', install_url = 'https://github.com/modelcontextprotocol/servers' WHERE slug = 'slack-mcp';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5","gpt-4o","gemini-2.5-pro"]', install_url = 'https://github.com/wonderwhy-er/DesktopCommander' WHERE slug = 'desktop-commander';
UPDATE coding_tools SET compatible_models = '["any"]', install_url = 'https://smithery.ai' WHERE slug = 'smithery';

-- IDE Extensions
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","gpt-4o","gpt-4.1","gemini-2.5-pro","cursor-small"]', install_url = 'https://www.cursor.com/downloads' WHERE slug = 'cursor-ide';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","gpt-4o","gpt-4.1","gemini-2.5-pro"]', install_url = 'https://windsurf.com/download' WHERE slug = 'windsurf-ide';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","gpt-4o","gpt-4.1","gemini-2.5-pro","deepseek-v3","llama-3.3-70b","any-via-api"]', install_url = 'https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev' WHERE slug = 'cline';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","gpt-4o","gpt-4.1","gemini-2.5-pro","deepseek-v3","llama-3.3-70b","any-via-api"]', install_url = 'https://marketplace.visualstudio.com/items?itemName=Continue.continue' WHERE slug = 'continue-dev';
UPDATE coding_tools SET compatible_models = '["gpt-4o","gpt-4.1","claude-sonnet-4","claude-opus-4","gemini-2.5-pro"]', install_url = 'https://marketplace.visualstudio.com/items?itemName=GitHub.copilot' WHERE slug = 'github-copilot';

-- CLI Tools
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]', install_url = 'https://docs.anthropic.com/en/docs/claude-code/getting-started' WHERE slug = 'claude-code-cli';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","gpt-4o","gpt-4.1","gemini-2.5-pro","deepseek-v3","any-via-api"]', install_url = 'https://aider.chat/docs/install.html' WHERE slug = 'aider';
UPDATE coding_tools SET compatible_models = '["gpt-4o","claude-sonnet-4","any-via-api"]', install_url = 'https://github.com/OpenInterpreter/open-interpreter' WHERE slug = 'open-interpreter';
UPDATE coding_tools SET compatible_models = '["gpt-4o","claude-sonnet-4","any-via-api"]', install_url = 'https://github.com/gpt-engineer-org/gpt-engineer' WHERE slug = 'gpt-engineer';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4"]', install_url = 'https://github.com/rtklib/rtk' WHERE slug = 'rtk';

-- Agent Frameworks
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]', install_url = 'https://github.com/anthropics/claude-agent-sdk' WHERE slug = 'claude-agent-sdk';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","gpt-4o","gpt-4.1","gemini-2.5-pro","any-via-api"]', install_url = 'https://python.langchain.com/docs/get_started/installation' WHERE slug = 'langchain';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","gpt-4o","gpt-4.1","any-via-api"]', install_url = 'https://docs.crewai.com/installation' WHERE slug = 'crewai';
UPDATE coding_tools SET compatible_models = '["gpt-4o","gpt-4.1","claude-sonnet-4","any-via-api"]', install_url = 'https://github.com/microsoft/autogen' WHERE slug = 'autogen';

-- Utilities
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]', install_url = 'https://chromewebstore.google.com' WHERE slug = 'claude-in-chrome';
UPDATE coding_tools SET compatible_models = '["claude-opus-4","claude-sonnet-4","claude-haiku-3.5"]' WHERE slug = 'claude-preview';
UPDATE coding_tools SET compatible_models = '["any"]', install_url = 'https://github.com/yamadashy/repomix' WHERE slug = 'repomix';
UPDATE coding_tools SET compatible_models = '["gpt-4o","claude-sonnet-4","any-via-api"]', install_url = 'https://github.com/BuilderIO/ai-shell' WHERE slug = 'ai-shell';
UPDATE coding_tools SET compatible_models = '["any"]', install_url = 'https://pieces.app/desktop-download' WHERE slug = 'pieces';
UPDATE coding_tools SET compatible_models = '["claude-sonnet-4","gpt-4o"]', install_url = 'https://v0.dev' WHERE slug = 'v0-vercel';
UPDATE coding_tools SET compatible_models = '["claude-sonnet-4","gpt-4o"]', install_url = 'https://bolt.new' WHERE slug = 'bolt-new';
UPDATE coding_tools SET compatible_models = '["claude-sonnet-4","gpt-4o"]', install_url = 'https://lovable.dev' WHERE slug = 'lovable';
