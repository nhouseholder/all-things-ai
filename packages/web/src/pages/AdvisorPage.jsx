import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Loader2,
  Bug,
  Code,
  Layout,
  Wrench,
  FolderSync,
  Eye,
  BookOpen,
  Trophy,
  TrendingDown,
  Coins,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import ChartContainer from '../components/ChartContainer.jsx';
import { quartileColor } from '../lib/chart-utils.js';
import { api } from '../lib/api.js';

// ── Constants & Helpers ─────────────────────────────────────────────────

const TASK_ICONS = {
  debugging: Bug,
  implementation: Code,
  scaffolding: Layout,
  'quick-fix': Wrench,
  refactor: FolderSync,
  review: Eye,
  learning: BookOpen,
};

function getTaskIcon(slug) {
  return TASK_ICONS[slug] || Code;
}

function compositeBarColor(score) {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#3b82f6';
  if (score >= 55) return '#eab308';
  return '#f97316';
}

function compositeTextColor(score) {
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 55) return 'text-yellow-400';
  return 'text-orange-400';
}

function compositeBadgeBg(score) {
  if (score >= 85) return 'bg-green-500/20 text-green-400';
  if (score >= 70) return 'bg-blue-500/20 text-blue-400';
  if (score >= 55) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-orange-500/20 text-orange-400';
}

function steeringColor(level) {
  if (!level) return 'bg-gray-700 text-gray-400';
  const l = level.toLowerCase();
  if (l === 'low') return 'bg-green-500/20 text-green-400';
  if (l === 'medium') return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

function costColor(cost) {
  if (cost == null) return 'text-gray-400';
  if (cost <= 0.1) return 'text-green-400';
  if (cost <= 0.3) return 'text-emerald-400';
  if (cost <= 0.6) return 'text-yellow-400';
  return 'text-orange-400';
}

function formatCost(val) {
  if (val == null) return '--';
  return `$${Number(val).toFixed(2)}`;
}

function formatMinutes(val) {
  if (val == null) return '--';
  return `${Math.round(val)}m`;
}

function ComplexityDots({ level }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= level ? 'bg-blue-400' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}

// ── Score Leaderboard Tooltip ───────────────────────────────────────────

function CompositeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-medium">{d.model_name}</p>
      <p className="text-gray-400">
        Composite Score: <span className="text-white font-bold">{Number(d.composite_score).toFixed(1)}</span>
      </p>
      {d.vendor && <p className="text-gray-500">{d.vendor}</p>}
    </div>
  );
}

// ── Time Savings Tooltip ────────────────────────────────────────────────

function TimeSavingsTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const timeValue = ((d.minutes || 0) / 60) * 75;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-medium">{d.model_name}</p>
      <p className="text-gray-400">Time: {Math.round(d.minutes)}m</p>
      <p className="text-gray-400">Time Value: {formatCost(timeValue)} (at $75/hr)</p>
    </div>
  );
}

// ── Component Breakdown Table ───────────────────────────────────────────

const COMPONENT_GROUPS = [
  {
    label: 'Coding',
    color: 'blue',
    items: [
      { key: 'swe_bench_component', label: 'SWE-Bench', desc: 'Real-world bug fixes' },
      { key: 'livecodebench_component', label: 'LiveCode', desc: 'Live coding challenges' },
    ],
  },
  {
    label: 'Reasoning',
    color: 'purple',
    items: [
      { key: 'gpqa_component', label: 'GPQA', desc: 'Graduate-level Q&A' },
      { key: 'tau_component', label: 'TAU', desc: 'Agentic task completion' },
    ],
  },
  {
    label: 'Quality',
    color: 'cyan',
    items: [
      { key: 'nuance_component', label: 'Nuance', desc: 'Human-like understanding' },
      { key: 'arena_component', label: 'Arena ELO', desc: 'Human preference votes' },
    ],
  },
  {
    label: 'Real-World',
    color: 'emerald',
    items: [
      { key: 'success_rate_component', label: 'Success Rate', desc: 'First-attempt completions' },
    ],
  },
];

const GROUP_COLORS = {
  blue: { bar: 'bg-blue-500', text: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  purple: { bar: 'bg-purple-500', text: 'text-purple-400', badge: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  cyan: { bar: 'bg-cyan-500', text: 'text-cyan-400', badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
  emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
};

function ScoreBar({ value, color }) {
  const pct = value != null ? Math.min(100, Math.max(0, value)) : null;
  const barColor = color || 'bg-blue-500';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        {pct != null ? (
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        ) : (
          <div className="h-full w-full bg-gray-700/40 rounded-full" />
        )}
      </div>
      <span className="text-[10px] font-mono text-gray-400 w-8 text-right tabular-nums">
        {pct != null ? `${pct.toFixed(0)}` : '—'}
      </span>
    </div>
  );
}

function ComponentBreakdown({ model }) {
  const communityAdj = model.community_adjustment;
  const hasCommunity = communityAdj != null && communityAdj !== 0;

  return (
    <tr>
      <td colSpan={6} className="bg-gray-950/60 border-t border-gray-800/60">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Score Breakdown</span>
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-[10px] text-gray-500">out of 100</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPONENT_GROUPS.map(({ label, color, items }) => {
              const c = GROUP_COLORS[color];
              return (
                <div key={label} className={`rounded-lg border ${c.badge.split(' ').slice(0, 2).join(' ')} bg-gray-900/40 p-3`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2.5 ${c.text}`}>{label}</p>
                  <div className="space-y-2.5">
                    {items.map(({ key, label: itemLabel, desc }) => {
                      const val = model[key];
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-gray-300 font-medium">{itemLabel}</span>
                          </div>
                          <p className="text-[9px] text-gray-500 mb-0.5">{desc}</p>
                          <ScoreBar value={val} color={c.bar} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Community adjustment pill */}
          {hasCommunity && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Community signal:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                communityAdj > 0
                  ? 'bg-green-500/10 border-green-500/25 text-green-400'
                  : 'bg-red-500/10 border-red-500/25 text-red-400'
              }`}>
                {communityAdj > 0 ? '+' : ''}{Number(communityAdj).toFixed(2)} pts
              </span>
              <span className="text-[10px] text-gray-700">
                {model.community_reviews ? `from ${model.community_reviews.toLocaleString()} reviews` : 'from community'}
              </span>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Pricing Dropdown (per-model) ─────────────────────────────────────────

const TOOL_TIER = (price, planName) => {
  if (price == null) return { label: 'BYOK', cls: 'bg-purple-500/10 border-purple-500/20 text-purple-400' };
  if (price === 0) {
    if (planName && /byok/i.test(planName)) return { label: 'BYOK', cls: 'bg-purple-500/10 border-purple-500/20 text-purple-400' };
    return { label: 'Free', cls: 'bg-green-500/10 border-green-500/20 text-green-400' };
  }
  if (price <= 10) return { label: `$${price}/mo`, cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' };
  if (price <= 30) return { label: `$${price}/mo`, cls: 'bg-blue-500/10 border-blue-500/20 text-blue-400' };
  return { label: `$${price}/mo`, cls: 'bg-orange-500/10 border-orange-500/20 text-orange-400' };
};

const OVERAGE_BADGE = {
  'none':        { label: 'BYOK / No overage', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'throttled':   { label: 'Throttled (no extra charge)', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'stopped':     { label: 'Stops at limit', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'pay-per-use': { label: 'Pay-as-you-go overage', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  'auto-topup':  { label: 'Auto top-up', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
};

function OverageInfo({ plan }) {
  const { overage_model, overage_rate_description, fallback_behavior, usage_notes, included_requests, model_cost_notes } = plan;
  if (!overage_model && !model_cost_notes) return null;
  const badge = overage_model ? OVERAGE_BADGE[overage_model] : null;
  return (
    <div className="mt-2 pt-2 border-t border-gray-800/60 space-y-1.5">
      {model_cost_notes && (
        <p className="text-[9px] text-cyan-400/80 leading-relaxed font-medium">{model_cost_notes}</p>
      )}
      {overage_model && (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {included_requests && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                {included_requests.toLocaleString()} req/mo included
              </span>
            )}
            {badge && (
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>
          {overage_rate_description && (
            <p className="text-[9px] text-gray-500 leading-relaxed">{overage_rate_description}</p>
          )}
          {fallback_behavior && overage_model === 'stopped' && (
            <p className="text-[9px] text-gray-500 italic">{fallback_behavior}</p>
          )}
          {usage_notes && (
            <p className="text-[9px] text-gray-500 leading-relaxed">{usage_notes}</p>
          )}
        </>
      )}
    </div>
  );
}

function ModelPricingDropdown({ modelSlug, availability }) {
  const [expandedPlan, setExpandedPlan] = useState(null);
  const plans = availability?.[modelSlug]?.plans || [];
  if (plans.length === 0) {
    return (
      <div className="px-5 py-3 bg-gray-950/40 border-t border-gray-800/40">
        <p className="text-[11px] text-gray-500 italic">No availability data on record.</p>
      </div>
    );
  }

  // Deduplicate by tool+plan combo, sort free first
  const seen = new Set();
  const unique = plans.filter(p => {
    const k = `${p.tool_slug}:${p.plan_name}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => (a.price_monthly ?? 9999) - (b.price_monthly ?? 9999));

  return (
    <div className="px-5 py-4 bg-gray-950/40 border-t border-gray-800/40">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Available On</span>
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-[10px] text-gray-700">{unique.length} option{unique.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {unique.map((p, i) => {
          const tier = TOOL_TIER(p.price_monthly, p.plan_name);
          const key = `${p.tool_slug}:${p.plan_name}`;
          const isExpanded = expandedPlan === key;
          const hasDetails = !!(p.overage_model || p.model_cost_notes);
          return (
            <div
              key={i}
              className={`rounded-lg bg-gray-900/60 border transition-colors px-3 py-2.5 ${
                hasDetails ? 'cursor-pointer' : ''
              } ${isExpanded ? 'border-gray-600/80' : 'border-gray-800/60 hover:border-gray-700/80'}`}
              onClick={hasDetails ? () => setExpandedPlan(isExpanded ? null : key) : undefined}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-semibold truncate">{p.tool_name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{p.plan_name}</p>
                  {p.credits_per_request != null && (
                    <p className="text-[9px] text-cyan-500/70 mt-0.5">{p.credits_per_request} credits/req</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.cls}`}>
                    {tier.label}
                  </span>
                  {hasDetails && (
                    <span className="text-gray-500 text-[9px]">{isExpanded ? '▲' : '▼'}</span>
                  )}
                </div>
              </div>
              {isExpanded && <OverageInfo plan={p} />}
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-gray-700 mt-2">Click any plan card to see overage &amp; usage limit details.</p>
    </div>
  );
}

// ── Section 1: Dual Ranking Leaderboard ─────────────────────────────────

function DualLeaderboard({ rankings, availability }) {
  const [activeTab, setActiveTab] = useState('overall');
  const [expandedModel, setExpandedModel] = useState(null);

  const bestOverall = rankings?.best_overall || [];
  const bangForBuck = rankings?.bang_for_buck || [];

  const data = activeTab === 'overall' ? bestOverall : bangForBuck;
  const chartData = useMemo(() => data.slice(0, 15), [data]);
  const chartKey = activeTab === 'overall' ? 'composite_score' : 'value_score';

  // Build availability lookup by slug
  const availMap = useMemo(() => {
    if (!availability) return {};
    const map = {};
    for (const m of availability) map[m.model_slug] = m;
    return map;
  }, [availability]);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Model Rankings</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Click any model row to see where it's available and at what price.
      </p>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-4 bg-gray-900 rounded-lg p-1 w-fit">
        <button
          onClick={() => { setActiveTab('overall'); setExpandedModel(null); }}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'overall'
              ? 'bg-blue-500/20 text-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Trophy className="w-3 h-3 inline mr-1.5" />
          Best Overall
        </button>
        <button
          onClick={() => { setActiveTab('value'); setExpandedModel(null); }}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'value'
              ? 'bg-green-500/20 text-green-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Coins className="w-3 h-3 inline mr-1.5" />
          Best Bang for Buck
        </button>
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 mb-4">
        <ChartContainer width="100%" height={Math.max(300, chartData.length * 34)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis
              type="number"
              domain={activeTab === 'overall' ? [0, 100] : [0, 'auto']}
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis
              dataKey="model_name"
              type="category"
              width={180}
              tick={{ fill: '#d1d5db', fontSize: 11 }}
            />
            <Tooltip content={<CompositeTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
            <Bar dataKey={chartKey} radius={[0, 4, 4, 0]} barSize={22}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={quartileColor(i, chartData.length)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Expandable Table */}
      <div className="rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900 text-gray-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium w-8">#</th>
              <th className="text-left px-4 py-3 font-medium">Model</th>
              <th className="text-left px-4 py-3 font-medium">Vendor</th>
              <th className="text-right px-4 py-3 font-medium">Score</th>
              {activeTab === 'value' && (
                <>
                  <th className="text-right px-4 py-3 font-medium">Avg Cost/Task</th>
                  <th className="text-right px-4 py-3 font-medium">Value Score</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((m, idx) => {
              const isExpanded = expandedModel === m.model_slug;
              return (
                <Fragment key={m.model_slug}>
                  <tr
                    className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedModel(isExpanded ? null : m.model_slug)}
                  >
                    <td className="px-4 py-2.5 text-gray-500 font-mono">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="text-white font-medium">{m.model_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{m.vendor}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${compositeBadgeBg(m.composite_score)}`}>
                        {Number(m.composite_score).toFixed(1)}
                      </span>
                    </td>
                    {activeTab === 'value' && (
                      <>
                        <td className="px-4 py-2.5 text-right text-gray-300 font-mono">
                          {m.avg_total_cost != null ? `$${Number(m.avg_total_cost).toFixed(2)}` : '--'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="text-green-400 font-bold font-mono">
                            {m.value_score != null ? Number(m.value_score).toFixed(1) : '--'}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                  {isExpanded && (
                    <>
                      <ComponentBreakdown model={m} />
                      <tr>
                        <td colSpan={activeTab === 'value' ? 6 : 4}>
                          <ModelPricingDropdown modelSlug={m.model_slug} availability={availMap} />
                        </td>
                      </tr>
                    </>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Section 2: Task Selector ────────────────────────────────────────────

function TaskSelector({ tasks, selectedTask, onSelect }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-1">Select a Task</h2>
      <p className="text-xs text-gray-500 mb-4">Choose a development task to see model recommendations and cost analysis.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tasks.map((task) => {
          const Icon = getTaskIcon(task.slug);
          const isSelected = selectedTask === task.slug;
          return (
            <button
              key={task.id}
              onClick={() => onSelect(task.slug)}
              className={`text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30'
                  : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-blue-500/20' : 'bg-gray-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                    {task.name}
                  </p>
                  <ComplexityDots level={task.complexity} />
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Section 3a: Recommendation Cards ────────────────────────────────────

const TIER_CONFIG = {
  best_overall: {
    label: 'Best Overall',
    icon: Trophy,
    border: 'border-green-500/40',
    bg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    badgeBg: 'bg-green-500/20 text-green-400',
  },
  best_value: {
    label: 'Best Value',
    icon: TrendingDown,
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/20 text-blue-400',
  },
  budget: {
    label: 'Budget Pick',
    icon: Coins,
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/20 text-orange-400',
  },
};

function RecommendationCards({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Top Recommendations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          const tier = TIER_CONFIG[rec.tier] || TIER_CONFIG.best_overall;
          const TierIcon = tier.icon;
          const m = rec.metrics || {};
          const t = rec.tool || {};

          return (
            <div
              key={rec.tier}
              className={`rounded-xl border ${tier.border} ${tier.bg} p-5`}
            >
              <div className="flex items-center gap-2 mb-3">
                <TierIcon className={`w-5 h-5 ${tier.iconColor}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${tier.iconColor}`}>
                  {tier.label}
                </span>
              </div>

              <p className="text-white font-semibold text-lg mb-1">{rec.model?.name || rec.model_name || 'Unknown'}</p>

              {m.composite_score != null && (
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-3 ${tier.badgeBg}`}>
                  Score: {Number(m.composite_score).toFixed(1)}
                </span>
              )}

              <div className="space-y-1.5 text-xs mb-3">
                {m.cost_per_task != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cost/Task</span>
                    <span className="text-white font-medium">{formatCost(m.cost_per_task)}</span>
                  </div>
                )}
                {m.avg_minutes != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Time</span>
                    <span className="text-white font-medium">{formatMinutes(m.avg_minutes)}</span>
                  </div>
                )}
                {m.total_effective_cost != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Effective Cost</span>
                    <span className="text-white font-bold">{formatCost(m.total_effective_cost)}</span>
                  </div>
                )}
                {m.steering_effort && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Steering</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${steeringColor(m.steering_effort)}`}>
                      {m.steering_effort}
                    </span>
                  </div>
                )}
              </div>

              {(t.name || t.tool_name) && (
                <div className="flex items-center gap-2 text-xs bg-black/20 rounded-lg px-3 py-2 mb-3">
                  <Wrench className="w-3 h-3 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-300">
                    {t.name || t.tool_name}
                    {t.plan_name && ` / ${t.plan_name}`}
                    {t.price != null && ` — ${formatCost(t.price)}/mo`}
                  </span>
                </div>
              )}

              {rec.reasoning && (
                <p className="text-[11px] text-gray-500 leading-relaxed">{rec.reasoning}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section 3b: Cost Per Task Table ─────────────────────────────────────

function CostTable({ matrixModels, selectedTask, subscriptions }) {
  const [sortKey, setSortKey] = useState('total_cost');
  const [sortDir, setSortDir] = useState('asc');

  const subToolSlugs = useMemo(() => {
    if (!subscriptions) return new Set();
    return new Set(subscriptions.map((s) => s.tool_slug || s.slug || ''));
  }, [subscriptions]);

  const rows = useMemo(() => {
    if (!matrixModels) return [];
    return matrixModels
      .map((m) => {
        const est = m.estimates?.[selectedTask] || {};
        const costPerTask = est.cost_per_task ?? null;
        const avgMinutes = est.avg_minutes_to_complete ?? est.avg_minutes ?? null;
        const timeValue = avgMinutes != null ? (avgMinutes / 60) * 75 : null;
        const totalCost =
          costPerTask != null && timeValue != null ? costPerTask + timeValue : costPerTask;
        return {
          model_name: m.model_name,
          vendor: m.vendor,
          composite_score: m.composite_score,
          first_attempt_pct: est.first_attempt_success_pct ?? est.first_attempt_pct ?? null,
          avg_messages: est.avg_messages ?? null,
          cost_per_task: costPerTask,
          avg_minutes: avgMinutes,
          time_value: timeValue,
          total_cost: totalCost,
          steering: est.steering_effort ?? est.steering ?? null,
          autonomy: est.autonomy_score ?? est.autonomy ?? null,
          tool_slug: est.tool_slug ?? m.tool_slug ?? null,
        };
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return sortDir === 'asc' ? av - bv : bv - av;
      });
  }, [matrixModels, selectedTask, sortKey, sortDir]);

  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey]
  );

  function SortHeader({ label, field, align = 'left' }) {
    const active = sortKey === field;
    return (
      <th
        className={`px-4 py-3 font-medium whitespace-nowrap cursor-pointer hover:text-gray-300 transition-colors ${
          align === 'right' ? 'text-right' : 'text-left'
        } ${active ? 'text-blue-400' : ''}`}
        onClick={() => handleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active &&
            (sortDir === 'asc' ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            ))}
        </span>
      </th>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Cost Per Task Comparison
      </h3>
      <div className="rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900 text-gray-500 uppercase tracking-wider">
              <SortHeader label="Model" field="model_name" />
              <SortHeader label="Score" field="composite_score" align="right" />
              <SortHeader label="First Attempt %" field="first_attempt_pct" align="right" />
              <SortHeader label="Avg Messages" field="avg_messages" align="right" />
              <SortHeader label="Cost/Task" field="cost_per_task" align="right" />
              <SortHeader label="Time" field="avg_minutes" align="right" />
              <SortHeader label="Time Value" field="time_value" align="right" />
              <SortHeader label="Total Cost" field="total_cost" align="right" />
              <SortHeader label="Steering" field="steering" align="right" />
              <SortHeader label="Autonomy" field="autonomy" align="right" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const hasSubscription = r.tool_slug && subToolSlugs.has(r.tool_slug);
              return (
                <tr
                  key={r.model_name}
                  className={`border-t border-gray-800 hover:bg-gray-900/50 transition-colors ${
                    hasSubscription ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 sticky left-0 bg-gray-950 z-10">
                    <span className="text-white font-medium">{r.model_name}</span>
                    {r.vendor && <p className="text-[10px] text-gray-500">{r.vendor}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.composite_score != null ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${compositeBadgeBg(
                          r.composite_score
                        )}`}
                      >
                        {Number(r.composite_score).toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-700">--</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.first_attempt_pct != null ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${Math.min(100, Math.max(0, r.first_attempt_pct))}%` }}
                          />
                        </div>
                        <span className="text-gray-300 font-mono">{Math.round(r.first_attempt_pct)}%</span>
                      </div>
                    ) : (
                      <span className="text-gray-700">--</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-300 font-mono">
                    {r.avg_messages != null ? Number(r.avg_messages).toFixed(1) : '--'}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-medium ${costColor(r.cost_per_task)}`}>
                    {formatCost(r.cost_per_task)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-300 font-mono">
                    {formatMinutes(r.avg_minutes)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-400 font-mono">
                    {r.time_value != null ? formatCost(r.time_value) : '--'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-white font-bold font-mono">
                      {r.total_cost != null ? formatCost(r.total_cost) : '--'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.steering ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${steeringColor(
                          r.steering
                        )}`}
                      >
                        {r.steering}
                      </span>
                    ) : (
                      <span className="text-gray-700">--</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.autonomy != null ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-10 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{ width: `${Math.min(100, Math.max(0, r.autonomy))}%` }}
                          />
                        </div>
                        <span className="text-gray-300 font-mono text-[10px]">{Math.round(r.autonomy)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-700">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No model data available for this task.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section 3c: Time Savings Chart ──────────────────────────────────────

function TimeSavingsChart({ matrixModels, selectedTask }) {
  const chartData = useMemo(() => {
    if (!matrixModels) return [];
    return matrixModels
      .map((m) => {
        const est = m.estimates?.[selectedTask] || {};
        return {
          model_name: m.model_name,
          minutes: est.avg_minutes_to_complete ?? est.avg_minutes ?? null,
          composite_score: m.composite_score,
        };
      })
      .filter((d) => d.minutes != null)
      .sort((a, b) => a.minutes - b.minutes);
  }, [matrixModels, selectedTask]);

  const avgMinutes = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce((sum, d) => sum + d.minutes, 0) / chartData.length;
  }, [chartData]);

  if (chartData.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Time to Complete (Minutes)
      </h3>
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <ChartContainer width="100%" height={Math.max(250, chartData.length * 32)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis
              dataKey="model_name"
              type="category"
              width={160}
              tick={{ fill: '#d1d5db', fontSize: 11 }}
            />
            <Tooltip content={<TimeSavingsTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
            <ReferenceLine x={avgMinutes} stroke="#6b7280" strokeDasharray="4 4" label={{ value: 'Avg', fill: '#6b7280', fontSize: 10 }} />
            <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={quartileColor(i, chartData.length)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}

// ── Section 3d: Where to Use Panel ──────────────────────────────────────

function WhereToUsePanel({ recommendations, subscriptions }) {
  if (!recommendations || recommendations.length === 0) return null;

  const subToolNames = new Set(
    (subscriptions || []).map((s) => (s.tool_name || s.name || '').toLowerCase())
  );

  const top3 = recommendations.slice(0, 3);

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Where to Use
      </h3>
      <div className="space-y-3">
        {top3.map((rec) => {
          const t = rec.tool || {};
          const toolName = t.name || t.tool_name || 'Unknown Tool';
          const hasIt = subToolNames.has(toolName.toLowerCase());

          return (
            <div
              key={rec.tier}
              className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-4"
            >
              {/* Model Card */}
              <div className="flex-shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center min-w-[140px]">
                <p className="text-sm font-semibold text-white">{rec.model?.name || rec.model_name || 'Unknown'}</p>
                {rec.metrics?.composite_score != null && (
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${compositeBadgeBg(
                      rec.metrics.composite_score
                    )}`}
                  >
                    {Number(rec.metrics.composite_score).toFixed(1)}
                  </span>
                )}
              </div>

              <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />

              {/* Tool Card */}
              <div className="flex-shrink-0 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-center min-w-[160px]">
                <p className="text-sm font-medium text-white">{toolName}</p>
                {t.plan_name && <p className="text-[10px] text-gray-400">{t.plan_name}</p>}
                {t.price != null && (
                  <p className="text-[10px] text-gray-500">{formatCost(t.price)}/mo</p>
                )}
              </div>

              {hasIt && (
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-[10px] text-green-400 font-medium">You have this</span>
                </div>
              )}

              <div className="flex-1 min-w-0 ml-3">
                <p className="text-xs text-gray-400">
                  Use <span className="text-white font-medium">{rec.model?.name || rec.model_name || 'Unknown'}</span> on{' '}
                  <span className="text-white font-medium">{toolName}</span>
                  {t.plan_name && (
                    <>
                      {' '}
                      <span className="text-gray-500">{t.plan_name}</span>
                    </>
                  )}
                  {t.price != null && <> at {formatCost(t.price)}/mo</>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fragment import (needed for expandable rows) ────────────────────────

import { Fragment } from 'react';

// ── Section: Task-Specific Sub-Rankings ──────────────────────────────────

function TaskSubRankings({ taskRankings }) {
  if (!taskRankings) return null;
  const { by_quality = [], by_value = [] } = taskRankings;
  if (by_quality.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Task-Specific Model Rankings
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By Quality */}
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-green-500/10 border-b border-gray-800 px-4 py-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Best for This Task</span>
            </div>
          </div>
          <div className="divide-y divide-gray-800">
            {by_quality.slice(0, 8).map((m, i) => (
              <div key={m.model_slug} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 font-mono w-4">{i + 1}</span>
                  <div>
                    <p className="text-xs text-white font-medium">{m.model_name}</p>
                    <p className="text-[10px] text-gray-500">{m.vendor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-400 font-bold">{Math.round((m.first_attempt_success_rate || 0) * 100)}%</p>
                  <p className="text-[10px] text-gray-500">1st attempt</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Value */}
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <div className="bg-blue-500/10 border-b border-gray-800 px-4 py-2">
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Best Value for This Task</span>
            </div>
          </div>
          <div className="divide-y divide-gray-800">
            {by_value.slice(0, 8).map((m, i) => {
              const totalCost = (m.cost_per_task_estimate || 0) + (m.time_value_per_task || 0);
              return (
                <div key={m.model_slug} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-mono w-4">{i + 1}</span>
                    <div>
                      <p className="text-xs text-white font-medium">{m.model_name}</p>
                      <p className="text-[10px] text-gray-500">{m.vendor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-400 font-bold">${totalCost.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">total cost</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────────

export default function AdvisorPage() {
  const [rankings, setRankings] = useState(null);
  const [modelAvailability, setModelAvailability] = useState(null);
  const [taskProfiles, setTaskProfiles] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskMatrix, setTaskMatrix] = useState(null);
  const [taskRecommendation, setTaskRecommendation] = useState(null);
  const [taskRankings, setTaskRankings] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);

  const [loadingScores, setLoadingScores] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);

  const [errorScores, setErrorScores] = useState(null);
  const [errorTasks, setErrorTasks] = useState(null);
  const [errorMatrix, setErrorMatrix] = useState(null);
  const [errorRec, setErrorRec] = useState(null);

  // Load initial data
  useEffect(() => {
    async function loadRankings() {
      try {
        const res = await api.getRankings();
        setRankings(res);
      } catch (err) {
        setErrorScores(err.message);
      } finally {
        setLoadingScores(false);
      }
    }

    async function loadAvailability() {
      try {
        const res = await api.getModelAvailability();
        setModelAvailability(Array.isArray(res) ? res : []);
      } catch {
        // Non-critical
      }
    }

    async function loadTasks() {
      try {
        const res = await api.getTaskProfiles();
        setTaskProfiles(Array.isArray(res) ? res : res.tasks ?? res.data ?? []);
      } catch (err) {
        setErrorTasks(err.message);
      } finally {
        setLoadingTasks(false);
      }
    }

    async function loadSubs() {
      try {
        const res = await api.getSubscriptions();
        setSubscriptions(Array.isArray(res) ? res : res.subscriptions ?? []);
      } catch {
        // Non-critical — silently fail
      }
    }

    loadRankings();
    loadAvailability();
    loadTasks();
    loadSubs();
  }, []);

  // Load task-specific data when selection changes
  useEffect(() => {
    if (!selectedTask) {
      setTaskMatrix(null);
      setTaskRecommendation(null);
      setTaskRankings(null);
      return;
    }

    async function loadTaskData() {
      setLoadingMatrix(true);
      setLoadingRec(true);
      setErrorMatrix(null);
      setErrorRec(null);

      try {
        const res = await api.getTaskMatrix(selectedTask);
        setTaskMatrix(res);
      } catch (err) {
        setErrorMatrix(err.message);
      } finally {
        setLoadingMatrix(false);
      }

      try {
        const res = await api.getTaskRecommendation(selectedTask);
        setTaskRecommendation(res);
      } catch (err) {
        setErrorRec(err.message);
      } finally {
        setLoadingRec(false);
      }

      try {
        const res = await api.getTaskRankings(selectedTask);
        setTaskRankings(res);
      } catch {
        // Non-critical
      }
    }

    loadTaskData();
  }, [selectedTask]);

  const matrixModels = taskMatrix?.models ?? [];
  const recommendations = taskRecommendation?.recommendations ?? [];

  return (
    <div>
      {/* Section 1: Dual Ranking Leaderboard */}
      {loadingScores ? (
        <div className="flex items-center justify-center h-48 mb-10">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : errorScores ? (
        <div className="text-center py-12 mb-10 rounded-xl border border-gray-800 border-dashed">
          <p className="text-sm text-red-400">Failed to load scores: {errorScores}</p>
        </div>
      ) : rankings ? (
        <DualLeaderboard rankings={rankings} availability={modelAvailability} />
      ) : (
        <div className="text-center py-12 mb-10 rounded-xl border border-gray-800 border-dashed">
          <Brain className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No ranking data available yet.</p>
        </div>
      )}

      {/* Section 2: Task Selector */}
      {loadingTasks ? (
        <div className="flex items-center justify-center h-32 mb-10">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : errorTasks ? (
        <div className="text-center py-12 mb-10 rounded-xl border border-gray-800 border-dashed">
          <p className="text-sm text-red-400">Failed to load tasks: {errorTasks}</p>
        </div>
      ) : taskProfiles && taskProfiles.length > 0 ? (
        <TaskSelector tasks={taskProfiles} selectedTask={selectedTask} onSelect={setSelectedTask} />
      ) : (
        <div className="text-center py-12 mb-10 rounded-xl border border-gray-800 border-dashed">
          <Code className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No task profiles available yet.</p>
        </div>
      )}

      {/* Section 3: Task Analysis (only when task is selected) */}
      {selectedTask && (
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-xs text-gray-500 uppercase tracking-wider px-3">
              Task Analysis:{' '}
              {taskProfiles?.find((t) => t.slug === selectedTask)?.name || selectedTask}
            </span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {(loadingMatrix || loadingRec) ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* 3a: Task Sub-Rankings */}
              <TaskSubRankings taskRankings={taskRankings} />

              {/* 3b: Recommendation Cards */}
              {errorRec ? (
                <div className="text-center py-8 mb-8 rounded-xl border border-gray-800 border-dashed">
                  <p className="text-sm text-red-400">Failed to load recommendations: {errorRec}</p>
                </div>
              ) : (
                <RecommendationCards recommendations={recommendations} />
              )}

              {/* 3b: Cost Per Task Table */}
              {errorMatrix ? (
                <div className="text-center py-8 mb-8 rounded-xl border border-gray-800 border-dashed">
                  <p className="text-sm text-red-400">Failed to load task matrix: {errorMatrix}</p>
                </div>
              ) : (
                <CostTable
                  matrixModels={matrixModels}
                  selectedTask={selectedTask}
                  subscriptions={subscriptions}
                />
              )}

              {/* 3c: Time Savings Chart */}
              {!errorMatrix && (
                <TimeSavingsChart matrixModels={matrixModels} selectedTask={selectedTask} />
              )}

              {/* 3d: Where to Use Panel */}
              {!errorRec && (
                <WhereToUsePanel
                  recommendations={recommendations}
                  subscriptions={subscriptions}
                />
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
