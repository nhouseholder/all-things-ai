import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCapabilityProfile, buildCompareBenchmarks, buildCompareTaskEstimates } from './models.js';

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

test('buildCapabilityProfile supports legacy benchmark aliases used in older seed data', () => {
  const profile = buildCapabilityProfile(
    {
      swe_bench_component: null,
      livecodebench_component: null,
      nuance_component: null,
      arena_component: 0,
      tau_component: null,
      gpqa_component: null,
      hle_component: null,
      mmlu_component: null,
      humaneval_component: null,
      success_rate_component: null,
      community_adjustment: 0,
    },
    [
      { benchmark_name: 'TAU-bench (airline)', score: 53 },
      { benchmark_name: 'MMLU Pro', score: 84.3 },
      { benchmark_name: 'HumanEval', score: 93 },
    ],
    {}
  );

  assert.equal(profile.tau, 53);
  assert.equal(profile.mmlu, 84.3);
  assert.equal(profile.humaneval, 93);
});

test('buildCapabilityProfile derives missing HLE, MMLU, and HumanEval components heuristically', () => {
  const profile = buildCapabilityProfile(
    {
      swe_bench_component: 74,
      livecodebench_component: 76,
      nuance_component: 76,
      arena_component: 69,
      tau_component: 70,
      gpqa_component: 82,
      hle_component: null,
      mmlu_component: null,
      humaneval_component: null,
      success_rate_component: 76,
      community_adjustment: 0,
    },
    [],
    {}
  );

  assert.equal(profile.hle, 17.2);
  assert.equal(profile.mmlu, 83);
  assert.equal(profile.humaneval, 87);
});

test('buildCapabilityProfile derives missing TAU and Arena so radar is never collapsed', () => {
  // Mirrors GLM 5.1 in production: arena present, tau null, sr null. Without fallbacks, tau/sr render as 0.
  const profile = buildCapabilityProfile(
    {
      swe_bench_component: 75.5,
      livecodebench_component: 78,
      nuance_component: 82,
      arena_component: 55,
      tau_component: null,
      gpqa_component: 85,
      hle_component: null,
      mmlu_component: null,
      humaneval_component: null,
      success_rate_component: null,
      community_adjustment: 0,
    },
    [],
    {}
  );

  // All 10 axes must be non-null and non-zero so the radar polygon is closed.
  for (const key of ['swe_bench', 'livecodebench', 'nuance', 'arena', 'tau', 'gpqa', 'hle', 'mmlu', 'humaneval', 'success_rate']) {
    assert.ok(profile[key] != null && profile[key] !== 0, `expected ${key} > 0, got ${profile[key]}`);
  }
  // Tau = 0.6*swe + 0.4*nuance - 4 = 0.6*75.5 + 0.4*82 - 4 = 45.3 + 32.8 - 4 = 74.1
  assert.equal(profile.tau, 74.1);
  // Arena was provided (55), should be untouched
  assert.equal(profile.arena, 55);
});

test('buildCapabilityProfile derives Arena when null using nuance/mmlu/gpqa blend', () => {
  const profile = buildCapabilityProfile(
    {
      swe_bench_component: 70,
      livecodebench_component: 72,
      nuance_component: 80,
      arena_component: null,
      tau_component: 65,
      gpqa_component: 84,
      hle_component: 18,
      mmlu_component: 86,
      humaneval_component: 78,
      success_rate_component: 70,
      community_adjustment: 0,
    },
    [],
    {}
  );
  // Arena = (0.5*80 + 0.3*86 + 0.2*84) / 1.0 - 6 = (40 + 25.8 + 16.8) - 6 = 82.6 - 6 = 76.6
  assert.equal(profile.arena, 76.6);
});

test('buildCompareBenchmarks synthesizes missing canonical compare benchmarks', () => {
  const benchmarks = buildCompareBenchmarks(
    [
      { benchmark_name: 'SWE-bench Verified', category: 'coding', score: 76.8, max_score: 100 },
      { benchmark_name: 'TAU-bench (airline)', category: 'agentic', score: 53, max_score: 100 },
    ],
    {
      swe_bench: 76.8,
      livecodebench: 79.4,
      nuance: 84,
      arena: 61.25,
      tau: 53,
      gpqa: 86.5,
      hle: 18.2,
      mmlu: 89.1,
      humaneval: 91,
    }
  );

  const benchmarkNames = benchmarks.map((benchmark) => benchmark.benchmark_name);
  assert.equal(benchmarkNames.filter((name) => name === 'SWE-bench Verified').length, 1);
  assert.equal(benchmarkNames.includes('LiveCodeBench'), true);
  assert.equal(benchmarkNames.includes('Chatbot Arena ELO'), true);
  assert.equal(benchmarkNames.includes("Humanity's Last Exam"), true);
  assert.equal(benchmarkNames.includes('MMLU'), true);
  assert.equal(benchmarkNames.includes('HumanEval+'), true);

  const arena = benchmarks.find((benchmark) => benchmark.benchmark_name === 'Chatbot Arena ELO');
  assert.equal(arena.score, 1445);
  assert.equal(arena.estimated, true);

  const tau = benchmarks.find((benchmark) => benchmark.benchmark_name === 'TAU-bench (airline)');
  assert.equal(tau.estimated, undefined);
});

test('buildCompareTaskEstimates synthesizes missing compare task rows', () => {
  const taskEstimates = buildCompareTaskEstimates(
    {
      input_price_per_mtok: 0.5,
      output_price_per_mtok: 3,
    },
    {
      success_rate: 76,
    },
    {},
    [
      {
        slug: 'quick-fixes',
        avg_input_tokens: 3000,
        avg_output_tokens: 1500,
      },
      {
        slug: 'complex-debugging',
        avg_input_tokens: 15000,
        avg_output_tokens: 6000,
      },
    ]
  );

  assert.equal(taskEstimates['quick-fixes'].success_rate, 0.88);
  assert.equal(taskEstimates['quick-fixes'].steering_effort, 'low');
  assert.equal(taskEstimates['quick-fixes'].estimated, true);
  assert.equal(taskEstimates['quick-fixes'].cost_per_task, 0.0066);

  assert.equal(taskEstimates['complex-debugging'].success_rate, 0.7);
  assert.equal(taskEstimates['complex-debugging'].steering_effort, 'medium');
  assert.equal(taskEstimates['complex-debugging'].estimated, true);
  assert.equal(taskEstimates['complex-debugging'].cost_per_task, 0.0689);
});