function safeJsonParse(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string') return value;

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function formatPriceLabel(priceMonthly) {
  if (priceMonthly == null) return null;
  if (priceMonthly === 0) return 'Free';

  const value = Number(priceMonthly);
  return Number.isInteger(value) ? `$${value}/mo` : `$${value.toFixed(2)}/mo`;
}

function buildFallbackModelPricing(modelSlugs, modelPricingBySlug) {
  return (Array.isArray(modelSlugs) ? modelSlugs : [])
    .filter((slug) => slug && slug !== 'any-via-api')
    .map((slug) => {
      const model = modelPricingBySlug[slug];

      if (!model) {
        return {
          slug,
          name: slug,
          vendor: null,
          input_per_mtok: null,
          output_per_mtok: null,
          access_level: null,
          credits_per_request: null,
          cost_notes: null,
        };
      }

      return {
        slug,
        name: model.name,
        vendor: model.vendor,
        input_per_mtok: model.input_price_per_mtok,
        output_per_mtok: model.output_price_per_mtok,
        access_level: null,
        credits_per_request: null,
        cost_notes: null,
      };
    });
}

function sortPlanModels(a, b) {
  const rateA = a.credits_per_request ?? Number.POSITIVE_INFINITY;
  const rateB = b.credits_per_request ?? Number.POSITIVE_INFINITY;

  if (rateA !== rateB) return rateA - rateB;
  return String(a.name || a.slug).localeCompare(String(b.name || b.slug));
}

function getPriceAnchor(plan, comparison) {
  const rawValue = plan.price_monthly ?? comparison?.reference_price_monthly;
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

export function buildPlanRecords(rawPlans, modelPricingBySlug = {}, availabilityRows = []) {
  const modelsByPlanId = {};

  for (const row of availabilityRows) {
    if (!modelsByPlanId[row.plan_id]) modelsByPlanId[row.plan_id] = [];
    modelsByPlanId[row.plan_id].push({
      slug: row.slug,
      name: row.name,
      vendor: row.vendor,
      input_per_mtok: row.input_price_per_mtok,
      output_per_mtok: row.output_price_per_mtok,
      access_level: row.access_level,
      credits_per_request: row.credits_per_request,
      cost_notes: row.cost_notes,
    });
  }

  return rawPlans.map((plan) => {
    const features = safeJsonParse(plan.features, {});
    const modelSlugs = safeJsonParse(plan.models_included, []);
    const reviews = safeJsonParse(plan.reviews, []);
    const comparison = features?.comparison && typeof features.comparison === 'object'
      ? features.comparison
      : null;

    const fallbackModelPricing = buildFallbackModelPricing(modelSlugs, modelPricingBySlug);
    const planModels = [...(modelsByPlanId[plan.id] || fallbackModelPricing)].sort(sortPlanModels);

    return {
      ...plan,
      features,
      comparison,
      catalog_hidden: Boolean(comparison?.hidden_from_catalog),
      pricing_status: comparison?.pricing_confidence || (plan.price_monthly == null ? 'unknown' : 'official'),
      price_anchor: getPriceAnchor(plan, comparison),
      price_display: formatPriceLabel(plan.price_monthly)
        || comparison?.reference_price_label
        || 'Pricing not publicly confirmed',
      models_included: planModels.map((model) => model.slug),
      model_pricing: planModels,
      reviews: Array.isArray(reviews) ? reviews.filter((review) => review?.source) : [],
    };
  });
}

export function isCodingSubscriptionPlan(plan) {
  return plan?.comparison?.track === 'coding-subscription';
}

export function isCatalogVisiblePlan(plan) {
  return !plan?.catalog_hidden;
}