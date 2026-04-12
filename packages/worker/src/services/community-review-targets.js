import { generateModelAliases } from './model-intake.js';

export const REVIEW_COVERAGE_THRESHOLD = 10;
export const DEFAULT_REVIEW_TARGET_MODEL_LIMIT = 6;
export const BACKFILL_REVIEW_TARGET_MODEL_LIMIT = 12;

const STATIC_REDDIT_REVIEW_QUERIES = [
  'claude opus sonnet coding',
  'gpt coding review',
  'cursor copilot windsurf comparison',
  'best model for coding',
  'claude code review',
  'vibe coding model',
  'which ai model coding',
];

const STATIC_HN_REVIEW_QUERIES = [
  'Claude Opus coding',
  'GPT coding review',
  'AI coding assistant comparison',
  'LLM coding benchmark',
  'best LLM for programming',
  'Claude Code review',
  'vibe coding AI',
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9.+\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSearchTerm(value) {
  return normalizeText(value).replace(/\s*\.\s*/g, '.');
}

function toFiniteInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function baseModelTerms(model) {
  const terms = new Set();
  const name = normalizeSearchTerm(model.name);
  const spacedSlug = normalizeSearchTerm(String(model.slug || '').replace(/-/g, ' '));

  if (name) terms.add(name);
  if (spacedSlug && spacedSlug !== name) terms.add(spacedSlug);

  if (model.family && model.version_string) {
    const familyVersion = normalizeSearchTerm(`${model.family} ${String(model.version_string).replace(/-/g, ' ')}`);
    if (familyVersion && familyVersion !== name) terms.add(familyVersion);
  }

  if (model.vendor && name && !name.startsWith(normalizeSearchTerm(model.vendor))) {
    terms.add(normalizeSearchTerm(`${model.vendor} ${model.name}`));
  }

  return [...terms].filter((term) => term.length >= 4);
}

export function buildReviewAliasesForModel(model) {
  const aliases = new Set(
    generateModelAliases(model.name, model.slug, model.vendor, model.family)
      .map((alias) => normalizeSearchTerm(alias))
      .filter(Boolean)
  );

  for (const term of baseModelTerms(model)) {
    aliases.add(term);
  }

  return [...aliases].filter((alias) => alias.length >= 3 && /[a-z]/.test(alias));
}

export function buildAliasRows(models) {
  return models.flatMap((model) =>
    buildReviewAliasesForModel(model).map((alias) => ({ modelSlug: model.slug, alias }))
  );
}

export function prioritizeModelsForReviewCoverage(models, options = {}) {
  const coverageThreshold = toFiniteInteger(options.coverageThreshold, REVIEW_COVERAGE_THRESHOLD);

  return [...models].sort((left, right) => {
    const leftSourceBucket = (left.source_count || 0) === 0 ? 0 : 1;
    const rightSourceBucket = (right.source_count || 0) === 0 ? 0 : 1;
    if (leftSourceBucket !== rightSourceBucket) return leftSourceBucket - rightSourceBucket;

    const leftCoverageBucket = (left.total_reviews || 0) < coverageThreshold ? 0 : 1;
    const rightCoverageBucket = (right.total_reviews || 0) < coverageThreshold ? 0 : 1;
    if (leftCoverageBucket !== rightCoverageBucket) return leftCoverageBucket - rightCoverageBucket;

    const leftReviews = left.total_reviews || 0;
    const rightReviews = right.total_reviews || 0;
    if (leftReviews !== rightReviews) return leftReviews - rightReviews;

    const leftRelease = Date.parse(left.release_date || '') || 0;
    const rightRelease = Date.parse(right.release_date || '') || 0;
    if (leftRelease !== rightRelease) return rightRelease - leftRelease;

    return (right.id || 0) - (left.id || 0);
  });
}

function perModelQueries(model, options = {}) {
  const source = options.source === 'hn' ? 'hn' : 'reddit';
  const queryLimit = toFiniteInteger(options.perModelQueries, options.backfill ? 2 : 1);
  const terms = baseModelTerms(model).slice(0, queryLimit);
  const queries = [];

  for (const term of terms) {
    if (!term) continue;
    queries.push(`${term} coding`);
    if (options.backfill) {
      queries.push(`${term} review`);
    }
    if (source === 'hn' && options.backfill) {
      queries.push(term);
    }
  }

  return queries;
}

export function buildReviewSearchQueries(models, options = {}) {
  const source = options.source === 'hn' ? 'hn' : 'reddit';
  const staticQueries = source === 'hn' ? STATIC_HN_REVIEW_QUERIES : STATIC_REDDIT_REVIEW_QUERIES;
  const modelLimit = toFiniteInteger(
    options.maxModels,
    options.backfill ? BACKFILL_REVIEW_TARGET_MODEL_LIMIT : DEFAULT_REVIEW_TARGET_MODEL_LIMIT
  );

  const prioritized = prioritizeModelsForReviewCoverage(models, options).slice(0, modelLimit);
  const dynamicQueries = prioritized.flatMap((model) => perModelQueries(model, options));

  return [...new Set([...staticQueries, ...dynamicQueries].map((query) => normalizeSearchTerm(query)).filter(Boolean))];
}

export async function loadReviewTargetModels(env) {
  const { results } = await env.DB.prepare(`
    SELECT
      m.id,
      m.slug,
      m.name,
      m.vendor,
      m.family,
      m.version_string,
      m.release_date,
      COALESCE(SUM(cr.review_count), 0) AS total_reviews,
      COUNT(DISTINCT CASE WHEN cr.review_count > 0 THEN cr.source END) AS source_count
    FROM models m
    LEFT JOIN community_reviews cr ON cr.model_id = m.id
    WHERE m.is_active = 1
    GROUP BY m.id
  `).all();

  return results;
}

export async function syncModelAliases(env) {
  const { results: models } = await env.DB.prepare(`
    SELECT id, slug, name, vendor, family, version_string, release_date
    FROM models
    WHERE is_active = 1
  `).all();

  const aliasRows = buildAliasRows(models);
  const { results: existingAliases } = await env.DB.prepare('SELECT model_slug, alias FROM model_aliases').all();
  const knownAliases = new Map(existingAliases.map((row) => [normalizeSearchTerm(row.alias), row.model_slug]));
  const insertAlias = env.DB.prepare('INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES (?, ?)');

  const batch = [];
  let inserted = 0;
  let conflicts = 0;

  for (const row of aliasRows) {
    const alias = normalizeSearchTerm(row.alias);
    if (!alias) continue;

    const existingSlug = knownAliases.get(alias);
    if (existingSlug && existingSlug !== row.modelSlug) {
      conflicts += 1;
      continue;
    }

    if (!existingSlug) {
      batch.push(insertAlias.bind(row.modelSlug, alias));
      knownAliases.set(alias, row.modelSlug);
      inserted += 1;
    }
  }

  for (let index = 0; index < batch.length; index += 100) {
    await env.DB.batch(batch.slice(index, index + 100));
  }

  if (env.CACHE) {
    await env.CACHE.delete('model-aliases:merged');
  }

  return {
    modelsProcessed: models.length,
    aliasesConsidered: aliasRows.length,
    aliasesInserted: inserted,
    conflicts,
  };
}