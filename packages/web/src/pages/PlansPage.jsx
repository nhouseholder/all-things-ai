import { useState, useEffect, useMemo } from 'react';
import {
  Loader2, Filter, CreditCard, Zap, Check, X, ChevronDown, ChevronUp,
  ExternalLink, DollarSign, Cpu, AlertTriangle, ThumbsUp, ThumbsDown,
  ArrowUpDown, MessageSquare, Info,
} from 'lucide-react';
import { useToolPlans } from '../lib/hooks.js';
import { setPageTitle, formatSubPrice } from '../lib/format.js';

const TIER_COLORS = {
  free:    { bg: 'bg-green-500/5', border: 'border-green-500/30', badge: 'bg-green-500/20 text-green-400', label: 'Free' },
  budget:  { bg: 'bg-emerald-500/5', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-400', label: 'Budget' },
  mid:     { bg: 'bg-blue-500/5', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-400', label: 'Mid-Range' },
  premium: { bg: 'bg-purple-500/5', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-400', label: 'Premium' },
  ultra:   { bg: 'bg-orange-500/5', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-400', label: 'Ultra' },
};

function getTier(price, planName) {
  if (price == null || price === 0) {
    return planName && /byok/i.test(planName) ? 'budget' : 'free';
  }
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

function PlanCard({ plan, expanded, onToggle }) {
  const price = plan.price_monthly ?? 0;
  const tier = getTier(price, plan.plan_name);
  const tc = TIER_COLORS[tier];
  const models = Array.isArray(plan.models_included) ? plan.models_included : [];
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
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                  {plan.overage_model === 'pay-per-use' ? 'Pay-as-you-go overage' : plan.overage_model}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white">{plan.tool_name}</h3>
            <p className="text-xs text-gray-500">{plan.plan_name} &middot; {plan.vendor}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className={`text-2xl font-extrabold ${price === 0 ? 'text-green-400' : 'text-white'}`}>
              {formatSubPrice(price, plan.plan_name)}
            </p>
            {plan.price_yearly && (
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

        {/* Models */}
        <div className="flex flex-wrap gap-1 mb-3">
          {models.slice(0, 8).map(m => (
            <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {m === 'any-via-api' ? 'Any (BYOK)' : m}
            </span>
          ))}
          {models.length > 8 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">+{models.length - 8}</span>
          )}
        </div>

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
                <p className="text-xs text-yellow-400/80 mb-1">{plan.overage_rate_description}</p>
              )}
              {plan.usage_notes && (
                <p className="text-xs text-gray-400 leading-relaxed">{plan.usage_notes}</p>
              )}
            </div>
          )}

          {/* Tool description */}
          {plan.tool_description && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">About</h4>
              <p className="text-xs text-gray-400">{plan.tool_description}</p>
            </div>
          )}

          {/* Community reviews */}
          {reviews.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Community Reviews
              </h4>
              {reviews.map((r, i) => (
                <div key={i} className="flex gap-3 text-[11px] mb-1">
                  <span className="text-gray-500 uppercase w-16 shrink-0">{r.source}</span>
                  <div className="flex-1">
                    <span className={`font-medium ${r.satisfaction >= 70 ? 'text-green-400' : r.satisfaction >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {r.satisfaction}%
                    </span>
                    <span className="text-gray-600 ml-1">({r.review_count} reviews)</span>
                    {r.common_praises && (
                      <span className="text-green-400/60 ml-2">{r.common_praises}</span>
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

export default function PlansPage() {
  useEffect(() => { setPageTitle('Plan Comparison'); }, []);
  const { data, isLoading } = useToolPlans();
  const [sort, setSort] = useState('price-asc');
  const [tierFilter, setTierFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const plans = useMemo(() => {
    let items = data?.plans || [];

    // Filter by tier
    if (tierFilter) {
      items = items.filter(p => getTier(p.price_monthly ?? 0, p.plan_name) === tierFilter);
    }

    // Sort
    items = [...items].sort((a, b) => {
      const pa = a.price_monthly ?? 0;
      const pb = b.price_monthly ?? 0;
      const ma = Array.isArray(a.models_included) ? a.models_included.length : 0;
      const mb = Array.isArray(b.models_included) ? b.models_included.length : 0;

      switch (sort) {
        case 'price-asc': return pa - pb;
        case 'price-desc': return pb - pa;
        case 'value': return (pb > 0 ? mb / pb : mb * 100) - (pa > 0 ? ma / pa : ma * 100);
        case 'models': return mb - ma;
        default: return pa - pb;
      }
    });

    return items;
  }, [data, sort, tierFilter]);

  // Summary stats
  const allPlans = data?.plans || [];
  const freePlans = allPlans.filter(p => (p.price_monthly ?? 0) === 0).length;
  const avgPrice = allPlans.length
    ? Math.round(allPlans.filter(p => p.price_monthly > 0).reduce((s, p) => s + p.price_monthly, 0) / allPlans.filter(p => p.price_monthly > 0).length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-400" />
          Coding Subscription Plans
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Compare every AI coding subscription — pricing, models, usage limits, overage costs, and real developer reviews
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-lg font-bold text-white">{allPlans.length}</p>
          <p className="text-[10px] text-gray-500 uppercase">Total Plans</p>
        </div>
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-center">
          <p className="text-lg font-bold text-green-400">{freePlans}</p>
          <p className="text-[10px] text-gray-500 uppercase">Free / BYOK</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-lg font-bold text-blue-400">${avgPrice}</p>
          <p className="text-[10px] text-gray-500 uppercase">Avg Paid Plan</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 text-center">
          <p className="text-lg font-bold text-purple-400">{new Set(allPlans.map(p => p.tool_slug)).size}</p>
          <p className="text-[10px] text-gray-500 uppercase">Tools</p>
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
    </div>
  );
}
