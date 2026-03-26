export const RSS_FEEDS = [
  { name: 'Anthropic Blog', slug: 'rss:anthropic', url: 'https://www.anthropic.com/blog/rss.xml' },
  { name: 'OpenAI Blog', slug: 'rss:openai', url: 'https://openai.com/blog/rss/' },
  { name: 'Google AI Blog', slug: 'rss:google-ai', url: 'https://blog.google/technology/ai/rss/' },
  { name: 'HuggingFace Blog', slug: 'rss:huggingface', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'TechCrunch AI', slug: 'rss:techcrunch-ai', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'The Verge AI', slug: 'rss:verge-ai', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml' },
  { name: 'Ars Technica', slug: 'rss:arstechnica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
];

export const REDDIT_SOURCES = [
  { name: 'r/LocalLLaMA', slug: 'reddit:locallama', url: 'https://www.reddit.com/r/LocalLLaMA/hot.json?limit=25' },
  { name: 'r/MachineLearning', slug: 'reddit:ml', url: 'https://www.reddit.com/r/MachineLearning/hot.json?limit=25' },
  { name: 'r/artificial', slug: 'reddit:artificial', url: 'https://www.reddit.com/r/artificial/hot.json?limit=25' },
];

export const HN_QUERIES = [
  'AI LLM',
  'artificial intelligence coding',
  'Claude GPT Gemini',
];

export const PRICING_TARGETS = [
  { tool_slug: 'cursor', url: 'https://www.cursor.com/pricing' },
  { tool_slug: 'windsurf', url: 'https://windsurf.com/pricing' },
  { tool_slug: 'github-copilot', url: 'https://github.com/features/copilot' },
  { tool_slug: 'claude-code', url: 'https://www.anthropic.com/claude/code' },
  { tool_slug: 'aider', url: 'https://aider.chat' },
  { tool_slug: 'cody', url: 'https://sourcegraph.com/cody/pricing' },
  { tool_slug: 'codex', url: 'https://openai.com/codex' },
  { tool_slug: 'jetbrains-ai', url: 'https://www.jetbrains.com/ai/' },
  { tool_slug: 'tabnine', url: 'https://www.tabnine.com/pricing' },
  { tool_slug: 'continue-dev', url: 'https://continue.dev/pricing' },
  { tool_slug: 'augment-code', url: 'https://www.augmentcode.com/pricing' },
  { tool_slug: 'amazon-q', url: 'https://aws.amazon.com/q/developer/pricing/' },
  { tool_slug: 'gemini-code-assist', url: 'https://cloud.google.com/gemini/docs/codeassist/overview' },
  { tool_slug: 'roo-code', url: 'https://roocode.com' },
  { tool_slug: 'zed-ai', url: 'https://zed.dev/pricing' },
];

// Known AI vendors and their model naming patterns for auto-discovery
export const KNOWN_VENDORS = {
  'Anthropic': { family: 'Claude', prefixes: ['claude', 'opus', 'sonnet', 'haiku'] },
  'OpenAI': { family: 'GPT', prefixes: ['gpt-', 'gpt ', 'o1', 'o3', 'o4', 'codex', 'chatgpt'] },
  'Google': { family: 'Gemini', prefixes: ['gemini', 'gemma'] },
  'Meta': { family: 'Llama', prefixes: ['llama'] },
  'DeepSeek': { family: 'DeepSeek', prefixes: ['deepseek'] },
  'Mistral AI': { family: 'Mistral', prefixes: ['mistral', 'codestral', 'pixtral'] },
  'Alibaba': { family: 'Qwen', prefixes: ['qwen'] },
  'xAI': { family: 'Grok', prefixes: ['grok'] },
  'Zhipu AI': { family: 'GLM', prefixes: ['glm', 'z ai'] },
  'MiniMax': { family: 'MiniMax', prefixes: ['minimax', 'abab'] },
  'Moonshot': { family: 'Kimi', prefixes: ['kimi', 'moonshot'] },
  'Cohere': { family: 'Command', prefixes: ['command', 'cohere'] },
  'AI21': { family: 'Jamba', prefixes: ['jamba', 'ai21'] },
  'Amazon': { family: 'Nova', prefixes: ['nova', 'amazon nova'] },
};
