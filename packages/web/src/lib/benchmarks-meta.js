// Benchmark metadata — single source of truth for radar axes, score breakdowns, and tooltips.
// Keys match the `label` field in SCORE_DIMENSIONS (ComparePage.jsx) so lookups are O(1) by display name.
//
// `measures` should stay <= 6 words so it fits the inline 2-column legend without wrapping awkwardly.

export const BENCHMARK_META = {
  'SWE-bench':    { full: 'SWE-bench Verified',     measures: 'Real GitHub issue resolution' },
  'LiveCode':     { full: 'LiveCodeBench',          measures: 'Competitive programming puzzles' },
  'Nuance':       { full: 'Nuance Reasoning',       measures: 'Multi-turn instruction following' },
  'Arena':        { full: 'Chatbot Arena ELO',      measures: 'Human preference ranking' },
  'TAU-bench':    { full: 'TAU-bench',              measures: 'Tool-use agent tasks' },
  'GPQA':         { full: 'GPQA Diamond',           measures: 'Graduate-level science Q&A' },
  'HLE':          { full: "Humanity's Last Exam",   measures: 'Expert multi-domain knowledge' },
  'MMLU':         { full: 'MMLU-Pro',               measures: '57-subject academic knowledge' },
  'HumanEval':    { full: 'HumanEval+',             measures: 'Python function synthesis' },
  'Success Rate': { full: 'Task Success Rate',      measures: 'Estimated real-world completion' },
};

// Stable axis order — matches SCORE_DIMENSIONS in ComparePage.jsx for predictable legend layout.
export const BENCHMARK_ORDER = [
  'SWE-bench', 'LiveCode', 'Nuance', 'Arena', 'TAU-bench',
  'GPQA', 'HLE', 'MMLU', 'HumanEval', 'Success Rate',
];
