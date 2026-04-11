import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMonitorClassificationPrompt } from './industry-monitor.js';

test('buildMonitorClassificationPrompt includes coding-specific event types and rules', () => {
  const prompt = buildMonitorClassificationPrompt(
    { name: 'GitHub Copilot Plans', type: 'pricing' },
    'GitHub Copilot Pro+ adds higher usage caps and new team billing tiers.'
  );

  assert.match(prompt, /coding-model/);
  assert.match(prompt, /coding-plan/);
  assert.match(prompt, /Prioritize coding-model and coding-plan/);
  assert.match(prompt, /Output ONLY the JSON lines or NONE/);
});