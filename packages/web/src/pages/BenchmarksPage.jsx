import { useState } from 'react';
import {
  Loader2,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  DollarSign,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import ChartContainer from '../components/ChartContainer.jsx';
import { api } from '../lib/api.js';
import { useBenchmarks } from '../lib/hooks.js';
import { quartileColor } from '../lib/chart-utils.js';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'coding', label: 'Coding' },
  { value: 'debugging', label: 'Debugging' },
  { value: 'reasoning', label: 'Reasoning' },
  { value: 'nuance', label: 'Nuance' },
];

const TABS = [
  { value: 'benchmarks', label: 'Benchmarks', icon: BarChart3 },
  { value: 'pricing', label: 'Token Pricing', icon: DollarSign },
];

function scoreColor(score) {
  if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-400' };
  if (score >= 60) return { bg: 'bg-emerald-500', text: 'text-emerald-400' };
  if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-400' };
  if (score >= 20) return { bg: 'bg-orange-500', text: 'text-orange-400' };
  return { bg: 'bg-red-500', text: 'text-red-400' };
}

function bangForBuckColor(score) {
  if (score >= 10) return 'text-green-400';
  if (score >= 5) return 'text-emerald-400';
  if (score >= 2) return 'text-yellow-400';
  if (score >= 1) return 'text-orange-400';
  return 'text-red-400';
}

function bangForBuckBarColor(score) {
  if (score >= 10) return '#22c55e';
  if (score >= 5) return '#10b981';
  if (score >= 2) return '#eab308';
  if (score >= 1) return '#f97316';
  return '#ef4444';
}

function formatContextWindow(tokens) {
  if (!tokens) return '--';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(tokens % 1_000 === 0 ? 0 : 1)}K`;
  return String(tokens);
}

function formatPrice(price) {
  if (price == null) return '--';
  if (price === 0) return 'Free';
  if (price < 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function ScoreCell({ score }) {
  if (score == null) return <span className="text-gray-700">--</span>;
  const { bg, text } = scoreColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${bg}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${text}`}>{score.toFixed(1)}</span>
    </div>
  );
}

function CustomBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-medium">{data.payload.name}</p>
      <p className="text-gray-400">Score: {Number(data.value).toFixed(1)}</p>
    </div>
  );
}

function BangForBuckTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-medium">{d.name}</p>
      <p className="text-gray-400">Bang/Buck: {d.score.toFixed(2)}</p>
      <p className="text-gray-500">Avg Score: {d.avgScore.toFixed(1)} | Blended: {formatPrice(d.blendedCost)}/1M</p>
    </div>
  );
}

function ModelToolsModal({ model, onClose }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getModelAvailability();
        const match = data?.find?.(
          (m) => m.model_slug === model.slug || m.model_slug === model.model_slug
        );
        if (!cancelled) setPlans(match?.plans ?? []);
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [model.slug, model.model_slug]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Trap focus inside modal
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    return () => { previouslyFocused?.focus?.(); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${model.name ?? model.model_name} availability`}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-1">{model.name ?? model.model_name}</h3>
        <p className="text-xs text-gray-500 mb-4">Available in the following tools/plans:</p>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-gray-500">No tool/plan information available.</p>
        ) : (
          <ul className="space-y-2">
            {plans.map((p, i) => (
              <li key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{p.tool_name}</span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      if (p.price_monthly == null) return null;
                      const notes = p.model_cost_notes || '';
                      const hasByok = notes.includes('BYOK') || notes.includes('$/M') || notes.includes('/M ');
                      const hasApiCost = notes.includes('$');
                      const hasCredits = p.credits_per_request && p.credits_per_request > 0;
                      const hasModelCost = hasByok || hasApiCost || hasCredits;
                      let label, style;
                      if (p.price_monthly > 0) {
                        label = `$${p.price_monthly}/mo`;
                        style = 'bg-orange-500/10 text-orange-400';
                      } else if (!hasModelCost) {
                        label = 'Free';
                        style = 'bg-green-500/10 text-green-400';
                      } else if (hasByok) {
                        label = 'BYOK';
                        style = 'bg-yellow-500/10 text-yellow-400';
                      } else if (hasCredits) {
                        label = `${p.credits_per_request} cr/req`;
                        style = 'bg-cyan-500/10 text-cyan-400';
                      } else {
                        label = 'API costs';
                        style = 'bg-yellow-500/10 text-yellow-400';
                      }
                      return (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{p.plan_name}</p>
                {p.model_cost_notes && (
                  <p className="text-[10px] text-cyan-500/80 mt-1">{p.model_cost_notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm font-medium py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Nuance Highlight Card ──────────────────────────────────────────────
function NuanceHighlight({ models, benchmarkNames }) {
  const nuanceBenchmarks = benchmarkNames.filter(
    (n) => n.toLowerCase().includes('nuance') || n.toLowerCase().includes('chatbot arena')
  );
  if (nuanceBenchmarks.length === 0) return null;

  // Normalize ELO to 0-100 scale for fair averaging
  const normalizeNuance = (bn, score) => {
    if (bn.toLowerCase().includes('arena elo')) {
      return Math.max(0, Math.min(100, ((score - 1100) / (1520 - 1100)) * 100));
    }
    return score;
  };

  // Rank models by average nuance score (normalized)
  const ranked = models
    .map((m) => {
      const scores = nuanceBenchmarks
        .map((bn) => (m.scores?.[bn] != null ? normalizeNuance(bn, m.scores[bn]) : null))
        .filter((v) => v != null);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      return { ...m, nuanceAvg: avg };
    })
    .filter((m) => m.nuanceAvg != null)
    .sort((a, b) => b.nuanceAvg - a.nuanceAvg)
    .slice(0, 5);

  if (ranked.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
          Human Nuance Understanding — Top Models
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ranked.map((m, i) => (
          <div
            key={m.slug}
            className={`rounded-xl border p-4 ${
              i === 0
                ? 'border-purple-500/40 bg-purple-500/5'
                : 'border-gray-800 bg-gray-900/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">#{i + 1}</span>
              {i === 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  Best
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-white truncate">{m.name}</p>
            <p className="text-xs text-gray-500 mb-2">{m.vendor}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-purple-400">
                {m.nuanceAvg.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">avg</span>
            </div>
            <div className="mt-2 space-y-1">
              {nuanceBenchmarks.map((bn) => (
                <div key={bn} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 truncate mr-2">{bn}</span>
                  <span className="text-gray-300 font-medium">
                    {m.scores?.[bn] != null ? m.scores[bn].toFixed(1) : '--'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Token Pricing Tab Content ──────────────────────────────────────────
function TokenPricingTab() {
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getModelPricing();
        setPricingData(res.models ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm">Failed to load pricing data: {error}</p>
      </div>
    );
  }

  if (!pricingData || pricingData.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl border border-gray-800 border-dashed">
        <DollarSign className="w-8 h-8 text-gray-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No token pricing data available yet.</p>
      </div>
    );
  }

  // Bang for buck chart — top 10
  const chartData = pricingData
    .filter((m) => m.bang_for_buck > 0)
    .slice(0, 10)
    .map((m) => ({
      name: m.name,
      score: m.bang_for_buck,
      avgScore: m.avg_benchmark_score,
      blendedCost: m.blended_cost_per_mtok,
    }));

  return (
    <>
      {/* Bang for Buck Chart */}
      {chartData.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Bang for Buck — Top 10
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Score = average benchmark performance / blended token cost (30% input + 70% output). Higher = better value.
          </p>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <ChartContainer width="100%" height={Math.max(250, chartData.length * 36)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={160}
                  tick={{ fill: '#d1d5db', fontSize: 11 }}
                />
                <Tooltip content={<BangForBuckTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={22}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={quartileColor(i, chartData.length)} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </section>
      )}

      {/* Pricing Table */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Token Pricing Comparison
        </h2>
        <div className="rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-900 text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium sticky left-0 bg-gray-900 z-10">Model</th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Input $/1M</th>
                <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Output $/1M</th>
                <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Cache $/1M</th>
                <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Context</th>
                <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Avg Score</th>
                <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Bang/Buck</th>
                <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Available On</th>
              </tr>
            </thead>
            <tbody>
              {pricingData.map((m) => (
                <tr
                  key={m.slug}
                  className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-4 py-2.5 sticky left-0 bg-gray-950 z-10">
                    <span className="text-white font-medium">{m.name}</span>
                    {m.is_open_weight ? (
                      <span className="ml-1.5 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        Open
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">{m.vendor}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300 font-mono">
                    {formatPrice(m.input_price_per_mtok)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-300 font-mono">
                    {formatPrice(m.output_price_per_mtok)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500 font-mono">
                    {formatPrice(m.cache_hit_price_per_mtok)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-400 font-mono">
                    {formatContextWindow(m.context_window)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {m.avg_benchmark_score > 0 ? (
                      <ScoreCell score={m.avg_benchmark_score} />
                    ) : (
                      <span className="text-gray-700">--</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-bold font-mono ${bangForBuckColor(m.bang_for_buck)}`}>
                      {m.bang_for_buck > 0 ? m.bang_for_buck.toFixed(2) : '--'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {m.availability.length > 0
                        ? m.availability.map((a, i) => (
                            <span
                              key={i}
                              className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded"
                            >
                              {a.tool_name}
                              {a.plan_name ? ` (${a.plan_name})` : ''}
                            </span>
                          ))
                        : <span className="text-gray-700">--</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function BenchmarksPage() {
  const [category, setCategory] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [activeTab, setActiveTab] = useState('benchmarks');

  const { data, isLoading: loading, error: queryError } = useBenchmarks(category || undefined);
  const error = queryError?.message;

  // ── Tab Selector ─────────────────────────────────────────────────────
  const tabBar = (
    <div className="flex items-center gap-1 mb-6 border-b border-gray-800 pb-2">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.value
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/30'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // ── Token Pricing Tab ────────────────────────────────────────────────
  if (activeTab === 'pricing') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Benchmarks</h1>
        {tabBar}
        <TokenPricingTab />
      </div>
    );
  }

  // ── Benchmarks Tab ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Benchmarks</h1>
        {tabBar}
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Benchmarks</h1>
        {tabBar}
        <div className="text-center py-16">
          <p className="text-red-400 text-sm">Failed to load benchmarks: {error}</p>
        </div>
      </div>
    );
  }

  // API returns { benchmarks: { coding: [...], debugging: [...] }, categories: [...] }
  // Transform into models array with scores map
  const rawBenchmarks = data?.benchmarks ?? {};
  const allEntries = Object.values(rawBenchmarks).flat();

  // Build models map: { slug: { name, vendor, slug, scores: { benchmarkName: score } } }
  const modelsMap = {};
  for (const entry of allEntries) {
    const slug = entry.model_slug ?? entry.slug;
    if (!modelsMap[slug]) {
      modelsMap[slug] = {
        name: entry.model_name ?? entry.name,
        slug,
        vendor: entry.vendor,
        scores: {},
      };
    }
    modelsMap[slug].scores[entry.benchmark_name] = entry.score;
  }
  const models = Object.values(modelsMap);

  // Derive benchmark names from all entries
  const derivedBenchmarkNames = [...new Set(allEntries.map((e) => e.benchmark_name))];

  // Normalize a benchmark score to 0-100 scale
  // Arena ELO (1000-2000 range) needs special handling
  const normalizeScore = (benchmarkName, score) => {
    if (benchmarkName.toLowerCase().includes('arena elo')) {
      // ELO typically ranges ~1100-1520 for current models. Map 1100-1520 to 0-100.
      return Math.max(0, Math.min(100, ((score - 1100) / (1520 - 1100)) * 100));
    }
    return score; // Already 0-100 scale
  };

  // Compute average NORMALIZED score per model for the bar chart
  const chartData = models
    .map((m) => {
      const entries = Object.entries(m.scores ?? {}).filter(([, v]) => v != null);
      const normalized = entries.map(([bn, v]) => normalizeScore(bn, v));
      const avg = normalized.length > 0 ? normalized.reduce((a, b) => a + b, 0) / normalized.length : 0;
      return { name: m.name ?? m.model_name, avg: Number(avg.toFixed(1)) };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 15);

  // Quartile-based coloring: color by rank position, not absolute score

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Benchmarks</h1>
      {tabBar}

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              category === cat.value
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {models.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-gray-800 border-dashed">
          <BarChart3 className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No benchmark data available.</p>
        </div>
      ) : (
        <>
          {/* Nuance Highlight — show when nuance filter is active */}
          {category === 'nuance' && (
            <NuanceHighlight models={models} benchmarkNames={derivedBenchmarkNames} />
          )}

          {/* Bar Chart - top models */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Top Models {category && `- ${CATEGORIES.find((c) => c.value === category)?.label}`}
            </h2>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <ChartContainer width="100%" height={Math.max(250, chartData.length * 32)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    tick={{ fill: '#d1d5db', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={quartileColor(i, chartData.length)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </section>

          {/* Benchmark Table */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Detailed Scores
            </h2>
            <div className="rounded-xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-900 text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium sticky left-0 bg-gray-900 z-10">
                      Model
                    </th>
                    {derivedBenchmarkNames.map((name) => (
                      <th key={name} className="text-left px-4 py-3 font-medium whitespace-nowrap">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr
                      key={model.slug ?? model.name}
                      className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 sticky left-0 bg-gray-950 z-10">
                        <button
                          onClick={() => setSelectedModel(model)}
                          className="text-white font-medium hover:text-blue-400 transition-colors text-left"
                        >
                          {model.name ?? model.model_name}
                        </button>
                      </td>
                      {derivedBenchmarkNames.map((name) => (
                        <td key={name} className="px-4 py-2.5">
                          <ScoreCell score={model.scores?.[name]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Model Tools Modal */}
      {selectedModel && (
        <ModelToolsModal model={selectedModel} onClose={() => setSelectedModel(null)} />
      )}
    </div>
  );
}
