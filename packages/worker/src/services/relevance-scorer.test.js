import assert from 'node:assert/strict';
import test from 'node:test';

import { computeCategoryScore } from './relevance-scorer.js';

test('computeCategoryScore tags coding model releases distinctly', () => {
  const { tags } = computeCategoryScore(
    'Anthropic launched Claude Code with stronger agentic coding workflows and higher SWE-bench performance.'
  );

  assert(tags.includes('coding-model'));
  assert(tags.includes('model-release'));
  assert(tags.includes('benchmark'));
});

test('computeCategoryScore tags coding plan changes distinctly', () => {
  const { tags } = computeCategoryScore(
    'GitHub Copilot Pro+ now offers new monthly pricing, higher usage caps, and per-seat team plan changes for developers.'
  );

  assert(tags.includes('coding-plan'));
  assert(tags.includes('pricing-change'));
});

test('computeCategoryScore keeps pricing-plan stories out of model-release', () => {
  const { tags } = computeCategoryScore(
    'OpenAI announced a new $100/month ChatGPT Pro plan with higher usage caps and monthly subscription changes for developers.'
  );

  assert(tags.includes('coding-plan'));
  assert(tags.includes('pricing-change'));
  assert.equal(tags.includes('model-release'), false);
});

test('computeCategoryScore keeps investigation stories out of pricing and model-release lanes', () => {
  const { tags } = computeCategoryScore(
    'Florida AG announces investigation into OpenAI after police said ChatGPT was used to plan the attack.'
  );

  assert.equal(tags.includes('pricing-change'), false);
  assert.equal(tags.includes('model-release'), false);
});