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
  assert.equal(shouldAutoPublishSignals([{ signal_type: 'official' }]), false);
  assert.equal(shouldAutoPublishSignals([{ signal_type: 'catalog' }]), false);
  assert.equal(
    shouldAutoPublishSignals([{ signal_type: 'official' }, { signal_type: 'catalog' }]),
    true
  );
  assert.equal(
    shouldAutoPublishSignals([{ signal_type: 'official' }, { signal_type: 'official' }]),
    true
  );

  const summary = summarizeCandidateSignals([
    { signal_type: 'official' },
    { signal_type: 'catalog' },
    { signal_type: 'news' },
  ]);

  assert.deepEqual(summary.counts, {
    official: 1,
    catalog: 1,
    news: 1,
    community: 0,
  });
  assert.equal(summary.autoPublish, true);
});