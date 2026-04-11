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