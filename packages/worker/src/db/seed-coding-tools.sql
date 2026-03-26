-- ============================================================
-- Seed: AI Coding Tools Directory
-- 40+ real tools across skills, MCP servers, repos, CLI, IDE, agents
-- ============================================================

-- ── Claude Code Skills & Repos ──────────────────────────────

INSERT OR IGNORE INTO coding_tools (name, slug, category, subcategory, description, short_description, url, github_url, platform, languages, frameworks, use_cases, setup_complexity, setup_instructions, requires, pricing, stars, is_featured) VALUES
('Claude Code Superpowers', 'claude-code-superpowers', 'github-repo', 'skills', 'Comprehensive intelligence stack for Claude Code CLI with 67 skills, 4 hooks, 9 commands, and a continuous learning system. Includes reflexion, debugging, memory management, deployment, and autonomous coding patterns.', '67 skills + hooks + commands for Claude Code', 'https://github.com/nhouseholder/nicks-claude-code-superpowers', 'https://github.com/nhouseholder/nicks-claude-code-superpowers', 'claude-code', '["javascript","python"]', '["react","nextjs","express"]', '["debugging","testing","deployment","code-review","memory","automation"]', 'easy', 'Clone repo → copy skills/ and commands/ to ~/.claude/', '["claude-code"]', 'free', 50, 1),

('Awesome Claude Code', 'awesome-claude-code', 'github-repo', 'directory', 'Community-curated list of Claude Code resources including skills, hooks, MCP servers, tips, and workflows. The go-to directory for discovering Claude Code ecosystem tools.', 'Curated list of Claude Code resources', 'https://github.com/anthropics/claude-code', 'https://github.com/anthropics/claude-code', 'claude-code', '[]', '[]', '["research","discovery"]', 'easy', 'Browse the README for categorized resources', '["claude-code"]', 'free', 5000, 1),

('Context Engineering Kit', 'context-engineering-kit', 'github-repo', 'skills', 'Reflexion-based skill framework for Claude Code. Implements self-refinement loops, structured thinking, and context optimization patterns.', 'Reflexion and self-refinement skills', 'https://github.com/NeoLabHQ/context-engineering-kit', 'https://github.com/NeoLabHQ/context-engineering-kit', 'claude-code', '["javascript"]', '[]', '["reasoning","planning","code-review"]', 'easy', 'Copy skills to ~/.claude/skills/', '["claude-code"]', 'free', 200, 0),

('Claude Code Hooks Collection', 'claude-code-hooks', 'github-repo', 'hooks', 'Pre-built hooks for Claude Code including auto-formatting, test running, linting on save, and commit message generation. Drop-in automation for common workflows.', 'Pre-built automation hooks for Claude Code', 'https://github.com/anthropics/claude-code', 'https://github.com/anthropics/claude-code', 'claude-code', '["javascript","python"]', '[]', '["automation","formatting","testing"]', 'easy', 'Add hook configs to ~/.claude/settings.json', '["claude-code"]', 'free', NULL, 0);

-- ── MCP Servers ─────────────────────────────────────────────

INSERT OR IGNORE INTO coding_tools (name, slug, category, subcategory, description, short_description, url, github_url, platform, languages, frameworks, use_cases, setup_complexity, setup_instructions, requires, pricing, stars, is_featured) VALUES
('Perplexity MCP', 'perplexity-mcp', 'mcp-server', 'search', 'MCP server that connects Claude to Perplexity AI for real-time web search with cited sources. Essential for research-backed coding decisions and finding documentation.', 'AI-powered web search via Perplexity', 'https://github.com/ppl-ai/modelcontextprotocol', 'https://github.com/ppl-ai/modelcontextprotocol', 'universal', '[]', '[]', '["research","documentation","discovery"]', 'medium', 'npm install → add to MCP config → set PERPLEXITY_API_KEY', '["node","api-key"]', 'freemium', 500, 1),

('GitHub MCP Server', 'github-mcp', 'mcp-server', 'git', 'Official MCP server for GitHub. Create issues, manage PRs, search repos, read files, and manage branches directly from Claude.', 'GitHub integration via MCP', 'https://github.com/modelcontextprotocol/servers', 'https://github.com/modelcontextprotocol/servers', 'universal', '[]', '[]', '["git","collaboration","code-review"]', 'medium', 'npx @modelcontextprotocol/server-github → add to MCP config', '["node","github-token"]', 'free', 15000, 1),

('Filesystem MCP Server', 'filesystem-mcp', 'mcp-server', 'filesystem', 'MCP server for safe filesystem operations. Read, write, search, and manage files with configurable access controls.', 'Safe filesystem access via MCP', 'https://github.com/modelcontextprotocol/servers', 'https://github.com/modelcontextprotocol/servers', 'universal', '[]', '[]', '["file-management","automation"]', 'easy', 'npx @modelcontextprotocol/server-filesystem /path/to/allow', '["node"]', 'free', 15000, 0),

('PostgreSQL MCP Server', 'postgres-mcp', 'mcp-server', 'database', 'MCP server for PostgreSQL databases. Run queries, explore schemas, and manage data directly from Claude.', 'PostgreSQL database access via MCP', 'https://github.com/modelcontextprotocol/servers', 'https://github.com/modelcontextprotocol/servers', 'universal', '["sql"]', '["postgres","supabase"]', '["database","data-analysis"]', 'medium', 'Set DATABASE_URL → add to MCP config', '["node","postgres"]', 'free', 15000, 0),

('Puppeteer MCP Server', 'puppeteer-mcp', 'mcp-server', 'browser', 'Browser automation via MCP. Navigate pages, take screenshots, click elements, fill forms, and extract data from web pages.', 'Browser automation and scraping via MCP', 'https://github.com/modelcontextprotocol/servers', 'https://github.com/modelcontextprotocol/servers', 'universal', '["javascript"]', '[]', '["testing","scraping","automation"]', 'medium', 'npm install puppeteer → add MCP config', '["node","chrome"]', 'free', 15000, 0),

('Slack MCP Server', 'slack-mcp', 'mcp-server', 'communication', 'MCP server for Slack. Send messages, read channels, search history, and manage conversations from Claude.', 'Slack integration via MCP', 'https://github.com/modelcontextprotocol/servers', 'https://github.com/modelcontextprotocol/servers', 'universal', '[]', '[]', '["communication","automation"]', 'medium', 'Create Slack app → set tokens → add MCP config', '["node","slack-token"]', 'free', 15000, 0),

('Desktop Commander', 'desktop-commander', 'mcp-server', 'system', 'Full desktop control MCP server. Execute commands, manage files, search filesystem, read/write documents, control processes. The Swiss Army knife MCP.', 'Full desktop control and file management', 'https://github.com/wonderwhy-er/DesktopCommander', 'https://github.com/wonderwhy-er/DesktopCommander', 'universal', '["javascript"]', '[]', '["file-management","automation","system"]', 'easy', 'npx @anthropic/desktop-commander → add to MCP config', '["node"]', 'free', 2000, 1),

('Smithery Registry', 'smithery', 'mcp-server', 'directory', 'The largest registry of MCP servers. Browse, search, and install MCP servers for any use case. The npm of MCP.', 'MCP server registry and discovery', 'https://smithery.ai', NULL, 'universal', '[]', '[]', '["discovery","research"]', 'easy', 'Visit smithery.ai → search → follow install instructions', '[]', 'free', NULL, 1);

-- ── IDE Extensions & Editors ────────────────────────────────

INSERT OR IGNORE INTO coding_tools (name, slug, category, subcategory, description, short_description, url, github_url, platform, languages, frameworks, use_cases, setup_complexity, setup_instructions, requires, pricing, stars, is_featured) VALUES
('Cursor', 'cursor-ide', 'ide-extension', 'editor', 'AI-first code editor built on VS Code. Features Composer for multi-file edits, inline AI chat, and automatic context from your codebase. The most popular AI coding IDE.', 'AI-first code editor with Composer', 'https://www.cursor.com', NULL, 'cursor', '["javascript","typescript","python","go","rust"]', '["react","nextjs","express","django","flask"]', '["coding","debugging","refactoring","code-review"]', 'easy', 'Download from cursor.com → import VS Code settings', '[]', 'freemium', NULL, 1),

('Windsurf', 'windsurf-ide', 'ide-extension', 'editor', 'AI coding assistant IDE by Codeium. Features Cascade for agentic multi-step coding, flow-based editing, and deep codebase understanding.', 'Agentic AI coding with Cascade', 'https://windsurf.com', NULL, 'windsurf', '["javascript","typescript","python","go","rust"]', '["react","nextjs","express","django"]', '["coding","debugging","refactoring"]', 'easy', 'Download from windsurf.com', '[]', 'freemium', NULL, 1),

('Cline', 'cline', 'ide-extension', 'agent', 'Autonomous coding agent for VS Code. Can create files, run commands, use the browser, and complete complex tasks with minimal guidance. Supports Claude, GPT, and local models.', 'Autonomous coding agent in VS Code', 'https://github.com/cline/cline', 'https://github.com/cline/cline', 'vscode', '["javascript","typescript","python"]', '[]', '["coding","automation","debugging"]', 'easy', 'Install from VS Code marketplace → set API key', '["vscode","api-key"]', 'free', 20000, 1),

('Continue', 'continue-dev', 'ide-extension', 'assistant', 'Open-source AI coding assistant for VS Code and JetBrains. Tab autocomplete, inline chat, and custom context providers. Supports any LLM.', 'Open-source AI assistant for VS Code/JetBrains', 'https://www.continue.dev', 'https://github.com/continuedev/continue', 'vscode', '["javascript","typescript","python","java","go"]', '[]', '["coding","autocomplete","documentation"]', 'easy', 'Install from marketplace → configure model', '["vscode"]', 'free', 25000, 0),

('GitHub Copilot', 'github-copilot', 'ide-extension', 'assistant', 'GitHub AI pair programmer. Inline suggestions, chat, multi-file edits, and workspace agent. Deeply integrated with GitHub ecosystem.', 'AI pair programmer by GitHub', 'https://github.com/features/copilot', NULL, 'vscode', '["javascript","typescript","python","go","rust","java","c","cpp"]', '[]', '["coding","autocomplete","testing"]', 'easy', 'Install VS Code extension → sign in with GitHub', '["vscode","github"]', 'paid', NULL, 1);

-- ── CLI Tools ───────────────────────────────────────────────

INSERT OR IGNORE INTO coding_tools (name, slug, category, subcategory, description, short_description, url, github_url, platform, languages, frameworks, use_cases, setup_complexity, setup_instructions, requires, pricing, stars, is_featured) VALUES
('Claude Code', 'claude-code-cli', 'cli-tool', 'agent', 'Anthropic official agentic coding CLI. Think, plan, edit files, run commands, manage git, and build features autonomously in your terminal. The backbone of vibe coding.', 'Official Claude agentic coding CLI', 'https://docs.anthropic.com/en/docs/claude-code', NULL, 'claude-code', '["javascript","typescript","python","go","rust"]', '["react","nextjs","express","django","flask"]', '["coding","debugging","testing","deployment","refactoring","code-review"]', 'easy', 'npm install -g @anthropic-ai/claude-code', '["node"]', 'freemium', NULL, 1),

('Aider', 'aider', 'cli-tool', 'agent', 'AI pair programming in your terminal. Edit files with natural language, works with any git repo. Supports Claude, GPT, and local models. Best-in-class for multi-file edits.', 'Terminal AI pair programmer', 'https://aider.chat', 'https://github.com/paul-gauthier/aider', 'terminal', '["python","javascript","typescript"]', '[]', '["coding","refactoring","debugging"]', 'easy', 'pip install aider-chat → aider --model claude-3-opus', '["python","api-key"]', 'free', 25000, 1),

('Open Interpreter', 'open-interpreter', 'cli-tool', 'agent', 'Natural language interface to your computer. Runs code, manages files, browses web, and controls applications. Like ChatGPT Code Interpreter but local.', 'Natural language computer control', 'https://github.com/OpenInterpreter/open-interpreter', 'https://github.com/OpenInterpreter/open-interpreter', 'terminal', '["python","javascript"]', '[]', '["automation","coding","data-analysis"]', 'easy', 'pip install open-interpreter → interpreter', '["python"]', 'free', 55000, 0),

('GPT Engineer', 'gpt-engineer', 'cli-tool', 'agent', 'Generate entire codebases from a prompt. Specify what you want to build, review the plan, and let it generate the full project structure and code.', 'Generate codebases from prompts', 'https://github.com/gpt-engineer-org/gpt-engineer', 'https://github.com/gpt-engineer-org/gpt-engineer', 'terminal', '["python","javascript","typescript"]', '[]', '["scaffolding","prototyping"]', 'easy', 'pip install gpt-engineer → gpte "build a..."', '["python","api-key"]', 'free', 52000, 0),

('RTK (Rust Token Killer)', 'rtk', 'cli-tool', 'optimization', 'Token-optimized CLI proxy for Claude Code. Saves 60-90% on token costs by filtering verbose command output. Hook-based integration with zero config.', 'Token optimization proxy for Claude Code', 'https://github.com/rtklib/rtk', 'https://github.com/rtklib/rtk', 'claude-code', '["rust"]', '[]', '["optimization","cost-saving"]', 'medium', 'cargo install rtk → configure hooks in settings.json', '["rust","claude-code"]', 'free', NULL, 0);

-- ── Agent Frameworks ────────────────────────────────────────

INSERT OR IGNORE INTO coding_tools (name, slug, category, subcategory, description, short_description, url, github_url, platform, languages, frameworks, use_cases, setup_complexity, setup_instructions, requires, pricing, stars, is_featured) VALUES
('Claude Agent SDK', 'claude-agent-sdk', 'framework', 'agent', 'Official Anthropic SDK for building custom AI agents. Multi-turn conversations, tool use, computer use, and orchestration patterns. The foundation for building Claude-powered agents.', 'Build custom AI agents with Claude', 'https://docs.anthropic.com/en/docs/agents', 'https://github.com/anthropics/claude-agent-sdk', 'universal', '["python","javascript","typescript"]', '[]', '["agent-building","automation","tool-use"]', 'medium', 'pip install claude-agent-sdk OR npm install @anthropic-ai/claude-agent-sdk', '["python","api-key"]', 'free', 5000, 1),

('LangChain', 'langchain', 'framework', 'orchestration', 'Framework for building LLM-powered applications. Chains, agents, memory, retrieval, and tool use. The most popular LLM application framework.', 'LLM application framework', 'https://www.langchain.com', 'https://github.com/langchain-ai/langchain', 'universal', '["python","javascript","typescript"]', '[]', '["agent-building","rag","automation"]', 'medium', 'pip install langchain → import and configure', '["python"]', 'free', 100000, 0),

('CrewAI', 'crewai', 'framework', 'agent', 'Framework for orchestrating autonomous AI agents. Define roles, goals, and tasks for a crew of agents that collaborate to complete complex workflows.', 'Multi-agent orchestration framework', 'https://www.crewai.com', 'https://github.com/crewAIInc/crewAI', 'universal', '["python"]', '[]', '["agent-building","automation","collaboration"]', 'medium', 'pip install crewai → define agents and tasks', '["python","api-key"]', 'free', 25000, 0),

('AutoGen', 'autogen', 'framework', 'agent', 'Microsoft framework for multi-agent conversations. Agents can chat with each other, use tools, and collaborate on complex tasks with human-in-the-loop patterns.', 'Multi-agent conversation framework', 'https://github.com/microsoft/autogen', 'https://github.com/microsoft/autogen', 'universal', '["python"]', '[]', '["agent-building","collaboration","automation"]', 'medium', 'pip install autogen → configure agents', '["python","api-key"]', 'free', 35000, 0);

-- ── Utilities & Helpers ─────────────────────────────────────

INSERT OR IGNORE INTO coding_tools (name, slug, category, subcategory, description, short_description, url, github_url, platform, languages, frameworks, use_cases, setup_complexity, setup_instructions, requires, pricing, stars, is_featured) VALUES
('Claude in Chrome', 'claude-in-chrome', 'mcp-server', 'browser', 'Browser automation MCP that lets Claude control Chrome tabs, click elements, fill forms, take screenshots, and navigate websites. Essential for testing and web interaction.', 'Chrome browser automation for Claude', NULL, NULL, 'claude-code', '["javascript"]', '[]', '["testing","scraping","automation","debugging"]', 'easy', 'Install Chrome extension → connects automatically', '["chrome","claude-code"]', 'free', NULL, 1),

('Claude Preview', 'claude-preview', 'mcp-server', 'testing', 'Dev server preview MCP for Claude Code. Start servers, take screenshots, click elements, inspect CSS, read console logs, and verify changes without leaving the terminal.', 'Dev server preview and testing', NULL, NULL, 'claude-code', '["javascript","typescript"]', '["react","nextjs","vite"]', '["testing","debugging","verification"]', 'easy', 'Built into Claude Code — add launch.json config', '["claude-code","node"]', 'free', NULL, 1),

('Repomix', 'repomix', 'cli-tool', 'context', 'Pack your entire codebase into a single AI-friendly text file. Optimized for pasting into Claude, ChatGPT, or any LLM. Respects .gitignore and supports custom filtering.', 'Pack codebase into AI-friendly format', 'https://github.com/yamadashy/repomix', 'https://github.com/yamadashy/repomix', 'universal', '[]', '[]', '["context","documentation","code-review"]', 'easy', 'npx repomix → paste output into AI', '["node"]', 'free', 8000, 0),

('AI Shell', 'ai-shell', 'cli-tool', 'terminal', 'Natural language to shell commands. Describe what you want in plain English, get the exact terminal command. Supports Claude and GPT.', 'Natural language shell commands', 'https://github.com/BuilderIO/ai-shell', 'https://github.com/BuilderIO/ai-shell', 'terminal', '[]', '[]', '["automation","terminal"]', 'easy', 'npm install -g @builder.io/ai-shell → ai "list large files"', '["node","api-key"]', 'free', 4000, 0),

('Pieces for Developers', 'pieces', 'ide-extension', 'snippets', 'AI-powered snippet manager and coding assistant. Save, search, and reuse code snippets with AI-enriched context. Works across IDEs.', 'AI snippet manager across IDEs', 'https://pieces.app', NULL, 'universal', '["javascript","typescript","python","go","java"]', '[]', '["snippets","documentation","productivity"]', 'easy', 'Download from pieces.app → install IDE plugin', '[]', 'freemium', NULL, 0),

('V0 by Vercel', 'v0-vercel', 'cli-tool', 'ui-generation', 'AI-powered UI component generator by Vercel. Describe a UI and get production-ready React + Tailwind code. The fastest way to scaffold UI components.', 'AI UI component generator', 'https://v0.dev', NULL, 'universal', '["typescript","javascript"]', '["react","nextjs","tailwind"]', '["ui-design","scaffolding","prototyping"]', 'easy', 'Visit v0.dev → describe UI → copy generated code', '[]', 'freemium', NULL, 1),

('Bolt.new', 'bolt-new', 'cli-tool', 'scaffolding', 'Full-stack app builder in the browser. Describe what you want, get a complete running app with frontend, backend, and deployment. Built by StackBlitz.', 'Full-stack app builder from prompts', 'https://bolt.new', NULL, 'universal', '["javascript","typescript"]', '["react","nextjs","express"]', '["scaffolding","prototyping","full-stack"]', 'easy', 'Visit bolt.new → describe your app → download code', '[]', 'freemium', NULL, 1),

('Lovable', 'lovable', 'cli-tool', 'scaffolding', 'AI full-stack app builder. Build production apps with Supabase backend, React frontend, and deployment in minutes. Formerly GPT Engineer web.', 'Full-stack app builder with Supabase', 'https://lovable.dev', NULL, 'universal', '["typescript"]', '["react","supabase","tailwind"]', '["scaffolding","prototyping","full-stack"]', 'easy', 'Visit lovable.dev → describe app → deploy', '[]', 'freemium', NULL, 0);

-- ── Tags ────────────────────────────────────────────────────

-- Claude Code Superpowers
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'claude-code' FROM coding_tools WHERE slug='claude-code-superpowers';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'skills' FROM coding_tools WHERE slug='claude-code-superpowers';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'hooks' FROM coding_tools WHERE slug='claude-code-superpowers';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'commands' FROM coding_tools WHERE slug='claude-code-superpowers';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'memory' FROM coding_tools WHERE slug='claude-code-superpowers';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'debugging' FROM coding_tools WHERE slug='claude-code-superpowers';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'deployment' FROM coding_tools WHERE slug='claude-code-superpowers';

-- MCP Servers
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'mcp' FROM coding_tools WHERE category='mcp-server';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'integration' FROM coding_tools WHERE category='mcp-server';

-- CLI tools
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'cli' FROM coding_tools WHERE category='cli-tool';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'terminal' FROM coding_tools WHERE category='cli-tool';

-- IDE extensions
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'ide' FROM coding_tools WHERE category='ide-extension';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'editor' FROM coding_tools WHERE category='ide-extension';

-- Frameworks
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'framework' FROM coding_tools WHERE category='framework';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'agent' FROM coding_tools WHERE category='framework';

-- Featured tools get 'featured' tag
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'featured' FROM coding_tools WHERE is_featured=1;

-- Vibe coding tag for scaffolding/generation tools
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'vibe-coding' FROM coding_tools WHERE slug IN ('v0-vercel','bolt-new','lovable','gpt-engineer','cursor-ide','windsurf-ide','cline','claude-code-cli');

-- Search and research tags
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'search' FROM coding_tools WHERE slug='perplexity-mcp';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'research' FROM coding_tools WHERE slug='perplexity-mcp';

-- Database tags
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'database' FROM coding_tools WHERE slug='postgres-mcp';
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'sql' FROM coding_tools WHERE slug='postgres-mcp';

-- Browser/testing tags
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'browser' FROM coding_tools WHERE slug IN ('puppeteer-mcp','claude-in-chrome');
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'testing' FROM coding_tools WHERE slug IN ('puppeteer-mcp','claude-in-chrome','claude-preview');
INSERT OR IGNORE INTO coding_tool_tags (tool_id, tag) SELECT id, 'screenshot' FROM coding_tools WHERE slug IN ('claude-in-chrome','claude-preview');
