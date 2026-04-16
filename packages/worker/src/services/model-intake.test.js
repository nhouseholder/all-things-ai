import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractModelCandidatesFromText,
  extractVersionString,
  normalizeCandidateSignal,
  shouldAutoPublishSignals,
  summarizeCandidateSignals,
} from './model-intake.js';

test('extractVersionString preserves versioned family markers', () => {
  assert.equal(extractVersionString('Qwen3.6-Plus'), '3.6-plus');
  assert.equal(extractVersionString('MiniMax-M2.5'), 'm2.5');
  assert.equal(extractVersionString('Claude Sonnet 4.6'), '4.6');
});

test('extractModelCandidatesFromText finds vendor-scoped model names', () => {
  const candidates = extractModelCandidatesFromText(
    'Alibaba Cloud added Qwen3.6-Plus and Qwen3-Coder-Plus to Model Studio today.',
    { vendorHints: ['Alibaba'] }
  );

  assert(candidates.some((candidate) => candidate.slug === 'qwen3-6-plus'));
  assert(candidates.some((candidate) => candidate.slug === 'qwen3-coder-plus'));
});

test('normalizeCandidateSignal resolves vendor metadata and canonical slug', () => {
  const normalized = normalizeCandidateSignal({
    name: 'Qwen3.6-Plus',
    sourceKey: 'alibaba-model-studio-models',
    sourceLabel: 'Alibaba Cloud Model Studio',
    sourceUrl: 'https://www.alibabacloud.com/help/en/model-studio/models',
    signalType: 'official',
    vendorHints: ['Alibaba'],
  });

  assert.equal(normalized.vendor, 'Alibaba');
  assert.equal(normalized.family, 'Qwen');
  assert.equal(normalized.slug, 'qwen3-6-plus');
  assert.equal(normalized.versionString, '3.6-plus');
  assert.equal(normalized.signalType, 'official');
});

test('normalizeCandidateSignal prefixes bare variants with the resolved family', () => {
  const normalized = normalizeCandidateSignal({
    name: 'M2.7',
    sourceKey: 'minimax-pricing',
    signalType: 'official',
    vendorHints: ['MiniMax'],
  });

  assert.equal(normalized.name, 'MiniMax M2.7');
  assert.equal(normalized.slug, 'minimax-m2-7');
  assert.equal(normalized.versionString, 'm2.7');
});

test('summarizeCandidateSignals only auto-publishes trusted corroboration pairs', () => {
  assert.equal(
    shouldAutoPublishSignals([{ signal_type: 'official', source_key: 'anthropic-blog' }]),
    false
  );
  assert.equal(
    shouldAutoPublishSignals([{ signal_type: 'catalog', source_key: 'openrouter' }]),
    false
  );
  assert.equal(
    shouldAutoPublishSignals([
      { signal_type: 'official', source_key: 'anthropic-blog' },
      { signal_type: 'catalog', source_key: 'openrouter' },
    ]),
    true
  );
  assert.equal(
    shouldAutoPublishSignals([
      { signal_type: 'official', source_key: 'anthropic-blog' },
      { signal_type: 'official', source_key: 'claude-code' },
    ]),
    true
  );

  const summary = summarizeCandidateSignals([
    { signal_type: 'official', source_key: 'anthropic-blog' },
    { signal_type: 'catalog', source_key: 'openrouter' },
    { signal_type: 'news', source_key: 'rss:techcrunch-ai' },
  ]);

  assert.deepEqual(summary.counts, {
    official: 1,
    catalog: 1,
    news: 1,
    community: 0,
  });
  assert.equal(summary.autoPublish, true);
});

test('summarizeCandidateSignals does not auto-publish when two signals share a source_key', () => {
  const summary = summarizeCandidateSignals([
    { signal_type: 'official', source_key: 'anthropic-blog' },
    { signal_type: 'official', source_key: 'anthropic-blog' },
  ]);
  assert.equal(summary.autoPublish, false);
  assert.equal(summary.distinctOfficial, 1);
});

test('normalizeCandidateSignal canonicalizes bare Claude variants with family prefix', () => {
  const normalized = normalizeCandidateSignal({
    name: 'Opus 4.7',
    sourceKey: 'anthropic-blog',
    signalType: 'official',
    vendorHints: ['Anthropic'],
  });

  assert.equal(normalized.vendor, 'Anthropic');
  assert.equal(normalized.family, 'Claude');
  assert.equal(normalized.name, 'Claude Opus 4.7');
  assert.ok(normalized.slug.startsWith('claude-opus-4'), `unexpected slug: ${normalized.slug}`);
});

test('normalizeCandidateSignal canonicalizes bare Sonnet variant', () => {
  const normalized = normalizeCandidateSignal({
    name: 'Sonnet 4.6',
    sourceKey: 'claude-code',
    signalType: 'official',
    vendorHints: ['Anthropic'],
  });

  assert.equal(normalized.name, 'Claude Sonnet 4.6');
  assert.ok(normalized.slug.startsWith('claude-sonnet-4'), `unexpected slug: ${normalized.slug}`);
});

test('normalizeCandidateSignal recognizes Meta Muse family prefix', () => {
  const normalized = normalizeCandidateSignal({
    name: 'Muse Spark',
    sourceKey: 'meta-ai-blog',
    signalType: 'official',
    vendorHints: ['Meta'],
  });

  assert.equal(normalized.vendor, 'Meta');
  assert.ok(
    normalized.slug.includes('muse') || normalized.slug.includes('spark'),
    `expected muse/spark in slug: ${normalized.slug}`
  );
});