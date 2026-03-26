/**
 * Review Analysis Engine
 *
 * Classifies community reviews by user type (casual / vibe_coder / heavy_coder)
 * and extracts sentiment + coding satisfaction scores using keyword analysis.
 *
 * No external LLM calls — runs entirely on keyword/pattern matching for speed
 * and determinism in a Cloudflare Worker context.
 */

// ── Model name → slug mapping for detection in text ──────────────────────
const MODEL_ALIASES = {
  'claude-opus-4.6':    ['opus 4.6','opus4.6','claude opus','opus 4','claude-opus','opus46'],
  'claude-sonnet-4.6':  ['sonnet 4.6','sonnet4.6','claude sonnet','sonnet 4','claude-sonnet','sonnet46'],
  'claude-haiku-4.5':   ['haiku 4.5','haiku4.5','claude haiku','haiku 4','claude-haiku','haiku45'],
  'gpt-5.4':            ['gpt-5.4','gpt5.4','gpt 5.4','chatgpt 5','gpt-5','o4-mini-high'],
  'gpt-5.4-mini':       ['gpt-5.4-mini','gpt5.4 mini','5.4 mini','gpt-5-mini','o4-mini'],
  'gpt-5.4-nano':       ['gpt-5.4-nano','gpt nano','5.4 nano'],
  'gpt-o3':             ['o3','gpt-o3','o3 reasoning'],
  'gpt-o4-mini':        ['o4-mini','o4 mini','gpt-o4-mini'],
  'gemini-3.1-pro':     ['gemini 3.1 pro','gemini-3.1','gemini 3.1','gemini pro 3.1'],
  'gemini-3-pro':       ['gemini 3 pro','gemini-3-pro','gemini pro 3'],
  'gemini-3-flash':     ['gemini 3 flash','gemini-3-flash','gemini flash','flash 3'],
  'deepseek-v3.2':      ['deepseek v3','deepseek-v3','deepseek 3','deepseek v3.2','deepseek-v3.2'],
  'deepseek-r1':        ['deepseek r1','deepseek-r1','r1 reasoning'],
  'mistral-large-3':    ['mistral large','mistral-large','mistral large 3'],
  'mistral-codestral':  ['codestral','mistral codestral'],
  'qwen-3.5':           ['qwen 3.5','qwen-3.5','qwen3.5','qwen 3'],
  'qwen-3.5-coder':     ['qwen coder','qwen-3.5-coder','qwen3.5 coder'],
  'llama-4-maverick':   ['llama 4 maverick','llama-4-maverick','maverick','llama 4'],
  'llama-4-scout':      ['llama 4 scout','llama-4-scout','scout'],
  'grok-4':             ['grok 4','grok-4','grok4'],
  'grok-3':             ['grok 3','grok-3','grok3'],
  'glm-5':              ['glm-5','glm5','glm 5','zhipu glm','chatglm'],
  'kimi-k2.5':          ['kimi k2.5','kimi-k2.5','kimi k2','moonshot kimi'],
  'minimax-01':         ['minimax','minimax-01','minimax 01'],
  'yi-lightning':       ['yi lightning','yi-lightning','01.ai'],
  'command-a':          ['command a','command-a','cohere command','command r+'],
  'jamba-2':            ['jamba','jamba-2','jamba 2','ai21 jamba'],
  'phi-4':              ['phi 4','phi-4','microsoft phi'],
  'gemma-3':            ['gemma 3','gemma-3','google gemma'],
};

// ── User type classification keywords ────────────────────────────────────
const HEAVY_CODER_SIGNALS = [
  // Technical depth
  'ast','lsp','tree-sitter','compiler','bytecode','jit','gc','garbage collect',
  'tcp','udp','grpc','protobuf','websocket','http2','http3',
  'k8s','kubernetes','terraform','helm','docker','cicd','ci/cd','github actions',
  'distributed','microservice','monorepo','event sourcing','cqrs',
  'type system','generics','lifetime','borrow checker','ownership',
  'profiling','flamegraph','memory leak','thread','concurrency','mutex','deadlock',
  // Tooling depth
  'neovim','tmux','zsh','ssh','systemd','strace','dtrace','valgrind',
  'lldb','gdb','perf','asan','tsan',
  // Specific frameworks requiring depth
  'sqlalchemy','prisma migration','django orm','activerecord',
  'webpack config','vite plugin','esbuild','rollup plugin',
  'cuda','opencl','metal shader','vulkan',
  // Role signals
  'production','staging','deploy','rollback','incident','on-call','pager',
  'code review','pr review','merge conflict','rebase','cherry-pick',
  'senior','staff','principal','architect','lead','10 years','15 years','20 years',
  'my team','our codebase','our infra','our pipeline',
];

const VIBE_CODER_SIGNALS = [
  // Building things but not deep
  'vibe cod','vibe-cod','vibecod',
  'my app','my project','my site','my saas','my startup','side project',
  'react','next.js','nextjs','svelte','vue','tailwind','shadcn',
  'firebase','supabase','vercel','netlify','cloudflare pages',
  'cursor','copilot','windsurf','aider','claude code','bolt','lovable','v0',
  'api call','fetch','axios','rest api','graphql',
  'build','ship','deploy','push to prod','going live',
  'fullstack','full-stack','frontend','backend','full stack',
  'junior','bootcamp','self-taught','learning to code','new to coding',
  'no-code','low-code','prompt engineering',
  'indie hacker','solo dev','solopreneur','indiehacker',
];

const CASUAL_SIGNALS = [
  'chatbot','chat bot','just asking','curious about','eli5','explain like',
  'homework','essay','writing','creative writing','story',
  'image gen','dall-e','midjourney','stable diffusion',
  'subscription','pricing','free tier','token limit',
  'compared to','which is better','vs','versus',
  'new to ai','first time','just started','beginner',
  'customer support','email','summarize','translate',
];

// ── Sentiment keywords ───────────────────────────────────────────────────
const POSITIVE_KEYWORDS = {
  strong: ['incredible','amazing','game-changer','game changer','best model','love it','blown away',
           'exceeded expectations','10/10','perfect','flawless','gold standard','insanely good',
           'never going back','miles ahead','absolutely crushed','phenomenal'],
  moderate: ['great','good','solid','impressed','reliable','consistent','fast','efficient',
             'improved','better','upgrade','helpful','accurate','clean code','well-structured',
             'handles well','gets it right','first try','one-shot'],
  mild: ['decent','ok','fine','works','acceptable','reasonable','not bad','fair','usable'],
};

const NEGATIVE_KEYWORDS = {
  strong: ['terrible','awful','horrible','worst','garbage','useless','broken','completely wrong',
           'waste of money','regret','unusable','dumpster fire','hallucinate','hallucinating',
           'makes things up','invented','fabricated','confidently wrong'],
  moderate: ['disappointing','frustrating','inconsistent','unreliable','slow','expensive',
             'lazy','refuses','won\'t','ignores','misses','wrong','incorrect','fails','buggy',
             'loses context','forgets','truncates','rate limit','rate limited','token limit'],
  mild: ['mediocre','meh','average','so-so','could be better','not great','underwhelming',
         'hit or miss','sometimes','occasionally'],
};

const CODING_SATISFACTION_KEYWORDS = {
  high: ['first attempt','one-shot','works perfectly','no edits needed','production ready',
         'copy paste','just works','ran first try','zero edits','clean','solid code',
         'well-structured','idiomatic','best practices','understood perfectly',
         'read my mind','exactly what I wanted','nailed it'],
  medium: ['needed minor edits','mostly right','close','had to tweak','small fix',
           'almost there','good start','reasonable','with some guidance','after clarifying',
           'second attempt','few iterations'],
  low: ['completely wrong','had to rewrite','off track','didn\'t understand','wrong approach',
        'nonsense','broken code','syntax error','doesn\'t compile','doesn\'t run',
        'had to start over','gave up','switched to','went back to','abandoned',
        'wasted time','more work than doing it myself'],
};

// ── Core analysis functions ──────────────────────────────────────────────

/**
 * Load dynamic aliases from DB, merge with hardcoded, and cache in KV.
 * Call once per scraper run, then pass result to detectModels.
 */
export async function loadAliases(env) {
  // Try KV cache first
  if (env.CACHE) {
    const cached = await env.CACHE.get('model-aliases:merged', 'json');
    if (cached) return cached;
  }

  // Load from DB
  let dynamic = {};
  try {
    const { results } = await env.DB.prepare('SELECT model_slug, alias FROM model_aliases').all();
    for (const row of results) {
      if (!dynamic[row.model_slug]) dynamic[row.model_slug] = [];
      dynamic[row.model_slug].push(row.alias.toLowerCase());
    }
  } catch {
    // Table may not exist yet — use hardcoded only
  }

  // Merge: hardcoded + dynamic
  const merged = { ...MODEL_ALIASES };
  for (const [slug, aliases] of Object.entries(dynamic)) {
    merged[slug] = [...new Set([...(merged[slug] || []), ...aliases])];
  }

  // Cache for 6 hours
  if (env.CACHE) {
    await env.CACHE.put('model-aliases:merged', JSON.stringify(merged), { expirationTtl: 21600 });
  }

  return merged;
}

/**
 * Detect which models are mentioned in a text.
 * @param {string} text - Text to search
 * @param {object} [aliases] - Pre-loaded aliases map. Falls back to hardcoded MODEL_ALIASES.
 * @returns {string[]} array of model slugs
 */
export function detectModels(text, aliases) {
  const lower = text.toLowerCase();
  const found = [];
  const aliasMap = aliases || MODEL_ALIASES;
  for (const [slug, aliasList] of Object.entries(aliasMap)) {
    for (const alias of aliasList) {
      if (lower.includes(alias)) {
        found.push(slug);
        break;
      }
    }
  }
  return [...new Set(found)];
}

/**
 * Classify a user as casual, vibe_coder, or heavy_coder based on their text
 */
export function classifyUserType(text) {
  const lower = text.toLowerCase();
  let heavyScore = 0, vibeScore = 0, casualScore = 0;

  for (const kw of HEAVY_CODER_SIGNALS) {
    if (lower.includes(kw)) heavyScore += 2;
  }
  for (const kw of VIBE_CODER_SIGNALS) {
    if (lower.includes(kw)) vibeScore += 1.5;
  }
  for (const kw of CASUAL_SIGNALS) {
    if (lower.includes(kw)) casualScore += 1;
  }

  // Minimum signal threshold — if very few keywords, default to casual
  const totalSignal = heavyScore + vibeScore + casualScore;
  if (totalSignal < 2) return 'casual';

  if (heavyScore > vibeScore && heavyScore > casualScore) return 'heavy_coder';
  if (vibeScore > casualScore) return 'vibe_coder';
  return 'casual';
}

/**
 * Extract sentiment score from text (-1 to +1)
 */
export function extractSentiment(text) {
  const lower = text.toLowerCase();
  let score = 0;
  let hits = 0;

  for (const kw of POSITIVE_KEYWORDS.strong) {
    if (lower.includes(kw)) { score += 0.9; hits++; }
  }
  for (const kw of POSITIVE_KEYWORDS.moderate) {
    if (lower.includes(kw)) { score += 0.5; hits++; }
  }
  for (const kw of POSITIVE_KEYWORDS.mild) {
    if (lower.includes(kw)) { score += 0.2; hits++; }
  }
  for (const kw of NEGATIVE_KEYWORDS.strong) {
    if (lower.includes(kw)) { score -= 0.9; hits++; }
  }
  for (const kw of NEGATIVE_KEYWORDS.moderate) {
    if (lower.includes(kw)) { score -= 0.5; hits++; }
  }
  for (const kw of NEGATIVE_KEYWORDS.mild) {
    if (lower.includes(kw)) { score -= 0.2; hits++; }
  }

  if (hits === 0) return 0;
  return Math.max(-1, Math.min(1, score / hits));
}

/**
 * Extract coding satisfaction score (0-100) from text
 */
export function extractCodingSatisfaction(text) {
  const lower = text.toLowerCase();
  let score = 50; // neutral baseline
  let hits = 0;

  for (const kw of CODING_SATISFACTION_KEYWORDS.high) {
    if (lower.includes(kw)) { score += 15; hits++; }
  }
  for (const kw of CODING_SATISFACTION_KEYWORDS.medium) {
    if (lower.includes(kw)) { score += 3; hits++; }
  }
  for (const kw of CODING_SATISFACTION_KEYWORDS.low) {
    if (lower.includes(kw)) { score -= 18; hits++; }
  }

  if (hits === 0) return null; // no coding-specific signals
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Extract top complaints and praises from a batch of reviews
 */
export function extractTopThemes(reviews) {
  const complaintCounts = {};
  const praiseCounts = {};

  for (const r of reviews) {
    const lower = r.text.toLowerCase();
    // Count negative themes
    for (const kw of [...NEGATIVE_KEYWORDS.strong, ...NEGATIVE_KEYWORDS.moderate]) {
      if (lower.includes(kw)) {
        complaintCounts[kw] = (complaintCounts[kw] || 0) + 1;
      }
    }
    // Count positive themes
    for (const kw of [...POSITIVE_KEYWORDS.strong, ...POSITIVE_KEYWORDS.moderate]) {
      if (lower.includes(kw)) {
        praiseCounts[kw] = (praiseCounts[kw] || 0) + 1;
      }
    }
  }

  const complaints = Object.entries(complaintCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);

  const praises = Object.entries(praiseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);

  return { complaints, praises };
}

/**
 * Analyze a single review text and return structured analysis
 */
export function analyzeReview(text, postScore = 0, aliases) {
  const models = detectModels(text, aliases);
  const userType = classifyUserType(text);
  const sentiment = extractSentiment(text);
  const codingSatisfaction = extractCodingSatisfaction(text);

  return {
    models,
    userType,
    sentiment,
    codingSatisfaction,
    postScore,
  };
}

/**
 * Aggregate raw reviews into per-model, per-source community_reviews rows
 * @param {Array} rawReviews - analyzed reviews with { model_slug, source, userType, sentiment, codingSatisfaction }
 * @returns {Map<string, Object>} map of "model_slug:source" → aggregated row
 */
export function aggregateReviews(rawReviews) {
  const buckets = new Map();

  for (const r of rawReviews) {
    for (const modelSlug of (r.models || [r.model_slug])) {
      const key = `${modelSlug}:${r.source}`;
      if (!buckets.has(key)) {
        buckets.set(key, {
          model_slug: modelSlug,
          source: r.source,
          reviews: [],
          casual: { sentiments: [], satisfactions: [], count: 0 },
          vibe_coder: { sentiments: [], satisfactions: [], count: 0 },
          heavy_coder: { sentiments: [], satisfactions: [], count: 0 },
        });
      }
      const b = buckets.get(key);
      b.reviews.push(r);
      const ut = r.userType || 'casual';
      b[ut].sentiments.push(r.sentiment);
      if (r.codingSatisfaction != null) {
        b[ut].satisfactions.push(r.codingSatisfaction);
      }
      b[ut].count++;
    }
  }

  const results = new Map();
  for (const [key, b] of buckets) {
    const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const avgOrNull = (arr) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 50;
    const { complaints, praises } = extractTopThemes(b.reviews);

    results.set(key, {
      model_slug: b.model_slug,
      source: b.source,
      sentiment_score: Number(avg([...b.casual.sentiments, ...b.vibe_coder.sentiments, ...b.heavy_coder.sentiments]).toFixed(3)),
      coding_satisfaction: avgOrNull([...b.casual.satisfactions, ...b.vibe_coder.satisfactions, ...b.heavy_coder.satisfactions]),
      common_complaints: JSON.stringify(complaints),
      common_praises: JSON.stringify(praises),
      review_count: b.casual.count + b.vibe_coder.count + b.heavy_coder.count,
      casual_sentiment: Number(avg(b.casual.sentiments).toFixed(3)),
      casual_satisfaction: avgOrNull(b.casual.satisfactions),
      casual_count: b.casual.count,
      vibe_coder_sentiment: Number(avg(b.vibe_coder.sentiments).toFixed(3)),
      vibe_coder_satisfaction: avgOrNull(b.vibe_coder.satisfactions),
      vibe_coder_count: b.vibe_coder.count,
      heavy_coder_sentiment: Number(avg(b.heavy_coder.sentiments).toFixed(3)),
      heavy_coder_satisfaction: avgOrNull(b.heavy_coder.satisfactions),
      heavy_coder_count: b.heavy_coder.count,
    });
  }

  return results;
}
