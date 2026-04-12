import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const seedPath = new URL('./seed.sql', import.meta.url);

test('seeded compare-visible models include benchmark or composite capability data', () => {
  const seed = fs.readFileSync(seedPath, 'utf8');
  const benchmarkStart = seed.indexOf('INSERT OR IGNORE INTO benchmarks');
  const availabilityStart = seed.indexOf('INSERT OR IGNORE INTO model_availability');
  const compositeStart = seed.indexOf('INSERT OR IGNORE INTO model_composite_scores');

  assert.notEqual(benchmarkStart, -1, 'seed benchmark section should exist');
  assert.notEqual(availabilityStart, -1, 'seed availability section should exist');
  assert.notEqual(compositeStart, -1, 'seed composite score section should exist');

  const benchmarkSection = seed.slice(benchmarkStart, availabilityStart);
  const compositeSection = seed.slice(compositeStart);
  const modelSlugs = [...seed.matchAll(/\('(?:[^']|''*)*',\s*'([^']+)',\s*'[^']*',\s*'[^']*'(?:,\s*'[^']*'){1,3}/g)]
    .map((match) => match[1])
    .filter((slug) => slug.includes('-'))
    .filter((slug) => !slug.includes('code-pro'));

  const seededCompareModels = [...new Set(modelSlugs)].filter((slug) => [
    'claude-opus-4',
    'claude-sonnet-4',
    'claude-haiku-3.5',
    'gpt-4o',
    'gpt-o3',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'deepseek-v3',
    'llama-4-maverick',
    'qwen-3.5-plus',
    'qwen-3.6-plus',
    'kimi-k2.5',
    'glm-5.1',
    'minimax-m2.7',
  ].includes(slug));

  const missing = seededCompareModels.filter((slug) => {
    const token = `slug='${slug}'`;
    return !benchmarkSection.includes(token) && !compositeSection.includes(token);
  });

  assert.deepEqual(missing, []);
});