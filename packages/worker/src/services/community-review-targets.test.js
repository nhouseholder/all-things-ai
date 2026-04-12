import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildReviewAliasesForModel,
  buildReviewSearchQueries,
  prioritizeModelsForReviewCoverage,
} from './community-review-targets.js';

test('buildReviewAliasesForModel generates exact aliases for SQL-seeded versioned models', () => {
  const aliases = buildReviewAliasesForModel({
    slug: 'glm-5.1',
    name: 'GLM 5.1',
    vendor: 'Zhipu AI',
    family: 'GLM',
    version_string: '5.1',
  });

  assert(aliases.includes('glm-5.1'));
  assert(aliases.includes('glm 5.1'));
  assert(aliases.includes('zhipu ai glm 5.1'));
});

test('prioritizeModelsForReviewCoverage prefers models with no sources and low review counts', () => {
  const prioritized = prioritizeModelsForReviewCoverage([
    { id: 1, slug: 'kimi-k2.5', name: 'Kimi K2.5', total_reviews: 77, source_count: 2, release_date: '2026-03-10' },
    { id: 2, slug: 'glm-5.1', name: 'GLM 5.1', total_reviews: 0, source_count: 0, release_date: '2026-03-28' },
    { id: 3, slug: 'qwen3-max', name: 'Qwen3 Max', total_reviews: 2, source_count: 1, release_date: '2026-04-11' },
  ]);

  assert.equal(prioritized[0].slug, 'glm-5.1');
  assert.equal(prioritized[1].slug, 'qwen3-max');
});

test('buildReviewSearchQueries caps dynamic queries to the highest-priority models', () => {
  const queries = buildReviewSearchQueries([
    { id: 1, slug: 'kimi-k2.5', name: 'Kimi K2.5', vendor: 'Moonshot AI', family: 'Kimi', version_string: 'k2.5', total_reviews: 77, source_count: 2, release_date: '2026-03-10' },
    { id: 2, slug: 'glm-5.1', name: 'GLM 5.1', vendor: 'Zhipu AI', family: 'GLM', version_string: '5.1', total_reviews: 0, source_count: 0, release_date: '2026-03-28' },
  ], {
    source: 'reddit',
    maxModels: 1,
    perModelQueries: 1,
  });

  assert(queries.includes('glm 5.1 coding'));
  assert.equal(queries.includes('kimi k2.5 coding'), false);
});