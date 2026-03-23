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
];
