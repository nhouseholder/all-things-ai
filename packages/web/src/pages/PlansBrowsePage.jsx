import { useState, useMemo, lazy, Suspense } from 'react';
import {
  Loader2, Filter, CreditCard, Zap, Check, X, ChevronDown, ChevronUp,
  ExternalLink, DollarSign, Cpu, AlertTriangle, ThumbsUp, ThumbsDown,
  ArrowUpDown, MessageSquare, Info, Sparkles,
} from 'lucide-react';
import { useToolPlans } from '../lib/hooks.js';
import { formatPlanPrice, timeAgo } from '../lib/format.js';

function isCodingSubscription(plan) {
  return plan?.comparison?.track === 'coding-subscription';
}

const CodingPlansContent = lazy(() => import('./CodingPlansPage.jsx'));

const TIER_COLORS = {
  free:    { bg: 'bg-gray-500/5', border: 'border-gray-500/30', badge: 'bg-gray-500/20 text-gray-400', label: 'Free Tier' },
  budget:  { bg: 'bg-emerald-500/5', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-400', label: 'Budget' },
  mid:     { bg: 'bg-blue-500/5', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-400', label: 'Mid-Range' },
  premium: { bg: 'bg-violet-500/5', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-400', label: 'Premium' },
  ultra:   { bg: 'bg-orange-500/5', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400', label: 'Ultra' },
};

function getTier(price) {
  if (price == null || price === 0) return 'free';
  if (price <= 20) return 'budget';
  if (price <= 50) return 'mid';
  if (price <= 150) return 'premium';
  return 'ultra';
}

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'value', label: 'Best Value (models per $)' },
  { value: 'models', label: 'Most Models' },
];

const TIER_FILTERS = [
  { value: '', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'budget', label: 'Budget ($1-20)' },
  { value: 'mid', label: 'Mid ($20-50)' },
  { value: 'premium', label: 'Premium ($50-150)' },
  { value: 'ultra', label: 'Ultra ($150+)' },
];

function formatNumericRate(value) {
  if (value == null) return null;
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function getModelUsage(plan, model) {
  if (model.credits_per_request != null) {
    const rate = formatNumericRate(model.credits_per_request);
    if (plan.tool_slug === 'github-copilot') {
      const uses = plan.included_requests
        ? Math.floor(plan.included_requests / model.credits_per_request)
        : null;
      return {
        label: `${rate}x req`,
        detail: uses ? `~${uses}/mo included` : null,
      };
    }

    return {
      label: `${rate} credits`,
      detail: null,
    };
  }

  if (model.access_level === 'byok') {
    return { label: 'BYOK', detail: null };
  }

  if (model.access_level === 'credits') {
    return {
      label: plan.overage_rate_unit === 'per-million-tokens' ? 'API rate' : 'Credit pool',
      detail: null,
    };
  }

  if (model.access_level === 'full') {
    if (plan.included_requests) {
      return { label: 'Included', detail: `${plan.included_requests}/mo pool` };
    }
    return { label: 'Included', detail: null };
  }

  return { label: '—', detail: null };
}

function PlanCard({ plan, expanded, onToggle }) {
  const anchor = plan.price_anchor ?? plan.price_monthly;
  const price = plan.price_monthly;
  const tier = getTier(anchor);
  const tc = TIER_COLORS[tier];
  const priceLabel = formatPlanPrice(plan);
  const isTrueFree = price === 0;
  const models = Array.isArray(plan.model_pricing) ? plan.model_pricing : [];
  const feats = plan.features;
  const featureList = feats?.features || feats?.feature_list || [];
  const requests = feats?.requests || plan.included_requests;
  const reviews = plan.reviews || [];
  const avgSat = reviews.length ? Math.round(reviews.reduce((s, r) => s + (r.satisfaction || 0), 0) / reviews.length) : null;

  return (
    <div className={`rounded-xl border ${tc.border} ${tc.bg} overflow-hidden transition-all`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tc.badge}`}>
                {tc.label}
              </span>
              {plan.overage_model && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  plan.overage_model === 'stopped' ? 'bg-red-500/10 text-red-400' :
                  plan.overage_model === 'pay-per-use' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {plan.overage_model === 'pay-per-use' ? 'Pay-as-you-go overage' :
                   plan.overage_model === 'stopped' ? 'Hard limit — upgrade required' :
                   plan.overage_model}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white">{plan.tool_name}</h3>
            <p className="text-xs text-gray-500">{plan.plan_name} &middot; {plan.vendor}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className={`text-2xl font-extrabold ${isTrueFree ? 'text-gray-400' : 'text-white'}`}>
              {priceLabel}
            </p>
            {isTrueFree && (
              <p className="text-[10px] text-yellow-500">Limited models &amp; usage</p>
            )}
            {plan.price_yearly && price > 0 && (
              <p className="text-[10px] text-gray-500">${plan.price_yearly}/yr ({Math.round((1 - plan.price_yearly / (price * 12)) * 100)}% off)</p>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>{models.length} model{models.length !== 1 ? 's' : ''}</span>
          </div>
          {requests && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>{requests}</span>
            </div>
          )}
          {avgSat != null && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare className="w-3 h-3 text-blue-400" />
              <span>{avgSat}% satisfaction</span>
            </div>
          )}
        </div>

        {/* Per-model token costs */}
        {(models.length > 0) && (
          <div className="mb-3 rounded-lg border border-gray-800/50 overflow-hidden overflow-x-auto">
            <table className="w-full text-[10px] min-w-[420px]">
              <thead>
                <tr className="bg-gray-800/30 text-gray-500">
                  <th className="text-left py-1.5 px-2 font-medium">Model</th>
                  <th className="text-left py-1.5 px-2 font-medium">Usage Rate</th>
                  <th className="text-right py-1.5 px-2 font-medium">Input/MTok</th>
                  <th className="text-right py-1.5 px-2 font-medium">Output/MTok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {models.slice(0, expanded ? 20 : 4).map(mp => {
                  const usage = getModelUsage(plan, mp);
                  return (
                  <tr key={mp.slug}>
                    <td className="py-1.5 px-2">
                      <div className="text-gray-300 font-medium">{mp.name || mp.slug}</div>
                      {expanded && mp.cost_notes && (
                        <div className="text-[9px] text-gray-500 mt-0.5 leading-relaxed">{mp.cost_notes}</div>
                      )}
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="text-cyan-400 font-mono">{usage.label}</div>
                      {usage.detail && (
                        <div className="text-[9px] text-gray-500 mt-0.5">{usage.detail}</div>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right text-emerald-400 font-mono">
                      {mp.input_per_mtok != null ? `$${mp.input_per_mtok}` : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-right text-emerald-400 font-mono">
                      {mp.output_per_mtok != null ? `$${mp.output_per_mtok}` : '—'}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {!expanded && models.length > 4 && (
              <div className="text-center py-1 text-[9px] text-gray-500 bg-gray-800/20">
                +{models.length - 4} more models
              </div>
            )}
          </div>
        )}

        {/* Features */}
        {featureList.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            {featureList.slice(0, expanded ? 20 : 4).map((f, i) => (
              <div key={i} className="flex items-center gap-1 text-[11px] text-gray-400">
                <Check className="w-3 h-3 text-green-500 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
            {!expanded && featureList.length > 4 && (
              <span className="text-[11px] text-gray-600">+{featureList.length - 4} more</span>
            )}
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less' : 'Full details'}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-800 px-4 py-3 bg-gray-900/60 space-y-3">
          {/* Overage / usage info */}
          {(plan.overage_rate_description || plan.usage_notes) && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Usage & Overage
              </h4>
              {plan.overage_rate_description && (
                <p className="text-xs text-yellow-400/80 mb-1 break-words leading-relaxed">{plan.overage_rate_description}</p>
              )}
              {plan.usage_notes && (
                <p className="text-xs text-gray-400 leading-relaxed break-words">{plan.usage_notes}</p>
              )}
            </div>
          )}

          {/* Tool description */}
          {plan.tool_description && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">About</h4>
              <p className="text-xs text-gray-400 leading-relaxed break-words">{plan.tool_description}</p>
            </div>
          )}

          {/* Community reviews */}
          {reviews.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Community Reviews
              </h4>
              {reviews.map((r, i) => (
                <div key={i} className="grid grid-cols-[88px_1fr] gap-3 text-[11px] mb-2 items-start">
                  <span className="text-gray-500 uppercase break-words leading-relaxed">{r.source}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className={`font-medium ${r.satisfaction >= 70 ? 'text-green-400' : r.satisfaction >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {r.satisfaction}%
                      </span>
                      <span className="text-gray-600">({r.review_count} reviews)</span>
                    </div>
                    {r.common_praises && (
                      <p className="text-green-400/60 leading-relaxed break-words mt-1">{r.common_praises}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          {plan.install_url && (
            <a
              href={plan.install_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Get {plan.tool_name}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlansBrowsePage() {
  const { data, isLoading } = useToolPlans();
  const [sort, setSort] = useState('price-asc');
  const [tierFilter, setTierFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [view, setView] = useState('general'); // 'general' | 'coding'

  const plans = useMemo(() => {
    // Browse view segregates by track — general plans only; Coding view loads CodingPlansContent
    let items = (data?.plans || []).filter(p => !isCodingSubscription(p));

    // Filter by tier (uses price_anchor so reference-priced plans land in the right tier)
    if (tierFilter) {
      items = items.filter(p => getTier(p.price_anchor ?? p.price_monthly) === tierFilter);
    }

    // Sort — plans without a resolvable price sort last
    items = [...items].sort((a, b) => {
      const pa = a.price_anchor ?? a.price_monthly ?? Number.POSITIVE_INFINITY;
      const pb = b.price_anchor ?? b.price_monthly ?? Number.POSITIVE_INFINITY;
      const ma = Array.isArray(a.model_pricing) ? a.model_pricing.length : 0;
      const mb = Array.isArray(b.model_pricing) ? b.model_pricing.length : 0;

      switch (sort) {
        case 'price-asc': return pa - pb;
        case 'price-desc': return pb - pa;
        case 'value': return (pb > 0 && Number.isFinite(pb) ? mb / pb : mb * 100) - (pa > 0 && Number.isFinite(pa) ? ma / pa : ma * 100);
        case 'models': return mb - ma;
        default: return pa - pb;
      }
    });

    return items;
  }, [data, sort, tierFilter]);

  // Summary stats — only counts general plans, same segregation as the Browse list
  const allPlans = (data?.plans || []).filter(p => !isCodingSubscription(p));
  const freePlans = allPlans.filter(p => p.price_monthly === 0).length;
  const paidPlans = allPlans.filter(p => p.price_monthly > 0);
  const avgPrice = paidPlans.length
    ? Math.round(paidPlans.reduce((s, p) => s + p.price_monthly, 0) / paidPlans.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* View toggle: general vs coding-focused */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setView('general')}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            view === 'general'
              ? 'bg-blue-500/15 text-blue-300 border border-blue-400/30'
              : 'bg-gray-900/40 text-gray-500 border border-gray-800 hover:text-gray-300'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          All Plans
        </button>
        <button
          onClick={() => setView('coding')}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            view === 'coding'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-400/30'
              : 'bg-gray-900/40 text-gray-500 border border-gray-800 hover:text-gray-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Coding-Focused Providers
        </button>
      </div>

      {view === 'coding' && (
        <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>}>
          <CodingPlansContent />
        </Suspense>
      )}

      {view === 'general' && (
      <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-lg font-bold text-white">{allPlans.length}</p>
          <p className="text-[10px] text-gray-500 uppercase">Total Plans</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3 text-center">
          <p className="text-lg font-bold text-gray-400">{freePlans}</p>
          <p className="text-[10px] text-gray-500 uppercase">Free Tier</p>
          <p className="text-[8px] text-yellow-500/70">Limited</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-lg font-bold text-blue-400">${avgPrice}</p>
          <p className="text-[10px] text-gray-500 uppercase">Avg Paid Plan</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-lg font-bold text-purple-400">{new Set(allPlans.map(p => p.tool_slug)).size}</p>
          <p className="text-[10px] text-gray-500 uppercase">Platforms</p>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-3.5 h-3.5 text-gray-500" />
        {TIER_FILTERS.map(t => (
          <button
            key={t.value}
            onClick={() => setTierFilter(t.value === tierFilter ? '' : t.value)}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
              tierFilter === t.value ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}

        <span className="text-gray-700 mx-1">|</span>

        <ArrowUpDown className="w-3 h-3 text-gray-500" />
        {SORT_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
              sort === s.value ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-xl bg-gray-900/50 border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-gray-800 border-dashed">
          <CreditCard className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No plans match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              expanded={expandedId === plan.id}
              onToggle={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
            />
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
