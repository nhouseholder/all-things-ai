import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCapabilityProfile } from './models.js';

test('buildCapabilityProfile fills missing capability axes from raw benchmarks', () => {
  const profile = buildCapabilityProfile(
    {
      swe_bench_component: 76.8,
      livecodebench_component: 79.4,
      nuance_component: 84,
      arena_component: 0,
      tau_component: null,
      gpqa_component: 86.5,
      hle_component: 0,
      mmlu_component: null,
      humaneval_component: 0,
      success_rate_component: 0,
      community_adjustment: 1.5,
    },
    [
      { benchmark_name: 'Chatbot Arena ELO', score: 1445 },
      { benchmark_name: 'TAU-bench Retail', score: 68 },
      { benchmark_name: "Humanity's Last Exam", score: 18.2 },
      { benchmark_name: 'MMLU', score: 89.1 },
      { benchmark_name: 'HumanEval+', score: 91 },
    ],
    {
      bugFixing: { success_rate: 0.62 },
      refactoring: { success_rate: 0.74 },
    }
  );

  assert.equal(profile.swe_bench, 76.8);
  assert.equal(profile.arena, 61.25);
  assert.equal(profile.tau, 68);
  assert.equal(profile.hle, 18.2);
  assert.equal(profile.mmlu, 89.1);
  assert.equal(profile.humaneval, 91);
  assert.equal(profile.success_rate, 68);
  assert.equal(profile.community, 1.5);
});

test('buildCapabilityProfile keeps existing populated components', () => {
  const profile = buildCapabilityProfile(
    {
      swe_bench_component: 80,
      livecodebench_component: 82,
      nuance_component: 78,
      arena_component: 70,
      tau_component: 66,
      gpqa_component: 84,
      hle_component: 24,
      mmlu_component: 88,
      humaneval_component: 92,
      success_rate_component: 73,
      community_adjustment: -0.5,
    },
    [
      { benchmark_name: 'Chatbot Arena ELO', score: 1300 },
      { benchmark_name: "Humanity's Last Exam", score: 18.2 },
      { benchmark_name: 'MMLU', score: 72 },
    ],
    {
      coding: { success_rate: 0.55 },
    }
  );

  assert.equal(profile.arena, 70);
  assert.equal(profile.hle, 24);
  assert.equal(profile.mmlu, 88);
  assert.equal(profile.success_rate, 73);
  assert.equal(profile.community, -0.5);
});