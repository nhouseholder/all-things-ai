import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, ChevronDown, ChevronUp, Crown, DollarSign,
  Flame, Loader2, Scale, Search, Sparkles, X, Zap,
} from 'lucide-react';
import { useToolPlans } from '../lib/hooks.js';
import { setPageTitle } from '../lib/format.js';

const USAGE_PROFILES = [
  { id: 'light', label: 'Light', reqs: 100, desc: '~100 requests/month', icon: '💡' },
  { id: 'moderate', label: 'Moderate', reqs: 500, desc: '~500 requests/month', icon: '⚡' },
  { id: 'heavy', label: 'Heavy', reqs: 1500, desc: '~1,500 requests/month', icon: '🔥' },
  { id: 'team', label: 'Team', reqs: 5000, desc: '~5,000 requests/month', icon: '🏢' },
];

function tierColor(price) {
  if (price == null) return { text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' };
  if (price === 0) return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
  if (price <= 20) return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
  if (price <= 50) return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
  if (price <= 150) return { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' };
  return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
}

function formatPrice(v) {
  if (v == null) return '—';
  if (v === 0) return 'Free';
  return `$${Number(v).toFixed(0)}`;
}

function resolvedPrice(plan) {
  // Prefer real monthly price, fall back to backend-computed anchor (reference price)
  return plan?.price_monthly ?? plan?.price_anchor ?? null;
}

export default function PlanComparePage() {
  useEffect(() => { setPageTitle('Compare Plans'); }, []);
  const { data: plansData, isLoading } = useToolPlans();
  const allPlans = useMemo(() => {
    const plans = plansData?.plans || [];
    return Array.isArray(plans) ? plans.filter((plan) => plan.is_current) : [];
  }, [plansData]);

  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [usageProfile, setUsageProfile] = useState('moderate');
  const [showQuiz, setShowQuiz] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState(false);

  const profile = USAGE_PROFILES.find(p => p.id === usageProfile);

  function addPlan(planId) {
    if (selected.length < 6 && !selected.includes(planId)) {
      setSelected([...selected, planId]);
    }
    setShowPicker(false);
    setSearchTerm('');
  }

  function removePlan(planId) {
    setSelected(selected.filter(id => id !== planId));
  }

  const selectedPlans = useMemo(() =>
    selected.map(id => allPlans.find(p => p.id === id)).filter(Boolean),
  [selected, allPlans]);

  const filteredPlans = useMemo(() => {
    if (!searchTerm) return allPlans;
    const q = searchTerm.toLowerCase();
    return allPlans.filter(p =>
      p.tool_name?.toLowerCase().includes(q) ||
      p.plan_name?.toLowerCase().includes(q) ||
      p.vendor?.toLowerCase().includes(q)
    );
  }, [allPlans, searchTerm]);

  // Cost projection per plan based on usage profile
  const projections = useMemo(() => {
    const reqs = profile?.reqs || 500;
    return selectedPlans.map(plan => {
      const monthly = resolvedPrice(plan) ?? 0;
      const included = plan.included_requests || 0;
      const overage = Math.max(0, reqs - included);
      let overageCost = 0;

      if (overage > 0 && plan.overage_model === 'pay-per-use' && plan.overage_rate_value) {
        if (plan.overage_rate_unit === 'per-request') {
          overageCost = overage * plan.overage_rate_value;
        } else if (plan.overage_rate_unit === 'per-million-tokens') {
          // Estimate ~4000 tokens per request
          overageCost = (overage * 4000 / 1_000_000) * plan.overage_rate_value;
        }
      }

      const total = monthly + overageCost;
      const costPerReq = reqs > 0 ? total / Math.min(reqs, included || reqs) : 0;

      return {
        planId: plan.id,
        monthly,
        included,
        overage,
        overageCost: Number(overageCost.toFixed(2)),
        total: Number(total.toFixed(2)),
        costPerReq: Number(costPerReq.toFixed(4)),
        verdict: overage > 0 && plan.overage_model === 'throttled' ? 'throttled' :
                 overage > 0 && plan.overage_model === 'stopped' ? 'stopped' :
                 overageCost > monthly * 0.5 ? 'expensive' : 'ok',
      };
    });
  }, [selectedPlans, profile]);

  // Best plan = lowest total cost that isn't throttled/stopped
  const bestPlanId = useMemo(() => {
    const valid = projections.filter(p => p.verdict === 'ok' || p.verdict === 'expensive');
    if (!valid.length) return null;
    return valid.sort((a, b) => a.total - b.total)[0]?.planId;
  }, [projections]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">Plan Compare</h1>
        <p className="text-sm text-gray-400">
          Side-by-side plan comparison with cost projections.
          <span className="text-gray-600 text-xs ml-1">· Select up to 6 plans</span>
        </p>
      </div>

      {/* Usage Profile Selector */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-2">Your usage level:</p>
        <div className="flex flex-wrap gap-2">
          {USAGE_PROFILES.map(p => (
            <button
              key={p.id}
              onClick={() => setUsageProfile(p.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                usageProfile === p.id
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-1.5">{p.icon}</span>
              {p.label}
              <span className="text-gray-500 ml-1.5 text-[10px]">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Plan Picker */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          {selectedPlans.map(plan => {
            const tc = tierColor(resolvedPrice(plan));
            return (
              <div key={plan.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border ${tc.border}`}>
                <span className="text-xs text-white font-medium">{plan.tool_name} · {plan.plan_name}</span>
                <span className={`text-[10px] ${tc.text}`}>{plan.price_display || `${formatPrice(resolvedPrice(plan))}/mo`}</span>
                <button onClick={() => removePlan(plan.id)} className="text-gray-500 hover:text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {selected.length < 6 && (
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-600 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                + Add Plan
              </button>
              {showPicker && (
                <div className="absolute top-full left-0 mt-2 w-80 max-h-72 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
                  <div className="sticky top-0 bg-gray-900 p-2 border-b border-gray-800">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                      <input
                        autoFocus
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search plans..."
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {filteredPlans.filter(p => !selected.includes(p.id)).map(p => (
                    <button
                      key={p.id}
                      onClick={() => addPlan(p.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-white font-medium">{p.tool_name} · {p.plan_name}</p>
                          <p className="text-[10px] text-gray-500">{p.vendor}</p>
                        </div>
                        <span className={`text-xs font-medium ${tierColor(resolvedPrice(p)).text}`}>
                          {p.price_display || `${formatPrice(resolvedPrice(p))}/mo`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {selected.length < 2 && (
          <p className="text-[10px] text-gray-500 mt-2">Select 2+ plans to compare side by side</p>
        )}
      </div>

      {/* Comparison Cards */}
      {selectedPlans.length >= 2 && (
        <div className="space-y-6">
          {/* Cost Projection Summary */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(selectedPlans.length, 4)}, 1fr)` }}>
            {selectedPlans.map((plan, i) => {
              const proj = projections[i];
              const isBest = plan.id === bestPlanId;
              const tc = tierColor(resolvedPrice(plan));
              return (
                <div key={plan.id} className={`rounded-xl border ${isBest ? 'border-green-500/50 ring-1 ring-green-500/20' : 'border-gray-800'} bg-gray-900/50 p-4 relative`}>
                  {isBest && (
                    <div className="absolute -top-2.5 left-3 px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-semibold rounded-full border border-green-500/30 flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Best Value
                    </div>
                  )}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-white">{plan.tool_name}</p>
                    <p className="text-[10px] text-gray-500">{plan.plan_name}</p>
                  </div>
                  <p className={`text-2xl font-bold ${tc.text}`}>
                    ${proj.total}<span className="text-xs text-gray-500">/mo</span>
                  </p>
                  <div className="mt-2 space-y-1 text-[10px]">
                    <div className="flex justify-between text-gray-400">
                      <span>Base</span>
                      <span>${proj.monthly}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Included</span>
                      <span>{proj.included || '∞'} reqs</span>
                    </div>
                    {proj.overage > 0 && (
                      <div className={`flex justify-between ${proj.verdict === 'ok' ? 'text-gray-400' : 'text-orange-400'}`}>
                        <span>Overage ({proj.overage} reqs)</span>
                        <span>
                          {proj.verdict === 'throttled' ? 'Throttled' :
                           proj.verdict === 'stopped' ? 'Stopped' :
                           `+$${proj.overageCost}`}
                        </span>
                      </div>
                    )}
                  </div>
                  {proj.verdict === 'throttled' && (
                    <p className="mt-2 text-[10px] text-yellow-400">Speed reduced after {proj.included} requests</p>
                  )}
                  {proj.verdict === 'stopped' && (
                    <p className="mt-2 text-[10px] text-red-400">Access stops after {proj.included} requests</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feature Matrix */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
            <button
              onClick={() => setExpandedFeatures(!expandedFeatures)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                Feature Comparison
              </span>
              {expandedFeatures ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {expandedFeatures && (
              <div className="px-4 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-2 px-2 text-gray-500 font-medium w-32">Feature</th>
                        {selectedPlans.map(p => (
                          <th key={p.id} className="text-center py-2 px-2 text-white font-medium">
                            {p.tool_name}<br /><span className="text-gray-500 font-normal">{p.plan_name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      <FeatureRow label="Monthly Price" plans={selectedPlans} accessor={p => p.price_display || formatPrice(resolvedPrice(p))} />
                      <FeatureRow label="Yearly Price" plans={selectedPlans} accessor={p => p.price_yearly ? `$${(p.price_yearly / 12).toFixed(0)}/mo` : '—'} />
                      <FeatureRow label="Included Requests" plans={selectedPlans} accessor={p => p.included_requests || '∞'} />
                      <FeatureRow label="Overage Model" plans={selectedPlans} accessor={p => p.overage_model || '—'} />
                      <FeatureRow label="Models Available" plans={selectedPlans} accessor={p => {
                        const models = p.model_pricing || [];
                        return models.length > 0 ? `${models.length} models` : '—';
                      }} />
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Models Included */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Models Included
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium w-32">Model</th>
                    {selectedPlans.map(p => (
                      <th key={p.id} className="text-center py-2 px-2 text-white font-medium">{p.tool_name} {p.plan_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {(() => {
                    // Collect all models across plans
                    const modelSet = new Map();
                    for (const plan of selectedPlans) {
                      for (const m of (plan.model_pricing || [])) {
                        if (!modelSet.has(m.slug || m.name)) {
                          modelSet.set(m.slug || m.name, m.name || m.slug);
                        }
                      }
                    }
                    return [...modelSet.entries()].slice(0, 30).map(([slug, name]) => (
                      <tr key={slug}>
                        <td className="py-1.5 px-2 text-gray-400">{name}</td>
                        {selectedPlans.map(plan => {
                          const model = (plan.model_pricing || []).find(m => (m.slug || m.name) === slug);
                          return (
                            <td key={plan.id} className="py-1.5 px-2 text-center">
                              {model ? (
                                <Check className="w-3.5 h-3.5 text-green-400 mx-auto" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-gray-700 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Link to Plan Burn */}
          <div className="rounded-xl border border-gray-800 bg-gradient-to-r from-orange-500/5 to-red-500/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-white">Want deeper analysis?</p>
                  <p className="text-xs text-gray-400">Simulate how fast each plan burns through your usage with Plan Burn</p>
                </div>
              </div>
              <Link
                to="/plan-burn"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500/15 text-orange-400 text-xs font-semibold border border-orange-500/30 hover:bg-orange-500/25 transition-colors"
              >
                Plan Burn <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureRow({ label, plans, accessor }) {
  return (
    <tr>
      <td className="py-2 px-2 text-gray-500 font-medium">{label}</td>
      {plans.map(p => (
        <td key={p.id} className="py-2 px-2 text-center text-gray-300 font-medium">
          {accessor(p)}
        </td>
      ))}
    </tr>
  );
}
