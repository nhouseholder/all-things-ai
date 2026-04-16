import { KNOWN_VENDORS } from '../config/sources.js';

const MODEL_SUFFIX_TOKENS = new Set([
  'air',
  'alpha',
  'beta',
  'coder',
  'deep',
  'edit',
  'family',
  'flash',
  'guard',
  'high',
  'image',
  'instruct',
  'large',
  'latest',
  'lite',
  'live',
  'low',
  'max',
  'medium',
  'mini',
  'mt',
  'next',
  'omni',
  'plus',
  'preview',
  'pro',
  'reasoning',
  'realtime',
  'research',
  'scout',
  'small',
  'sonnet',
  'thinking',
  'turbo',
  'ultra',
  'vl',
  'xhigh',
]);

function normalizeSlugForMatch(slug) {
  return String(slug || '')
    .toLowerCase()
    .replace(/[_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateSlugVariants(slug, vendor) {
  const variants = new Set();
  const base = normalizeSlugForMatch(slug);
  if (!base) return [];
  variants.add(base);
  variants.add(base.replace(/-(\d)/g, '.$1'));
  variants.add(base.replace(/\./g, '-'));

  const vendorConfig = vendor ? KNOWN_VENDORS[vendor] : null;
  if (vendorConfig) {
    const family = String(vendorConfig.family || '').toLowerCase();
    for (const prefix of vendorConfig.prefixes || []) {
      const prefixSlug = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
      if (!prefixSlug) continue;
      if (base.startsWith(`${prefixSlug}-`)) continue;
      variants.add(`${prefixSlug}-${base}`);
      if (family && family !== prefixSlug) {
        variants.add(`${family}-${prefixSlug}-${base}`);
      }
    }
    if (family && !base.startsWith(`${family}-`)) {
      variants.add(`${family}-${base}`);
    }
  }
  return [...variants].filter(Boolean);
}

const VERSION_SUFFIX_TOKENS = new Set([
  'air',
  'alpha',
  'beta',
  'flash',
  'high',
  'instruct',
  'latest',
  'lite',
  'live',
  'low',
  'max',
  'mini',
  'plus',
  'preview',
  'pro',
  'reasoning',
  'realtime',
  'scout',
  'small',
  'thinking',
  'turbo',
  'ultra',
  'xhigh',
]);

const STOP_TOKENS = new Set([
  'a',
  'an',
  'and',
  'announced',
  'announces',
  'announcing',
  'available',
  'for',
  'from',
  'in',
  'introduces',
  'introducing',
  'is',
  'launches',
  'launching',
  'model',
  'models',
  'now',
  'on',
  'pricing',
  'release',
  'released',
  'releases',
  'series',
  'supports',
  'the',
  'to',
  'version',
  'with',
]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPrefixPattern(prefix) {
  return escapeRegExp(prefix).replace(/\\ /g, '[\\s-]+');
}

function normalizeHashPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function toFiniteNumber(value) {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toInteger(value) {
  if (value == null || value === '') return null;
  const numeric = Number.parseInt(String(value), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeSignalType(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'official' || normalized === 'catalog' || normalized === 'community') {
    return normalized;
  }
  return 'news';
}

function normalizeVendorHints(vendorHints = []) {
  const hints = Array.isArray(vendorHints) ? vendorHints : [vendorHints];
  const resolved = new Set();

  for (const hint of hints) {
    const loweredHint = String(hint || '').trim().toLowerCase();
    if (!loweredHint) continue;

    for (const [vendor, config] of Object.entries(KNOWN_VENDORS)) {
      const loweredVendor = vendor.toLowerCase();
      const loweredFamily = config.family.toLowerCase();
      const prefixMatch = config.prefixes.some((prefix) => {
        const loweredPrefix = prefix.toLowerCase();
        return loweredHint === loweredPrefix || loweredHint.includes(loweredPrefix) || loweredPrefix.includes(loweredHint);
      });

      if (
        loweredHint === loweredVendor
        || loweredHint === loweredFamily
        || loweredHint.includes(loweredVendor)
        || loweredVendor.includes(loweredHint)
        || prefixMatch
      ) {
        resolved.add(vendor);
      }
    }
  }

  return [...resolved];
}

function vendorEntriesForHints(vendorHints = []) {
  const resolved = normalizeVendorHints(vendorHints);
  if (resolved.length === 0) return Object.entries(KNOWN_VENDORS);
  return resolved
    .map((vendor) => [vendor, KNOWN_VENDORS[vendor]])
    .filter(([, config]) => Boolean(config));
}

function humanizeSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function cleanExtractedPhrase(rawPhrase) {
  const tokens = String(rawPhrase || '')
    .replace(/[()[\]{}:,;!?]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);

  const kept = [];
  let hasModelSignal = false;

  for (const token of tokens) {
    const normalized = token.toLowerCase().replace(/[^a-z0-9.+]/g, '');
    if (!normalized) continue;

    if (kept.length === 0) {
      kept.push(token);
      if (/\d/.test(normalized) || MODEL_SUFFIX_TOKENS.has(normalized)) {
        hasModelSignal = true;
      }
      continue;
    }

    if (STOP_TOKENS.has(normalized) && hasModelSignal) {
      break;
    }

    const shouldKeep = /\d/.test(normalized) || MODEL_SUFFIX_TOKENS.has(normalized) || kept.length < 2;
    if (!shouldKeep) {
      break;
    }

    kept.push(token);
    if (/\d/.test(normalized) || MODEL_SUFFIX_TOKENS.has(normalized)) {
      hasModelSignal = true;
    }

    if (kept.length >= 4 && hasModelSignal) {
      break;
    }
  }

  if (!hasModelSignal) return null;
  return kept.join(' ').replace(/\s+/g, ' ').trim();
}

function resolveVendorConfig(vendorName, vendorHints = [], candidateName = '') {
  const directMatch = normalizeVendorHints([vendorName])[0];
  if (directMatch) {
    return { vendor: directMatch, family: KNOWN_VENDORS[directMatch]?.family || null };
  }

  const hintedMatches = normalizeVendorHints(vendorHints);
  if (hintedMatches.length === 1) {
    return {
      vendor: hintedMatches[0],
      family: KNOWN_VENDORS[hintedMatches[0]]?.family || null,
    };
  }

  const candidateSlug = slugifyModelName(candidateName);
  for (const [vendor, config] of vendorEntriesForHints(vendorHints)) {
    const matchesPrefix = config.prefixes.some((prefix) => {
      const normalizedPrefix = slugifyModelName(prefix);
      return candidateSlug.startsWith(normalizedPrefix) || candidateSlug.includes(normalizedPrefix);
    });
    if (matchesPrefix) {
      return { vendor, family: config.family };
    }
  }

  return {
    vendor: vendorName || null,
    family: null,
  };
}

function shouldPrefixFamily(candidateName, resolvedVendor) {
  if (!candidateName || !resolvedVendor?.family) return false;

  const normalized = slugifyModelName(candidateName);
  const config = KNOWN_VENDORS[resolvedVendor.vendor];
  if (!config) return false;

  const familySlug = slugifyModelName(config.family);
  if (!familySlug) return false;

  if (normalized === familySlug) return false;
  if (normalized.startsWith(`${familySlug}-`)) return false;
  if (normalized.startsWith(familySlug) && /^[a-z]+\d/.test(normalized)) {
    return false;
  }

  return true;
}

export function slugifyModelName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/\b(model|models|series|family|version)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractVersionString(value) {
  const tokens = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9.\s-]+/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!/\d/.test(token)) continue;

    const firstDigit = token.search(/\d/);
    let version = token.toLowerCase();
    if (firstDigit > 0 && !/^[a-z]\d/.test(version)) {
      version = version.slice(firstDigit);
    }

    const nextToken = tokens[index + 1];
    if (nextToken && VERSION_SUFFIX_TOKENS.has(nextToken)) {
      version = `${version}-${nextToken}`;
    }

    return version;
  }

  return null;
}

export function generateModelAliases(name, slug, vendor, family) {
  const aliases = new Set();
  const lower = String(name || '').toLowerCase();

  if (lower) aliases.add(lower);
  if (slug) aliases.add(slug);

  if (vendor && lower.startsWith(String(vendor).toLowerCase())) {
    aliases.add(lower.slice(String(vendor).length).trim());
  }

  if (family) {
    const familyLower = String(family).toLowerCase();
    const index = lower.indexOf(familyLower);
    if (index >= 0) aliases.add(lower.slice(index));
  }

  if (lower) {
    aliases.add(lower.replace(/\./g, ''));
    aliases.add(lower.replace(/\s+/g, ''));
    aliases.add(lower.replace(/\s+/g, '-'));
  }

  return [...aliases].filter((alias) => alias.length >= 3);
}

export function extractModelCandidatesFromText(text, options = {}) {
  const input = String(text || '').trim();
  if (!input) return [];

  const candidates = [];
  const seen = new Set();

  for (const [vendor, config] of vendorEntriesForHints(options.vendorHints)) {
    for (const prefix of config.prefixes) {
      const prefixPattern = buildPrefixPattern(prefix);
      const regex = new RegExp(`\\b(${prefixPattern}[a-z0-9.]*(?:[\\s-]+(?!and\\b|or\\b|to\\b|for\\b|with\\b)[a-z0-9.+]+){0,3})`, 'gi');

      let match;
      while ((match = regex.exec(input)) !== null) {
        const cleaned = cleanExtractedPhrase(match[1]);
        if (!cleaned) continue;

        const slug = slugifyModelName(cleaned);
        if (!slug || slug.length < 4 || seen.has(slug)) continue;

        seen.add(slug);
        candidates.push({
          name: cleaned,
          slug,
          vendor,
          family: config.family,
          versionString: extractVersionString(cleaned),
        });
      }
    }
  }

  return candidates;
}

export function summarizeCandidateSignals(signals = []) {
  const counts = { official: 0, catalog: 0, news: 0, community: 0 };
  const officialSources = new Set();
  const catalogSources = new Set();

  for (const signal of signals) {
    const signalType = normalizeSignalType(signal.signal_type || signal.signalType || signal.type);
    counts[signalType] += 1;
    const sourceKey = signal.source_key || signal.sourceKey || '';
    if (signalType === 'official' && sourceKey) officialSources.add(sourceKey);
    if (signalType === 'catalog' && sourceKey) catalogSources.add(sourceKey);
  }

  const distinctOfficial = officialSources.size;
  const distinctCatalog = catalogSources.size;
  const autoPublish =
    (distinctOfficial >= 1 && distinctCatalog >= 1) ||
    distinctOfficial >= 2;

  return { counts, distinctOfficial, distinctCatalog, autoPublish };
}

export function shouldAutoPublishSignals(signals = []) {
  return summarizeCandidateSignals(signals).autoPublish;
}

function buildSignalHash(candidate) {
  return [
    candidate.slug,
    candidate.signalType,
    candidate.sourceKey,
    candidate.contentUrl || candidate.sourceUrl,
    candidate.openrouterId,
    candidate.title || candidate.name,
  ].map(normalizeHashPart).filter(Boolean).join('|');
}

function sanitizeMetadata(metadata = {}, vendorHints = []) {
  return {
    ...metadata,
    vendor_hints: normalizeVendorHints(vendorHints),
  };
}

export function normalizeCandidateSignal(rawSignal = {}) {
  const metadata = rawSignal.metadata && typeof rawSignal.metadata === 'object' ? rawSignal.metadata : {};
  const baseName = rawSignal.name || rawSignal.modelName || metadata.model || metadata.model_name || null;
  const vendorHints = [
    ...(Array.isArray(rawSignal.vendorHints) ? rawSignal.vendorHints : []),
    rawSignal.vendor,
    metadata.vendor,
  ].filter(Boolean);

  const slug = rawSignal.slug || slugifyModelName(baseName || rawSignal.title || '');
  if (!slug) return null;

  const resolved = resolveVendorConfig(rawSignal.vendor || metadata.vendor, vendorHints, baseName || slug);
  const canonicalName = shouldPrefixFamily(baseName, resolved)
    ? `${resolved.family} ${baseName}`
    : baseName;
  const canonicalSlug = rawSignal.slug || slugifyModelName(canonicalName || rawSignal.title || '');

  return {
    name: canonicalName ? String(canonicalName).trim() : humanizeSlug(canonicalSlug),
    slug: canonicalSlug,
    vendor: resolved.vendor || 'Unknown',
    family: rawSignal.family || resolved.family || metadata.family || null,
    versionString: rawSignal.versionString || metadata.version_string || extractVersionString(canonicalName || canonicalSlug),
    releaseDate: rawSignal.releaseDate || metadata.release_date || null,
    description: rawSignal.description || metadata.description || null,
    inputPricePerMtok: toFiniteNumber(rawSignal.inputPricePerMtok ?? rawSignal.input_price_per_mtok ?? metadata.input_price_per_mtok),
    outputPricePerMtok: toFiniteNumber(rawSignal.outputPricePerMtok ?? rawSignal.output_price_per_mtok ?? metadata.output_price_per_mtok),
    cacheHitPricePerMtok: toFiniteNumber(rawSignal.cacheHitPricePerMtok ?? rawSignal.cache_hit_price_per_mtok ?? metadata.cache_hit_price_per_mtok),
    contextWindow: toInteger(rawSignal.contextWindow ?? rawSignal.context_window ?? metadata.context_window),
    isOpenWeight: rawSignal.isOpenWeight || rawSignal.is_open_weight || metadata.is_open_weight ? 1 : 0,
    discoverySource: rawSignal.discoverySource || rawSignal.discovery_source || rawSignal.sourceKey || rawSignal.sourceLabel || 'unknown',
    discoveryUrl: rawSignal.discoveryUrl || rawSignal.discovery_url || rawSignal.contentUrl || rawSignal.sourceUrl || null,
    signalType: normalizeSignalType(rawSignal.signalType || rawSignal.signal_type),
    sourceKey: rawSignal.sourceKey || rawSignal.source_key || rawSignal.discoverySource || 'unknown-source',
    sourceLabel: rawSignal.sourceLabel || rawSignal.source_label || rawSignal.discoverySource || rawSignal.sourceKey || null,
    sourceUrl: rawSignal.sourceUrl || rawSignal.source_url || rawSignal.discoveryUrl || null,
    contentUrl: rawSignal.contentUrl || rawSignal.content_url || rawSignal.discoveryUrl || rawSignal.sourceUrl || null,
    title: rawSignal.title || canonicalName || humanizeSlug(canonicalSlug),
    summary: rawSignal.summary || null,
    openrouterId: rawSignal.openrouterId || rawSignal.openrouter_id || metadata.openrouter_id || null,
    metadata: sanitizeMetadata(metadata, vendorHints),
  };
}

async function invalidateModelCaches(env) {
  if (!env.CACHE) return;
  await Promise.all([
    env.CACHE.delete('model-aliases:merged'),
    env.CACHE.delete('rankings:v1'),
    env.CACHE.delete('rankings:v2-vibe'),
  ]);
}

async function insertAliases(env, slug, aliases) {
  if (!aliases.length) return;
  const stmt = env.DB.prepare('INSERT OR IGNORE INTO model_aliases (model_slug, alias) VALUES (?, ?)');
  await env.DB.batch(aliases.map((alias) => stmt.bind(slug, alias)));
}

async function findExistingModel(env, candidate) {
  const slugVariants = generateSlugVariants(candidate.slug, candidate.vendor);
  if (slugVariants.length === 0 && !candidate.openrouterId) return null;

  if (candidate.openrouterId) {
    const byOpenRouter = await env.DB.prepare(
      'SELECT id, slug FROM models WHERE openrouter_id = ? LIMIT 1'
    ).bind(candidate.openrouterId).first();
    if (byOpenRouter) return byOpenRouter;
  }

  if (slugVariants.length > 0) {
    const placeholders = slugVariants.map(() => '?').join(',');
    const bySlug = await env.DB.prepare(
      `SELECT id, slug FROM models WHERE slug IN (${placeholders}) LIMIT 1`
    ).bind(...slugVariants).first();
    if (bySlug) return bySlug;

    const byAlias = await env.DB.prepare(
      `SELECT m.id, m.slug FROM models m
       JOIN model_aliases a ON a.model_slug = m.slug
       WHERE a.alias IN (${placeholders}) LIMIT 1`
    ).bind(...slugVariants).first();
    if (byAlias) return byAlias;
  }

  return null;
}

async function hydrateExistingModel(env, modelId, candidate) {
  await env.DB.prepare(`
    UPDATE models
    SET version_string = COALESCE(version_string, ?),
      release_date = COALESCE(release_date, ?),
      description = COALESCE(description, ?),
      input_price_per_mtok = COALESCE(input_price_per_mtok, ?),
      output_price_per_mtok = COALESCE(output_price_per_mtok, ?),
      cache_hit_price_per_mtok = COALESCE(cache_hit_price_per_mtok, ?),
      context_window = COALESCE(context_window, ?),
      openrouter_id = COALESCE(openrouter_id, ?),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    candidate.versionString,
    candidate.releaseDate,
    candidate.description,
    candidate.inputPricePerMtok,
    candidate.outputPricePerMtok,
    candidate.cacheHitPricePerMtok,
    candidate.contextWindow,
    candidate.openrouterId,
    modelId,
  ).run();
}

async function upsertPendingCandidate(env, candidate) {
  await env.DB.prepare(`
    INSERT INTO pending_models (
      name, slug, vendor, family, version_string, release_date, description,
      input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok,
      context_window, is_open_weight, discovery_source, discovery_url,
      openrouter_id, metadata, status, last_seen_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET
      name = COALESCE(pending_models.name, excluded.name),
      vendor = COALESCE(pending_models.vendor, excluded.vendor),
      family = COALESCE(pending_models.family, excluded.family),
      version_string = COALESCE(pending_models.version_string, excluded.version_string),
      release_date = COALESCE(pending_models.release_date, excluded.release_date),
      description = COALESCE(pending_models.description, excluded.description),
      input_price_per_mtok = COALESCE(pending_models.input_price_per_mtok, excluded.input_price_per_mtok),
      output_price_per_mtok = COALESCE(pending_models.output_price_per_mtok, excluded.output_price_per_mtok),
      cache_hit_price_per_mtok = COALESCE(pending_models.cache_hit_price_per_mtok, excluded.cache_hit_price_per_mtok),
      context_window = COALESCE(pending_models.context_window, excluded.context_window),
      is_open_weight = CASE
        WHEN COALESCE(pending_models.is_open_weight, 0) = 1 OR COALESCE(excluded.is_open_weight, 0) = 1 THEN 1
        ELSE 0
      END,
      discovery_source = CASE
        WHEN pending_models.discovery_source IS NULL THEN excluded.discovery_source
        WHEN pending_models.discovery_source = 'openrouter' AND excluded.discovery_source != 'openrouter' THEN excluded.discovery_source
        ELSE pending_models.discovery_source
      END,
      discovery_url = COALESCE(pending_models.discovery_url, excluded.discovery_url),
      openrouter_id = COALESCE(pending_models.openrouter_id, excluded.openrouter_id),
      metadata = COALESCE(pending_models.metadata, excluded.metadata),
      last_seen_at = datetime('now')
  `).bind(
    candidate.name,
    candidate.slug,
    candidate.vendor,
    candidate.family,
    candidate.versionString,
    candidate.releaseDate,
    candidate.description,
    candidate.inputPricePerMtok,
    candidate.outputPricePerMtok,
    candidate.cacheHitPricePerMtok,
    candidate.contextWindow,
    candidate.isOpenWeight,
    candidate.discoverySource,
    candidate.discoveryUrl,
    candidate.openrouterId,
    JSON.stringify(candidate.metadata || {}),
  ).run();

  return env.DB.prepare('SELECT * FROM pending_models WHERE slug = ?').bind(candidate.slug).first();
}

async function recordCandidateSignal(env, pendingId, candidate) {
  await env.DB.prepare(`
    INSERT OR IGNORE INTO model_candidate_signals (
      pending_model_id, signal_type, source_key, source_label, source_url,
      content_url, signal_hash, title, summary, metadata
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    pendingId,
    candidate.signalType,
    candidate.sourceKey,
    candidate.sourceLabel,
    candidate.sourceUrl,
    candidate.contentUrl,
    buildSignalHash(candidate),
    candidate.title,
    candidate.summary,
    JSON.stringify(candidate.metadata || {}),
  ).run();

  return env.DB.prepare(
    'SELECT signal_type FROM model_candidate_signals WHERE pending_model_id = ?'
  ).bind(pendingId).all();
}

async function insertPublishedModel(env, candidate) {
  const result = await env.DB.prepare(`
    INSERT INTO models (
      name, slug, vendor, family, version_string, release_date, description,
      is_active, input_price_per_mtok, output_price_per_mtok, cache_hit_price_per_mtok,
      context_window, is_open_weight, discovery_source, openrouter_id, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    candidate.name,
    candidate.slug,
    candidate.vendor,
    candidate.family,
    candidate.versionString,
    candidate.releaseDate,
    candidate.description,
    candidate.inputPricePerMtok,
    candidate.outputPricePerMtok,
    candidate.cacheHitPricePerMtok,
    candidate.contextWindow,
    candidate.isOpenWeight,
    candidate.discoverySource,
    candidate.openrouterId,
  ).run();

  const modelId = result.meta?.last_row_id;
  const aliases = generateModelAliases(candidate.name, candidate.slug, candidate.vendor, candidate.family);
  await insertAliases(env, candidate.slug, aliases);
  await invalidateModelCaches(env);
  await enqueueEnrichment(env, modelId, candidate.slug);

  return {
    modelId,
    aliasesCreated: aliases.length,
  };
}

async function enqueueEnrichment(env, modelId, slug) {
  try {
    await env.DB.prepare(`
      INSERT OR IGNORE INTO model_enrichment_queue (model_id, slug, reason, queued_at)
      VALUES (?, ?, 'auto-published', datetime('now'))
    `).bind(modelId, slug).run();
  } catch (err) {
    console.warn(`[INTAKE] enrichment queue skipped for ${slug}: ${err.message}`);
  }
}

export async function publishPendingModel(env, pendingModel, options = {}) {
  const existingModel = await findExistingModel(env, {
    slug: pendingModel.slug,
    openrouterId: pendingModel.openrouter_id,
  });

  if (existingModel) {
    await env.DB.prepare(`
      UPDATE pending_models
      SET status = 'approved',
        reviewed_at = datetime('now'),
        published_model_id = ?,
        decision_source = ?,
        last_seen_at = datetime('now')
      WHERE id = ?
    `).bind(existingModel.id, options.decisionSource || 'manual', pendingModel.id).run();

    return {
      modelId: existingModel.id,
      aliasesCreated: 0,
      alreadyExisted: true,
    };
  }

  const candidate = {
    name: pendingModel.name,
    slug: pendingModel.slug,
    vendor: pendingModel.vendor,
    family: pendingModel.family,
    versionString: pendingModel.version_string,
    releaseDate: pendingModel.release_date,
    description: pendingModel.description,
    inputPricePerMtok: pendingModel.input_price_per_mtok,
    outputPricePerMtok: pendingModel.output_price_per_mtok,
    cacheHitPricePerMtok: pendingModel.cache_hit_price_per_mtok,
    contextWindow: pendingModel.context_window,
    isOpenWeight: pendingModel.is_open_weight,
    discoverySource: pendingModel.discovery_source || 'pending',
    openrouterId: pendingModel.openrouter_id,
  };

  const published = await insertPublishedModel(env, candidate);

  await env.DB.prepare(`
    UPDATE pending_models
    SET status = 'approved',
      reviewed_at = datetime('now'),
      published_model_id = ?,
      decision_source = ?,
      last_seen_at = datetime('now')
    WHERE id = ?
  `).bind(published.modelId, options.decisionSource || 'manual', pendingModel.id).run();

  return published;
}

export async function ingestModelCandidate(env, rawSignal) {
  const candidate = normalizeCandidateSignal(rawSignal);
  if (!candidate) {
    return { outcome: 'skipped', reason: 'invalid-candidate' };
  }

  const existingModel = await findExistingModel(env, candidate);
  if (existingModel) {
    await hydrateExistingModel(env, existingModel.id, candidate);
    return {
      outcome: 'existing-model',
      modelId: existingModel.id,
      slug: existingModel.slug,
    };
  }

  const pendingModel = await upsertPendingCandidate(env, candidate);
  const recordedSignals = await recordCandidateSignal(env, pendingModel.id, candidate);
  const signalSummary = summarizeCandidateSignals(recordedSignals.results || []);

  if (pendingModel.status === 'rejected') {
    return {
      outcome: 'held-rejected',
      pendingId: pendingModel.id,
      signalSummary,
    };
  }

  if (!signalSummary.autoPublish) {
    return {
      outcome: 'queued',
      pendingId: pendingModel.id,
      signalSummary,
    };
  }

  const published = await publishPendingModel(env, pendingModel, { decisionSource: 'auto' });
  return {
    outcome: 'auto-published',
    pendingId: pendingModel.id,
    modelId: published.modelId,
    signalSummary,
  };
}