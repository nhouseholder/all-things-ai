import assert from 'node:assert/strict';
import test from 'node:test';

import { TRUST_WEIGHTS, computeTrustWeightedScore } from './composite-score-engine.js';

test('TRUST_WEIGHTS has the four expected tiers with correct multipliers', () => {
  assert.equal(TRUST_WEIGHTS.gold, 1.00);
  assert.equal(TRUST_WEIGHTS.silver, 0.85);
  assert.equal(TRUST_WEIGHTS.bronze, 0.50);
  assert.equal(TRUST_WEIGHTS.unverified, 0.20);
});

test('pure gold benchmarks produce unweighted average (trust cancels in normalization)', () => {
  const components = { swe: 0.80, mmlu: 0.90 };
  const trustByKey = { swe: 'gold', mmlu: 'gold' };
  const baseWeights = { swe: 0.20, mmlu: 0.08 };

  // Effective: 0.20 + 0.08 = 0.28; normalized: swe=5/7, mmlu=2/7
  // Score: (0.80 * 5/7 + 0.90 * 2/7) * 100 = (4/7 + 1.8/7) * 100 = 82.857
  const score = computeTrustWeightedScore(components, trustByKey, baseWeights);
  assert.ok(Math.abs(score - 82.857) < 0.01, `expected ~82.86, got ${score}`);
});

test('unverified benchmark is deeply down-weighted relative to gold', () => {
  // Both benchmarks score 100, but one is gold and one is unverified.
  // With equal base weights, gold's effective = 1.0 and unverified's = 0.2;
  // normalized contribution shares are ~83% / ~17%.
  const components = { a: 1.0, b: 1.0 };
  const trustByKey = { a: 'gold', b: 'unverified' };
  const baseWeights = { a: 0.10, b: 0.10 };

  // Both components score 100 so weighted sum is still 100 (value-agnostic).
  // But change one score and the trust effect becomes visible:
  const scoreGoldHigh = computeTrustWeightedScore(
    { a: 1.0, b: 0.0 },
    trustByKey,
    baseWeights,
  );
  const scoreUnverHigh = computeTrustWeightedScore(
    { a: 0.0, b: 1.0 },
    trustByKey,
    baseWeights,
  );
  // Gold-high must score higher than unverified-high by a large margin.
  assert.ok(scoreGoldHigh > scoreUnverHigh + 50,
    `gold-high ${scoreGoldHigh} should dominate unverified-high ${scoreUnverHigh}`);
});

test('missing trust tier defaults to unverified (treated as 0.20 multiplier)', () => {
  const components = { a: 1.0, b: 1.0 };
  const trustByKey = { a: 'gold' };  // b has no trust set
  const baseWeights = { a: 0.10, b: 0.10 };

  // Effective: a = 0.10 * 1.0 = 0.10; b = 0.10 * 0.20 = 0.02
  // Total = 0.12; a share = 10/12; b share = 2/12
  // Score = (1.0 * 10/12 + 1.0 * 2/12) * 100 = 100
  // Score is same (both 1.0) but ratio shifted; test with different scores:
  const scoreAOnly = computeTrustWeightedScore(
    { a: 1.0, b: 0.0 },
    trustByKey,
    baseWeights,
  );
  const scoreBOnly = computeTrustWeightedScore(
    { a: 0.0, b: 1.0 },
    trustByKey,
    baseWeights,
  );
  // a (gold) with value 1.0 beats b (defaulted unverified) with value 1.0
  assert.ok(scoreAOnly > scoreBOnly * 3,
    `gold a=${scoreAOnly} should be >3x unverified b=${scoreBOnly}`);
});

test('empty components returns 0, not NaN', () => {
  assert.equal(computeTrustWeightedScore({}, {}, { swe: 0.20 }), 0);
  assert.equal(computeTrustWeightedScore({ swe: null }, {}, { swe: 0.20 }), 0);
});
