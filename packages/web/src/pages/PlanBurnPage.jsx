import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Users, Zap, AlertTriangle, Check, ChevronDown, ChevronUp,
  ArrowRight, Cpu, DollarSign, Clock, Shield, TrendingUp,
} from 'lucide-react';
import { usePlanBurn } from '../lib/hooks.js';
import { setPageTitle } from '../lib/format.js';

const PERSONA_ICONS = {
  'weekend-hacker': '🎮',
  'solo-founder': '🚀',
  'freelancer': '💼',
  'full-time-engineer': '⚙️',
};

const SEVERITY_STYLES = {
  good: 'bg-green-500/10 border-green-500/30 text-green-400',
  ok: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  info: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
  warn: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  danger: 'bg-red-500/10 border-red-500/30 text-red-400',
};

function BurnBar({ used, total, exhaustionDay }) {
  if (!total) return null;
  const pct = Math.min(100, Math.round((used / total) * 100));
  const barColor = pct <= 60 ? 'bg-green-500' : pct <= 85 ? 'bg-yellow-500' : pct <= 100 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
        <span>{used.toFixed(0)} / {total} credits</span>
        <span>{pct}% used</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
        {exhaustionDay && (
          <div
            className="absolute top-0 h-full w-0.5 bg-red-400"
            style={{ left: `${Math.min(100, (exhaustionDay / 30) * 100)}%` }}
            title={`Exhausted by day ${exhaustionDay}`}
          />
        )}
      </div>
      {exhaustionDay && (
        <p className="text-[10px] text-red-400 mt-1">
          Runs out by day {exhaustionDay} of 30
        </p>
      )}
    </div>
  );
}

function PlanBurnCard({ plan, isRecommended, expanded, onToggle }) {
  const v = plan.verdict;
  const sev = SEVERITY_STYLES[v?.severity || 'info'];

  return (
    <div className={`rounded-xl border ${isRecommended ? 'border-green-500/40 ring-1 ring-green-500/20' : 'border-gray-800'} bg-gray-900/50 overflow-hidden transition-all`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isRecommended && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                  Best Fit
                </span>
              )}
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${sev}`}>
                {v?.label || 'Unknown'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{plan.tool_name}</h3>
            <p className="text-xs text-gray-500">{plan.plan_name}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-2xl font-extrabold text-white">
              ${plan.total_monthly_cost.toFixed(0)}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            {plan.overage_cost > 0 && (
              <p className="text-[10px] text-yellow-400">
                incl. ${plan.overage_cost.toFixed(2)} overage
              </p>
            )}
            {plan.price_monthly !== plan.total_monthly_cost && (
              <p className="text-[10px] text-gray-500">
                Base: ${plan.price_monthly}/mo
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <MiniStat icon={Cpu} label="Models" value={plan.models_available} color="text-purple-400" />
          <MiniStat icon={Zap} label="Daily burn" value={`${plan.daily_burn_rate} req`} color="text-yellow-400" />
          <MiniStat icon={DollarSign} label="Per request" value={`$${plan.cost_per_request.toFixed(3)}`} color="text-green-400" />
          <MiniStat
            icon={plan.overage_blocked ? AlertTriangle : Shield}
            label="Overage"
            value={plan.overage_model || 'N/A'}
            color={plan.overage_blocked ? 'text-red-400' : 'text-blue-400'}
          />
        </div>

        {/* Burn bar */}
        {plan.included_requests > 0 && (
          <BurnBar
            used={plan.total_credits_consumed}
            total={plan.included_requests}
            exhaustionDay={plan.exhaustion_day}
          />
        )}

        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-3"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less' : 'Usage breakdown'}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-800 px-4 py-3 bg-gray-900/60 space-y-3">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-gray-500 mb-1">Standard models</p>
              <p className="text-white font-medium">{plan.standard_models} models</p>
              <p className="text-[10px] text-gray-500">{plan.standard_credits.toFixed(0)} credits/mo</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Premium models</p>
              <p className="text-white font-medium">{plan.premium_models} models</p>
              <p className="text-[10px] text-gray-500">{plan.premium_credits.toFixed(0)} credits/mo</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Heavy/reasoning</p>
              <p className="text-white font-medium">{plan.heavy_models} models</p>
              <p className="text-[10px] text-gray-500">{plan.heavy_credits.toFixed(0)} credits/mo</p>
            </div>
          </div>

          {plan.overage_credits > 0 && (
            <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
              <div className="flex items-center gap-2 text-xs text-yellow-400 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {plan.overage_blocked ? 'Usage blocked after limit' : `${plan.overage_credits.toFixed(0)} credits over limit`}
                </span>
              </div>
              {plan.overage_blocked ? (
                <p className="text-[10px] text-gray-400">This plan stops working after included requests. Upgrade needed for your usage level.</p>
              ) : plan.overage_cost > 0 ? (
                <p className="text-[10px] text-gray-400">Estimated ${plan.overage_cost.toFixed(2)}/mo in overage charges.</p>
              ) : (
                <p className="text-[10px] text-gray-400">Over limit but no additional charges (throttled).</p>
              )}
            </div>
          )}

          <Link
            to="/plans"
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View full plan details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, color }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5">
        <Icon className={`w-3 h-3 ${color}`} />
        {label}
      </div>
      <p className="text-xs text-white font-medium">{value}</p>
    </div>
  );
}

function PersonaPicker({ personas, activeKey, onSelect, customValues, onCustomChange }) {
  const [showCustom, setShowCustom] = useState(activeKey === 'custom');

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">How do you code?</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {personas.map(p => (
          <button
            key={p.key}
            onClick={() => { onSelect(p.key); setShowCustom(false); }}
            className={`rounded-xl border p-3 text-left transition-all ${
              activeKey === p.key
                ? 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20'
                : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
            }`}
          >
            <div className="text-lg mb-1">{PERSONA_ICONS[p.key] || '🎯'}</div>
            <p className="text-xs font-semibold text-white">{p.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{p.monthly_requests} req/mo</p>
          </button>
        ))}
      </div>

      <button
        onClick={() => { setShowCustom(!showCustom); if (!showCustom) onSelect('custom'); }}
        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
          showCustom ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
        }`}
      >
        Custom usage pattern
      </button>

      {showCustom && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-gray-800 bg-gray-900/50">
          <div>
            <label className="text-[10px] text-gray-500 uppercase block mb-1">Monthly requests</label>
            <input
              type="number"
              min="10"
              max="5000"
              value={customValues.requests}
              onChange={e => onCustomChange({ ...customValues, requests: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase block mb-1">Premium model % (2-3x)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round(customValues.premium_pct * 100)}
              onChange={e => onCustomChange({ ...customValues, premium_pct: parseInt(e.target.value || '0', 10) / 100 })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase block mb-1">Heavy/reasoning % (5x+)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round(customValues.heavy_pct * 100)}
              onChange={e => onCustomChange({ ...customValues, heavy_pct: parseInt(e.target.value || '0', 10) / 100 })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlanBurnPage() {
  useEffect(() => { setPageTitle('Plan Burn Simulator'); }, []);

  const [persona, setPersona] = useState('solo-founder');
  const [customValues, setCustomValues] = useState({ requests: '400', premium_pct: 0.25, heavy_pct: 0.10 });
  const [expandedId, setExpandedId] = useState(null);

  const queryParams = useMemo(() => {
    if (persona === 'custom') {
      return {
        persona: 'custom',
        requests: customValues.requests,
        premium_pct: String(customValues.premium_pct),
        heavy_pct: String(customValues.heavy_pct),
      };
    }
    return { persona };
  }, [persona, customValues]);

  const { data, isLoading } = usePlanBurn(queryParams);

  const personas = data?.personas || [];
  const recommended = data?.recommended;
  const allPlans = data?.all_plans || [];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-400" />
          Plan Burn Simulator
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          See how fast each plan burns through requests based on your actual coding style.
          Pick a persona or set custom usage — we simulate the monthly spend including overage.
        </p>
      </div>

      {/* Persona picker */}
      {!isLoading && personas.length > 0 && (
        <PersonaPicker
          personas={personas}
          activeKey={persona}
          onSelect={setPersona}
          customValues={customValues}
          onCustomChange={setCustomValues}
        />
      )}

      {/* Active persona summary */}
      {data?.persona && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-0.5">Simulating</p>
              <p className="text-sm font-semibold text-white">
                {data.persona.label} — {data.persona.monthly_requests} requests/mo
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{data.persona.description}</p>
            </div>
            <div className="flex gap-4 text-xs text-gray-400">
              <div className="text-center">
                <p className="text-white font-bold">{Math.round(data.persona.model_mix.standard * 100)}%</p>
                <p className="text-[10px]">Standard</p>
              </div>
              <div className="text-center">
                <p className="text-purple-400 font-bold">{Math.round(data.persona.model_mix.premium * 100)}%</p>
                <p className="text-[10px]">Premium</p>
              </div>
              <div className="text-center">
                <p className="text-orange-400 font-bold">{Math.round(data.persona.model_mix.heavy * 100)}%</p>
                <p className="text-[10px]">Heavy</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 rounded-xl bg-gray-900/50 border border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : allPlans.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-gray-800 border-dashed">
          <Flame className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No plan data available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allPlans.map((plan, i) => (
            <PlanBurnCard
              key={plan.plan_id}
              plan={plan}
              isRecommended={recommended && plan.plan_id === recommended.plan_id}
              expanded={expandedId === plan.plan_id}
              onToggle={() => setExpandedId(expandedId === plan.plan_id ? null : plan.plan_id)}
            />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 mb-6 text-center">
        <p className="text-xs text-gray-500 mb-3">
          Burn estimates are based on plan request quotas, model multipliers (credits_per_request), and overage policies.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/plans"
            className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            View full plan details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/advisor"
            className="inline-flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Compare models <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
