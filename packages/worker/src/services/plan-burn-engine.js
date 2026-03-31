/**
 * Plan Burn Engine — estimates monthly request consumption by persona,
 * calculates overage costs, and recommends the best plan for actual usage.
 */

// Persona presets: monthly requests by model tier
const PERSONAS = {
  'weekend-hacker': {
    label: 'Weekend Hacker',
    description: '5-10 hrs/week, mostly quick fixes and learning',
    monthly_requests: 120,
    premium_pct: 0.15,    // 15% of requests use premium models
    heavy_pct: 0.05,      // 5% use heavy/reasoning models
    standard_pct: 0.80,
  },
  'solo-founder': {
    label: 'Solo Founder',
    description: '30-40 hrs/week, feature building + debugging',
    monthly_requests: 600,
    premium_pct: 0.35,
    heavy_pct: 0.15,
    standard_pct: 0.50,
  },
  'freelancer': {
    label: 'Freelancer',
    description: '20-30 hrs/week, mixed client work',
    monthly_requests: 400,
    premium_pct: 0.25,
    heavy_pct: 0.10,
    standard_pct: 0.65,
  },
  'full-time-engineer': {
    label: 'Full-Time Engineer',
    description: '40+ hrs/week, complex debugging + refactoring',
    monthly_requests: 900,
    premium_pct: 0.40,
    heavy_pct: 0.20,
    standard_pct: 0.40,
  },
  'custom': {
    label: 'Custom',
    description: 'Set your own usage pattern',
    monthly_requests: 0,
    premium_pct: 0,
    heavy_pct: 0,
    standard_pct: 1.0,
  },
};

/**
 * Calculate weighted request cost for a plan based on model mix.
 *
 * @param {Object} plan - pricing_plan row with model_availability joined
 * @param {Object} persona - persona preset or custom config
 * @param {Array} models - model_availability rows for this plan
 * @returns {Object} burn simulation result
 */
export function simulatePlanBurn(plan, persona, models) {
  const totalRequests = persona.monthly_requests;
  const included = plan.included_requests || 0;

  // Classify models by tier based on credits_per_request
  const standard = models.filter(m =>
    (m.credits_per_request == null || m.credits_per_request <= 1) &&
    m.access_level !== 'byok'
  );
  const premium = models.filter(m =>
    m.credits_per_request > 1 && m.credits_per_request <= 3 &&
    m.access_level !== 'byok'
  );
  const heavy = models.filter(m =>
    m.credits_per_request > 3 &&
    m.access_level !== 'byok'
  );

  // Average credits_per_request per tier
  const avgCreditsStandard = standard.length
    ? standard.reduce((s, m) => s + (m.credits_per_request || 1), 0) / standard.length
    : 1;
  const avgCreditsPremium = premium.length
    ? premium.reduce((s, m) => s + (m.credits_per_request || 2), 0) / premium.length
    : 2;
  const avgCreditsHeavy = heavy.length
    ? heavy.reduce((s, m) => s + (m.credits_per_request || 5), 0) / heavy.length
    : 5;

  // Weighted credit consumption
  const standardCredits = totalRequests * persona.standard_pct * avgCreditsStandard;
  const premiumCredits = totalRequests * persona.premium_pct * avgCreditsPremium;
  const heavyCredits = totalRequests * persona.heavy_pct * avgCreditsHeavy;
  const totalCredits = standardCredits + premiumCredits + heavyCredits;

  // Burn rate
  const daysInMonth = 30;
  const dailyBurn = totalCredits / daysInMonth;
  const daysUntilExhausted = included > 0
    ? Math.min(daysInMonth, Math.floor(included / Math.max(dailyBurn, 0.01)))
    : null;
  const exhaustionDay = daysUntilExhausted != null && daysUntilExhausted < daysInMonth
    ? daysUntilExhausted
    : null;

  // Overage calculation
  const overageCredits = Math.max(0, totalCredits - included);
  let overageCost = 0;
  let overageBlocked = false;

  if (overageCredits > 0) {
    switch (plan.overage_model) {
      case 'pay-per-use':
        overageCost = plan.overage_rate_value
          ? overageCredits * plan.overage_rate_value
          : 0;
        break;
      case 'auto-topup':
        overageCost = plan.overage_rate_value
          ? overageCredits * plan.overage_rate_value
          : 0;
        break;
      case 'stopped':
        overageBlocked = true;
        overageCost = 0;
        break;
      case 'throttled':
        overageCost = 0; // throttled = still works, just slower
        break;
      default:
        overageCost = 0;
    }
  }

  const totalMonthlyCost = (plan.price_monthly || 0) + overageCost;
  const costPerRequest = totalRequests > 0
    ? totalMonthlyCost / totalRequests
    : 0;
  const utilizationPct = included > 0
    ? Math.min(100, Math.round((totalCredits / included) * 100))
    : null;

  return {
    plan_id: plan.id,
    plan_name: plan.plan_name,
    tool_name: plan.tool_name || plan.tool_slug,
    tool_slug: plan.tool_slug,
    price_monthly: plan.price_monthly || 0,
    included_requests: included,
    overage_model: plan.overage_model,

    // Usage breakdown
    total_requests: totalRequests,
    total_credits_consumed: Number(totalCredits.toFixed(1)),
    standard_credits: Number(standardCredits.toFixed(1)),
    premium_credits: Number(premiumCredits.toFixed(1)),
    heavy_credits: Number(heavyCredits.toFixed(1)),

    // Burn rate
    daily_burn_rate: Number(dailyBurn.toFixed(1)),
    days_until_exhausted: daysUntilExhausted,
    exhaustion_day: exhaustionDay,
    utilization_pct: utilizationPct,

    // Cost
    overage_credits: Number(overageCredits.toFixed(1)),
    overage_cost: Number(overageCost.toFixed(2)),
    overage_blocked: overageBlocked,
    total_monthly_cost: Number(totalMonthlyCost.toFixed(2)),
    cost_per_request: Number(costPerRequest.toFixed(4)),

    // Model counts
    models_available: models.length,
    standard_models: standard.length,
    premium_models: premium.length,
    heavy_models: heavy.length,

    // Verdict
    verdict: getVerdict(totalCredits, included, plan.overage_model, overageCost, plan.price_monthly),
  };
}

function getVerdict(totalCredits, included, overageModel, overageCost, baseCost) {
  if (!included) {
    if (overageModel === 'throttled') return { label: 'Unlimited (throttled)', severity: 'info' };
    return { label: 'Usage-based', severity: 'info' };
  }

  const pct = totalCredits / included;
  if (pct <= 0.60) return { label: 'Comfortable headroom', severity: 'good' };
  if (pct <= 0.85) return { label: 'Moderate fit', severity: 'ok' };
  if (pct <= 1.0) return { label: 'Tight — near limit', severity: 'warn' };

  // Over limit
  if (overageModel === 'stopped') return { label: 'Will hit wall', severity: 'danger' };
  if (overageCost > (baseCost || 20) * 0.5) return { label: 'Expensive overage', severity: 'danger' };
  return { label: 'Over limit — overage charges', severity: 'warn' };
}

/**
 * Rank plans for a persona by value (lowest total_monthly_cost with adequate coverage).
 */
export function rankPlansForPersona(burnResults) {
  return [...burnResults]
    .filter(b => !b.overage_blocked || b.utilization_pct <= 100)
    .sort((a, b) => {
      // Penalize plans that block overage
      if (a.overage_blocked && !b.overage_blocked) return 1;
      if (!a.overage_blocked && b.overage_blocked) return -1;

      // Sort by total monthly cost
      const costDiff = a.total_monthly_cost - b.total_monthly_cost;
      if (Math.abs(costDiff) > 1) return costDiff;

      // Tiebreak: prefer more models
      return b.models_available - a.models_available;
    });
}

export { PERSONAS };
