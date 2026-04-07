// Reverse lookup: OpenRouter vendor prefix → our vendor name + family
const OR_PREFIX_TO_VENDOR = {
  'anthropic': { vendor: 'Anthropic', family: 'Claude' },
  'openai': { vendor: 'OpenAI', family: 'GPT' },
  'google': { vendor: 'Google', family: 'Gemini' },
  'meta-llama': { vendor: 'Meta', family: 'Llama' },
  'meta': { vendor: 'Meta', family: 'Llama' },
  'deepseek': { vendor: 'DeepSeek', family: 'DeepSeek' },
  'mistralai': { vendor: 'Mistral AI', family: 'Mistral' },
  'qwen': { vendor: 'Alibaba', family: 'Qwen' },
  'x-ai': { vendor: 'xAI', family: 'Grok' },
  'zhipu': { vendor: 'Zhipu AI', family: 'GLM' },
  'minimax': { vendor: 'MiniMax', family: 'MiniMax' },
  'moonshot': { vendor: 'Moonshot AI', family: 'Kimi' },
  'cohere': { vendor: 'Cohere', family: 'Command' },
  'ai21': { vendor: 'AI21 Labs', family: 'Jamba' },
  'amazon': { vendor: 'Amazon', family: 'Nova' },
  'microsoft': { vendor: 'Microsoft', family: 'Phi' },
  'perplexity': { vendor: 'Perplexity', family: 'Sonar' },
  'nous': { vendor: 'Nous Research', family: 'Hermes' },
  'nousresearch': { vendor: 'Nous Research', family: 'Hermes' },
  '01-ai': { vendor: '01.AI', family: 'Yi' },
  'bytedance': { vendor: 'ByteDance', family: 'Doubao' },
  'baidu': { vendor: 'Baidu', family: 'Ernie' },
  'reka': { vendor: 'Reka AI', family: 'Reka' },
  'stepfun': { vendor: 'StepFun', family: 'Step' },
  'nvidia': { vendor: 'NVIDIA', family: 'Nemotron' },
  'databricks': { vendor: 'Databricks', family: 'DBRX' },
  'inflection': { vendor: 'Inflection', family: 'Pi' },
  'sao10k': { vendor: 'Sao10k', family: 'Community' },
  'pygmalionai': { vendor: 'PygmalionAI', family: 'Community' },
  'lynn': { vendor: 'Lynn', family: 'Community' },
  'thedrummer': { vendor: 'TheDrummer', family: 'Community' },
  'neversleep': { vendor: 'NeverSleep', family: 'Community' },
  'cognitivecomputations': { vendor: 'Cognitive Computations', family: 'Dolphin' },
  'eva-unit-01': { vendor: 'Eva', family: 'Community' },
  'featherless': { vendor: 'Featherless', family: 'Community' },
  'liquid': { vendor: 'Liquid AI', family: 'LFM' },
  'aion-labs': { vendor: 'Aion Labs', family: 'Aion' },
  'huggingface': { vendor: 'HuggingFace', family: 'Community' },
};

const VENDOR_ALIASES = {
  '01.AI': ['01-ai', '01 ai'],
  'AI21 Labs': ['ai21'],
  'Alibaba': ['alibaba', 'qwen'],
  'Amazon': ['amazon'],
  'Anthropic': ['anthropic'],
  'Baidu': ['baidu'],
  'BigCode': ['bigcode'],
  'ByteDance': ['bytedance', 'byte dance'],
  'Cohere': ['cohere'],
  'DeepSeek': ['deepseek'],
  'Google': ['google', 'gemini', 'gemma'],
  'Meta': ['meta', 'meta llama', 'meta-llama'],
  'Microsoft': ['microsoft'],
  'MiniMax': ['minimax', 'mini max'],
  'Mistral': ['mistral', 'mistral ai', 'mistralai'],
  'Mistral AI': ['mistral', 'mistral ai', 'mistralai'],
  'Moonshot AI': ['moonshot', 'moonshot ai'],
  'Nous Research': ['nous', 'nous research'],
  'OpenAI': ['openai', 'gpt', 'codex', 'o3', 'o4'],
  'Perplexity': ['perplexity', 'sonar'],
  'Reka AI': ['reka', 'reka ai'],
  'Shanghai AI Lab': ['shanghai ai lab', 'internlm'],
  'StepFun': ['stepfun', 'step fun'],
  'xAI': ['xai', 'x ai', 'x-ai', 'grok'],
  'Zhipu AI': ['zhipu', 'z ai', 'z-ai', 'glm'],
};

const MATCH_OVERRIDES = {
  'gpt-o3': ['openai/o3', 'openai/o3-pro'],
  'gpt-5.4-low': ['openai/gpt-5.4'],
  'gpt-5.4': ['openai/gpt-5.4'],
  'gpt-5.4-high': ['openai/gpt-5.4'],
  'gpt-5.4-xhigh': ['openai/gpt-5.4'],
  'gemini-3.1-pro': ['google/gemini-3.1-pro-preview', 'google/gemini-3.1-pro-preview-customtools'],
  'gemini-3-pro': ['google/gemini-3-pro'],
  'gemini-3-flash': ['google/gemini-3-flash-preview'],
};

const ACTIVITY_LABELS = ['Prompt', 'Reasoning', 'Completion'];

export function normalizeModelLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^[^/]+\//, '')
    .replace(/^[a-z0-9 .-]+:\s*/i, '')
    .replace(/\((free|preview|beta|alpha|extended)\)/gi, ' ')
    .replace(/:free\b/gi, ' ')
    .replace(/\b(preview|beta|alpha|extended|customtools|experimental|exp)\b/gi, ' ')
    .replace(/\b(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?(0[1-9]|[12]\d|3[01])\b/g, ' ')
    .replace(/\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g, ' ')
    .replace(/claude[\s-]+(\d+(?:\.\d+)*)[\s-]+(opus|sonnet|haiku)/g, 'claude $2 $1')
    .replace(/gpt[\s-]*o[\s-]*3/g, 'gpt o3')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenizeModelLabel(value) {
  return normalizeModelLabel(value)
    .split(/\s+/)
    .filter(Boolean);
}

export function parseOpenRouterPrice(value, multiplier = 1_000_000) {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Number((numeric * multiplier).toFixed(6));
}

export function parseCompactNumber(value) {
  if (!value) return null;
  const trimmed = String(value).trim().replace(/,/g, '');
  const match = trimmed.match(/^([0-9]*\.?[0-9]+)\s*([KMBT])?$/i);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  const suffix = (match[2] || '').toUpperCase();
  const multiplier = suffix === 'T'
    ? 1_000_000_000_000
    : suffix === 'B'
      ? 1_000_000_000
      : suffix === 'M'
        ? 1_000_000
        : suffix === 'K'
          ? 1_000
          : 1;
  return Math.round(base * multiplier);
}

export function parseActivitySummary(html) {
  const summary = {
    prompt_tokens_daily: null,
    reasoning_tokens_daily: null,
    completion_tokens_daily: null,
  };

  for (const label of ACTIVITY_LABELS) {
    const match = html.match(new RegExp(`aria-label="${label}"[\\s\\S]*?<div>([0-9.,]+[KMBT]?)<\\/div>`, 'i'));
    const parsed = parseCompactNumber(match?.[1]);
    if (label === 'Prompt') summary.prompt_tokens_daily = parsed;
    if (label === 'Reasoning') summary.reasoning_tokens_daily = parsed;
    if (label === 'Completion') summary.completion_tokens_daily = parsed;
  }

  return summary;
}

export function extractOpenRouterSignals(openrouterModel, activity = {}) {
  const supported = new Set(openrouterModel.supported_parameters || []);
  const inputModalities = openrouterModel.architecture?.input_modalities || [];
  const outputModalities = openrouterModel.architecture?.output_modalities || [];

  return {
    openrouter_id: openrouterModel.id,
    canonical_slug: openrouterModel.canonical_slug || null,
    openrouter_name: openrouterModel.name || null,
    description: openrouterModel.description || null,
    context_length: openrouterModel.context_length || null,
    max_completion_tokens: openrouterModel.top_provider?.max_completion_tokens || null,
    modality: openrouterModel.architecture?.modality || null,
    input_modalities: JSON.stringify(inputModalities),
    output_modalities: JSON.stringify(outputModalities),
    tokenizer: openrouterModel.architecture?.tokenizer || null,
    instruct_type: openrouterModel.architecture?.instruct_type || null,
    supports_reasoning: supported.has('reasoning') || supported.has('include_reasoning') ? 1 : 0,
    supports_tools: supported.has('tools') ? 1 : 0,
    supports_files: inputModalities.includes('file') ? 1 : 0,
    supports_images: inputModalities.includes('image') ? 1 : 0,
    supports_structured_outputs: supported.has('structured_outputs') || supported.has('response_format') ? 1 : 0,
    is_moderated: openrouterModel.top_provider?.is_moderated ? 1 : 0,
    knowledge_cutoff: openrouterModel.knowledge_cutoff || null,
    prompt_price_per_mtok: parseOpenRouterPrice(openrouterModel.pricing?.prompt),
    completion_price_per_mtok: parseOpenRouterPrice(openrouterModel.pricing?.completion),
    cache_read_price_per_mtok: parseOpenRouterPrice(openrouterModel.pricing?.input_cache_read),
    cache_write_price_per_mtok: parseOpenRouterPrice(openrouterModel.pricing?.input_cache_write),
    web_search_price_per_k: parseOpenRouterPrice(openrouterModel.pricing?.web_search, 1_000),
    prompt_tokens_daily: activity.prompt_tokens_daily ?? null,
    reasoning_tokens_daily: activity.reasoning_tokens_daily ?? null,
    completion_tokens_daily: activity.completion_tokens_daily ?? null,
    source_url: 'https://openrouter.ai/api/v1/models',
    activity_source_url: `https://openrouter.ai/${openrouterModel.id}/activity`,
  };
}

function buildVendorAliasSet(vendor) {
  const aliases = new Set([String(vendor || '').toLowerCase()]);
  for (const alias of VENDOR_ALIASES[vendor] || []) aliases.add(alias.toLowerCase());
  return aliases;
}

function vendorMatches(localVendor, openrouterId, openrouterName) {
  const aliases = buildVendorAliasSet(localVendor);
  const haystack = `${openrouterId || ''} ${openrouterName || ''}`.toLowerCase();
  for (const alias of aliases) {
    if (alias && haystack.includes(alias)) return true;
  }
  return aliases.size === 0;
}

function tokenSimilarity(left, right) {
  const a = new Set(tokenizeModelLabel(left));
  const b = new Set(tokenizeModelLabel(right));
  if (!a.size || !b.size) return 0;
  let overlap = 0;
  for (const token of a) {
    if (b.has(token)) overlap += 1;
  }
  return overlap / Math.max(a.size, b.size);
}

export function shouldHydrateCoreModel(localModel, openrouterModel) {
  const basename = String(openrouterModel.id || '').split('/').pop();
  if (basename === localModel.slug) return true;
  const canonicalBase = String(openrouterModel.canonical_slug || '').split('/').pop();
  return canonicalBase === localModel.slug;
}

export function scoreOpenRouterMatch(localModel, openrouterModel) {
  const overrideMatches = MATCH_OVERRIDES[localModel.slug];
  if (overrideMatches?.includes(openrouterModel.id)) return 10_000;

  if (!vendorMatches(localModel.vendor, openrouterModel.id, openrouterModel.name)) {
    return -100;
  }

  const labels = [
    localModel.slug,
    localModel.name,
    ...(localModel.aliases || []),
  ].filter(Boolean);

  const remoteVariants = [
    openrouterModel.id,
    openrouterModel.canonical_slug,
    openrouterModel.name,
    String(openrouterModel.id || '').split('/').pop(),
    String(openrouterModel.canonical_slug || '').split('/').pop(),
  ].filter(Boolean);

  let best = 0;
  for (const localLabel of labels) {
    const normalizedLocal = normalizeModelLabel(localLabel);
    const localTokens = tokenizeModelLabel(localLabel);

    for (const remoteLabel of remoteVariants) {
      const normalizedRemote = normalizeModelLabel(remoteLabel);
      const remoteBase = String(remoteLabel).split('/').pop();
      let score = Math.round(tokenSimilarity(localLabel, remoteLabel) * 100);

      if (normalizedLocal && normalizedLocal === normalizedRemote) score += 220;
      if (localModel.slug === remoteBase) score += 240;
      if (normalizedRemote.includes(normalizedLocal) || normalizedLocal.includes(normalizedRemote)) score += 35;
      if (localTokens.some((token) => token.length >= 2 && normalizedRemote.includes(token))) score += 20;

      if (/:free\b/.test(openrouterModel.id || '')) score -= 30;
      if (/\b(audio|image|search)\b/i.test(openrouterModel.id || '')) score -= 20;
      if (/\b(preview|beta|alpha|extended)\b/i.test(openrouterModel.id || '')) score -= 5;

      best = Math.max(best, score);
    }
  }

  return best;
}

export function matchOpenRouterModel(localModel, openrouterModels) {
  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of openrouterModels) {
    const score = scoreOpenRouterMatch(localModel, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (bestScore < 90) return null;
  return { model: bestMatch, score: bestScore };
}

export function buildLocalModelIndex(rows) {
  const bySlug = new Map();
  for (const row of rows) {
    if (!bySlug.has(row.slug)) {
      bySlug.set(row.slug, {
        id: row.id,
        slug: row.slug,
        name: row.name,
        vendor: row.vendor,
        family: row.family,
        aliases: [],
      });
    }
    if (row.alias) bySlug.get(row.slug).aliases.push(row.alias);
  }
  return [...bySlug.values()];
}

export async function fetchOpenRouterModels(fetchImpl = fetch) {
  const res = await fetchImpl('https://openrouter.ai/api/v1/models', {
    headers: { 'User-Agent': 'all-things-ai/1.0 (+https://allthingsai.dev)' },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter models fetch failed: ${res.status} ${res.statusText}`);
  }
  const payload = await res.json();
  return payload.data || [];
}

export async function fetchOpenRouterActivity(openrouterId, fetchImpl = fetch) {
  const res = await fetchImpl(`https://openrouter.ai/${openrouterId}/activity`, {
    headers: { 'User-Agent': 'all-things-ai/1.0 (+https://allthingsai.dev)' },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter activity fetch failed for ${openrouterId}: ${res.status}`);
  }
  const html = await res.text();
  return parseActivitySummary(html);
}

export async function mapModelsToOpenRouter(localModels, fetchImpl = fetch) {
  const openrouterModels = await fetchOpenRouterModels(fetchImpl);
  const matches = [];

  for (const localModel of localModels) {
    const match = matchOpenRouterModel(localModel, openrouterModels);
    if (!match) continue;
    matches.push({
      local: localModel,
      openrouter: match.model,
      match_score: match.score,
      hydrate_core_model: shouldHydrateCoreModel(localModel, match.model),
    });
  }

  return { openrouterModels, matches };
}

/**
 * Derive vendor and family from an OpenRouter model ID prefix.
 * e.g., "zhipu/glm-5-turbo" → { vendor: 'Zhipu AI', family: 'GLM' }
 */
export function resolveVendorFromOpenRouterId(openrouterId) {
  const prefix = (openrouterId || '').split('/')[0].toLowerCase();
  return OR_PREFIX_TO_VENDOR[prefix] || { vendor: prefix, family: prefix };
}

/**
 * Generate a slug from an OpenRouter model ID.
 * e.g., "zhipu/glm-5-turbo" → "glm-5-turbo"
 * e.g., "openai/gpt-4o-mini" → "gpt-4o-mini"
 */
export function slugFromOpenRouterId(openrouterId) {
  const afterSlash = (openrouterId || '').split('/').slice(1).join('/');
  return afterSlash
    .toLowerCase()
    .replace(/:free$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a display name from an OpenRouter model's name or ID.
 * Prefers the OpenRouter name field, falls back to parsing the ID.
 */
export function displayNameFromOpenRouter(orModel) {
  if (orModel.name) {
    // Strip vendor prefix if present (e.g., "Zhipu: GLM-5 Turbo" → "GLM-5 Turbo")
    return orModel.name.replace(/^[^:]+:\s*/, '');
  }
  // Fallback: title-case the slug portion
  return slugFromOpenRouterId(orModel.id)
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Filter OpenRouter models to only text-generation LLMs worth importing.
 * Excludes: free wrappers, image/audio models, embedding models, moderation models.
 */
export function isImportableModel(orModel) {
  const id = (orModel.id || '').toLowerCase();
  // Skip :free variants (duplicates of paid models)
  if (id.endsWith(':free')) return false;
  // Skip image generation, audio, embedding, moderation models
  const modality = orModel.architecture?.modality || '';
  if (modality === 'image' || modality === 'audio' || modality === 'embedding') return false;
  // Skip models with no text output
  const outputModalities = orModel.architecture?.output_modalities || [];
  if (outputModalities.length > 0 && !outputModalities.includes('text')) return false;
  // Skip if pricing is completely absent (likely not available)
  if (!orModel.pricing?.prompt && !orModel.pricing?.completion) return false;
  return true;
}
