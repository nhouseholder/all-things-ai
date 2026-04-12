import assert from 'node:assert/strict';
import test from 'node:test';

import { detectModels } from './review-analysis-engine.js';

test('detectModels prefers version-specific aliases over broader parent aliases', () => {
  const aliases = {
    'glm-5': ['glm-5', 'glm 5'],
    'glm-5.1': ['glm-5.1', 'glm 5.1'],
  };

  const detected = detectModels('GLM-5.1 is much stronger for coding than prior GLM releases.', aliases);

  assert.deepEqual(detected, ['glm-5.1']);
});