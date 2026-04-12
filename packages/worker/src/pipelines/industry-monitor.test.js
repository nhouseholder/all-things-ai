import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMonitorClassificationPrompt, extractDirectSourceModelSignals } from './industry-monitor.js';

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

test('extractDirectSourceModelSignals pulls versioned models from trusted official catalog pages', () => {
  const signals = extractDirectSourceModelSignals(
    {
      key: 'alibaba-model-studio-models',
      name: 'Alibaba Model Studio Models',
      url: 'https://www.alibabacloud.com/help/en/model-studio/getting-started/models',
      trust: 'official',
      vendorHints: ['Alibaba'],
    },
    'new Qwen3-Max Best for complex tasks, most capable new Qwen3.6-Plus Balanced performance, speed, and cost new Qwen3.5-Flash Best for simple tasks'
  );

  assert(signals.some((signal) => signal.slug === 'qwen3-6-plus'));
  assert(signals.some((signal) => signal.signalType === 'official'));
});