const STEERING_SCORE = {
  low: 100,
  medium: 65,
  high: 30,
};

const VIBE_TASK_WEIGHTS = {
  'complex-debugging': 0.22,
  'feature-implementation': 0.24,
  'boilerplate-scaffolding': 0.12,
  'quick-fixes': 0.08,
  'multi-file-refactor': 0.18,
  'code-review': 0.10,
  'learning-exploring': 0.06,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizePriceScore(blendedCost) {
  if (blendedCost == null) return 55;
  if (blendedCost <= 0.5) return 100;
  if (blendedCost <= 1.5) return 88;
  if (blendedCost <= 3) return 74;
  if (blendedCost <= 6) return 56;
  if (blendedCost <= 12) return 38;
  return 18;
}

function normalizeActivityScore(totalTokens) {
  if (!totalTokens) return 45;
  const scaled = ((Math.log10(totalTokens + 1) - 4) / 5) * 100;
  return clamp(Number.isFinite(scaled) ? scaled : 45);
}

function normalizeCapabilityScore(openrouter) {
  if (!openrouter) return 45;
  let score = 0;

  if (openrouter.context_length >= 1_000_000) score += 35;
  else if (openrouter.context_length >= 200_000) score += 28;
  else if (openrouter.context_length >= 128_000) score += 20;
  else if (openrouter.context_length >= 64_000) score += 12;
  else score += 6;

  if (openrouter.max_completion_tokens >= 32_000) score += 12;
  else if (openrouter.max_completion_tokens >= 8_000) score += 8;

  if (openrouter.supports_tools) score += 18;
  if (openrouter.supports_structured_outputs) score += 12;
  if (openrouter.supports_files) score += 10;
  if (openrouter.supports_images) score += 5;
  if (openrouter.supports_reasoning) score += 8;

  return clamp(score);
}

function describeFit(score) {
  if (score >= 85) return 'Excellent fit';
  if (score >= 72) return 'Strong fit';
  if (score >= 58) return 'Good fit';
  if (score >= 45) return 'Mixed fit';
  return 'Needs steering';
}

function describeActivity(totalTokens) {
  if (!totalTokens) return null;
  if (totalTokens >= 1_000_000_000) return 'High OpenRouter usage';
  if (totalTokens >= 100_000_000) return 'Popular on OpenRouter';
  if (totalTokens >= 5_000_000) return 'Emerging on OpenRouter';
  return 'Limited OpenRouter usage';
}

export function summarizeTaskSignals(taskRows) {
  if (!taskRows?.length) {
    return {
      avg_success: null,
      vibe_success: null,
      avg_autonomy: null,
      steering_score: null,
      avg_minutes: null,
    };
  }

  let weightedSuccess = 0;
  let totalWeight = 0;
  let autonomySum = 0;
  let autonomyCount = 0;
  let steeringSum = 0;
  let steeringCount = 0;
  let minutesSum = 0;
  let minutesCount = 0;
  let avgSuccessSum = 0;
  let avgSuccessCount = 0;

  for (const row of taskRows) {
    const weight = VIBE_TASK_WEIGHTS[row.task_slug] ?? 0.05;
    if (row.first_attempt_success_rate != null) {
      weightedSuccess += row.first_attempt_success_rate * weight;
      totalWeight += weight;
      avgSuccessSum += row.first_attempt_success_rate;
      avgSuccessCount += 1;
    }
    if (row.autonomy_score != null) {
      autonomySum += row.autonomy_score;
      autonomyCount += 1;
    }
    if (row.steering_effort && STEERING_SCORE[row.steering_effort] != null) {
      steeringSum += STEERING_SCORE[row.steering_effort];
      steeringCount += 1;
    }
    if (row.avg_minutes_to_complete != null) {
      minutesSum += row.avg_minutes_to_complete;
      minutesCount += 1;
    }
  }

  return {
    avg_success: avgSuccessCount ? avgSuccessSum / avgSuccessCount : null,
    vibe_success: totalWeight ? weightedSuccess / totalWeight : null,
    avg_autonomy: autonomyCount ? autonomySum / autonomyCount : null,
    steering_score: steeringCount ? steeringSum / steeringCount : null,
    avg_minutes: minutesCount ? minutesSum / minutesCount : null,
  };
}

export function computeVibeCoderFit({ model, openrouter, taskSignals, community }) {
  const blendedCost = model?.blended_cost_per_mtok != null
    ? Number(model.blended_cost_per_mtok)
    : model?.input_price_per_mtok != null && model?.output_price_per_mtok != null
      ? (Number(model.input_price_per_mtok) * 0.3) + (Number(model.output_price_per_mtok) * 0.7)
      : null;

  const totalActivity = Number(openrouter?.prompt_tokens_daily || 0)
    + Number(openrouter?.reasoning_tokens_daily || 0)
    + Number(openrouter?.completion_tokens_daily || 0);

  const successScore = clamp((taskSignals?.vibe_success ?? taskSignals?.avg_success ?? 0.55) * 100);
  const autonomyScore = clamp(taskSignals?.avg_autonomy ?? 55);
  const steeringScore = clamp(taskSignals?.steering_score ?? 55);
  const communityScore = clamp(
    community?.vibe_satisfaction
    ?? community?.satisfaction
    ?? 55
  );
  const priceScore = normalizePriceScore(blendedCost);
  const activityScore = normalizeActivityScore(totalActivity);
  const capabilityScore = normalizeCapabilityScore(openrouter);

  const weights = [
    [successScore, 0.32],
    [autonomyScore, 0.16],
    [steeringScore, 0.14],
    [communityScore, 0.10],
    [priceScore, 0.12],
    [activityScore, 0.08],
    [capabilityScore, 0.08],
  ];

  const fitScore = weights.reduce((sum, [value, weight]) => sum + value * weight, 0);
  const badges = [];

  if (successScore >= 80) badges.push('High first-pass success');
  if (steeringScore >= 80) badges.push('Low steering');
  if (autonomyScore >= 75) badges.push('Autonomous on bigger tasks');
  if (priceScore >= 80) badges.push('Budget-friendly');
  if (capabilityScore >= 75) badges.push('Agent/tool friendly');
  const activityBadge = describeActivity(totalActivity);
  if (activityBadge) badges.push(activityBadge);
  if (openrouter?.context_length >= 200_000) badges.push('Big repo context');

  const cautions = [];
  if (priceScore <= 35) cautions.push('Premium-priced');
  if (steeringScore <= 45) cautions.push('Needs more steering');
  if (activityScore <= 35) cautions.push('Lower live usage signal');
  if (communityScore <= 50) cautions.push('Weaker vibe-coder sentiment');

  const summaryParts = [];
  if (successScore >= 80) summaryParts.push('strong first-pass coding results');
  if (steeringScore >= 80) summaryParts.push('does not need much hand-holding');
  if (capabilityScore >= 75) summaryParts.push('plays well with agent/tool workflows');
  if (priceScore >= 80) summaryParts.push('keeps costs sane for iterative building');
  if (activityScore >= 70) summaryParts.push('has healthy real-world OpenRouter usage');

  const summary = summaryParts.length
    ? `Great for vibe coding because it ${summaryParts.slice(0, 3).join(', ')}.`
    : 'Usable for vibe coding, but its trade-offs depend more on your budget and tolerance for steering.';

  return {
    score: Number(fitScore.toFixed(1)),
    label: describeFit(fitScore),
    summary,
    badges: badges.slice(0, 4),
    cautions: cautions.slice(0, 3),
    activity_tokens_daily: totalActivity || null,
    price_tier: priceScore >= 80 ? 'budget' : priceScore >= 55 ? 'balanced' : 'premium',
  };
}
