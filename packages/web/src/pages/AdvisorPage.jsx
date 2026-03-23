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
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
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

const COMPONENT_KEYS = [
  { key: 'swe_bench_component', label: 'SWE-Bench' },
  { key: 'nuance_component', label: 'Nuance' },
  { key: 'livecodebench_component', label: 'LiveCodeBench' },
  { key: 'arena_component', label: 'Arena' },
  { key: 'tau_component', label: 'TAU' },
  { key: 'gpqa_component', label: 'GPQA' },
  { key: 'success_rate_component', label: 'Success Rate' },
  { key: 'community_adjustment', label: 'Community Adj.' },
];

function ComponentBreakdown({ model }) {
  return (
    <tr>
      <td colSpan={3} className="px-4 py-3 bg-gray-900/80">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COMPONENT_KEYS.map(({ key, label }) => {
            const val = model[key];
            return (
              <div key={key} className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
                <span className="text-xs text-gray-300 font-medium">
                  {val != null ? Number(val).toFixed(2) : '--'}
                </span>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

// ── Section 1: Composite Score Leaderboard ──────────────────────────────

function ScoreLeaderboard({ scores }) {
  const [expandedModel, setExpandedModel] = useState(null);

  const sorted = useMemo(
    () => [...scores].sort((a, b) => b.composite_score - a.composite_score),
    [scores]
  );

  const chartData = useMemo(() => sorted.slice(0, 20), [sorted]);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-1">
        <Brain className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">AllThingsAI Score Leaderboard</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Composite score combining SWE-Bench, nuance understanding, coding benchmarks, arena ratings, and community signals.
      </p>

      {/* Bar Chart */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 mb-4">
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 34)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
            <YAxis
              dataKey="model_name"
              type="category"
              width={160}
              tick={{ fill: '#d1d5db', fontSize: 11 }}
            />
            <Tooltip content={<CompositeTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
            <Bar dataKey="composite_score" radius={[0, 4, 4, 0]} barSize={22}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={compositeBarColor(entry.composite_score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expandable Breakdown Table */}
      <div className="rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900 text-gray-500 uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">Model</th>
              <th className="text-left px-4 py-3 font-medium">Vendor</th>
              <th className="text-right px-4 py-3 font-medium">Composite Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => {
              const isExpanded = expandedModel === m.model_slug;
              return (
                <Fragment key={m.model_slug}>
                  <tr
                    className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedModel(isExpanded ? null : m.model_slug)}
                  >
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
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${compositeBadgeBg(
                          m.composite_score
                        )}`}
                      >
                        {Number(m.composite_score).toFixed(1)}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && <ComponentBreakdown model={m} />}
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
        <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 32)}>
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
                <Cell key={i} fill={compositeBarColor(entry.composite_score ?? 70)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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

              <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0" />

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

// ── Main Page Component ─────────────────────────────────────────────────

export default function AdvisorPage() {
  const [compositeScores, setCompositeScores] = useState(null);
  const [taskProfiles, setTaskProfiles] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskMatrix, setTaskMatrix] = useState(null);
  const [taskRecommendation, setTaskRecommendation] = useState(null);
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
    async function loadScores() {
      try {
        const res = await api.getCompositeScores();
        setCompositeScores(Array.isArray(res) ? res : res.scores ?? res.data ?? []);
      } catch (err) {
        setErrorScores(err.message);
      } finally {
        setLoadingScores(false);
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

    loadScores();
    loadTasks();
    loadSubs();
  }, []);

  // Load task-specific data when selection changes
  useEffect(() => {
    if (!selectedTask) {
      setTaskMatrix(null);
      setTaskRecommendation(null);
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
    }

    loadTaskData();
  }, [selectedTask]);

  const matrixModels = taskMatrix?.models ?? [];
  const recommendations = taskRecommendation?.recommendations ?? [];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Task Intelligence Advisor</h1>
        <p className="text-sm text-gray-500">What model should you use — and where?</p>
      </div>

      {/* Section 1: Composite Score Leaderboard */}
      {loadingScores ? (
        <div className="flex items-center justify-center h-48 mb-10">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : errorScores ? (
        <div className="text-center py-12 mb-10 rounded-xl border border-gray-800 border-dashed">
          <p className="text-sm text-red-400">Failed to load scores: {errorScores}</p>
        </div>
      ) : compositeScores && compositeScores.length > 0 ? (
        <ScoreLeaderboard scores={compositeScores} />
      ) : (
        <div className="text-center py-12 mb-10 rounded-xl border border-gray-800 border-dashed">
          <Brain className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No composite score data available yet.</p>
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
          <Code className="w-8 h-8 text-gray-600 mx-auto mb-2" />
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
              {/* 3a: Recommendation Cards */}
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
