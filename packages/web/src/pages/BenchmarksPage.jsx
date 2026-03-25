import { useState, useEffect } from 'react';
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
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { api } from '../lib/api.js';

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
  if (score >= 80) return { bg: 'bg-neon', text: 'text-neon' };
  if (score >= 60) return { bg: 'bg-cyan', text: 'text-cyan' };
  if (score >= 40) return { bg: 'bg-gold', text: 'text-gold' };
  if (score >= 20) return { bg: 'bg-warn', text: 'text-warn' };
  return { bg: 'bg-hot', text: 'text-hot' };
}

function bangForBuckColor(score) {
  if (score >= 10) return 'text-neon';
  if (score >= 5) return 'text-cyan';
  if (score >= 2) return 'text-gold';
  if (score >= 1) return 'text-warn';
  return 'text-hot';
}

function bangForBuckBarColor(score) {
  if (score >= 10) return '#00ff88';
  if (score >= 5) return '#00d4ff';
  if (score >= 2) return '#fbbf24';
  if (score >= 1) return '#ff6b35';
  return '#ff3366';
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
  if (score == null) return <span className="text-dim">--</span>;
  const { bg, text } = scoreColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar">
        <div
          className={`score-bar-fill ${bg}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={`text-xs font-medium font-mono ${text}`}>{score.toFixed(1)}</span>
    </div>
  );
}

function CustomBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-elevated border border-edge rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-silver font-medium font-mono">{data.payload.name}</p>
      <p className="text-muted">Score: <span className="text-neon font-mono">{Number(data.value).toFixed(1)}</span></p>
    </div>
  );
}

function BangForBuckTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-elevated border border-edge rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-silver font-medium font-mono">{d.name}</p>
      <p className="text-muted">Bang/Buck: <span className="text-neon font-mono">{d.score.toFixed(2)}</span></p>
      <p className="text-dim">Avg Score: {d.avgScore.toFixed(1)} | Blended: {formatPrice(d.blendedCost)}/1M</p>
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
        className="card-glow max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold font-mono text-silver mb-1">{model.name ?? model.model_name}</h3>
        <p className="text-xs text-dim mb-4">Available in the following tools/plans:</p>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-dim" />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-dim">No tool/plan information available.</p>
        ) : (
          <ul className="space-y-2">
            {plans.map((p, i) => (
              <li key={i} className="p-3 rounded-lg bg-elevated border border-edge">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-silver">{p.tool_name}</span>
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
                        style = 'bg-warn/10 text-warn';
                      } else if (!hasModelCost) {
                        label = 'Free';
                        style = 'bg-neon/10 text-neon';
                      } else if (hasByok) {
                        label = 'BYOK';
                        style = 'bg-gold/10 text-gold';
                      } else if (hasCredits) {
                        label = `${p.credits_per_request} cr/req`;
                        style = 'bg-cyan/10 text-cyan';
                      } else {
                        label = 'API costs';
                        style = 'bg-gold/10 text-gold';
                      }
                      return (
                        <span className={`terminal-badge ${style}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <p className="text-xs text-muted mt-0.5">{p.plan_name}</p>
                {p.model_cost_notes && (
                  <p className="text-[10px] text-cyan/80 mt-1">{p.model_cost_notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="btn-outline mt-4 w-full"
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
        <Zap className="w-4 h-4 text-cyan" />
        <h2 className="section-label mb-0 text-cyan">
          Human Nuance Understanding — Top Models
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ranked.map((m, i) => (
          <div
            key={m.slug}
            className={`rounded-xl border p-4 ${
              i === 0
                ? 'border-cyan/40 bg-cyan/5 glow-cyan'
                : 'border-edge bg-surface/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dim font-mono">#{i + 1}</span>
              {i === 0 && (
                <span className="terminal-badge bg-cyan/10 text-cyan">
                  Best
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-silver truncate">{m.name}</p>
            <p className="text-xs text-dim mb-2">{m.vendor}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-cyan">
                {m.nuanceAvg.toFixed(1)}
              </span>
              <span className="text-xs text-dim">avg</span>
            </div>
            <div className="mt-2 space-y-1">
              {nuanceBenchmarks.map((bn) => (
                <div key={bn} className="flex items-center justify-between text-[11px]">
                  <span className="text-dim truncate mr-2">{bn}</span>
                  <span className="text-silver font-medium font-mono">
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
        <Loader2 className="w-6 h-6 text-neon animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-hot text-sm">Failed to load pricing data: {error}</p>
      </div>
    );
  }

  if (!pricingData || pricingData.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl border border-edge border-dashed">
        <DollarSign className="w-8 h-8 text-dim mx-auto mb-2" />
        <p className="text-sm text-dim">No token pricing data available yet.</p>
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
            <TrendingUp className="w-4 h-4 text-neon" />
            <h2 className="section-label mb-0">
              Bang for Buck — Top 10
            </h2>
          </div>
          <p className="text-xs text-dim mb-3">
            Score = average benchmark performance / blended token cost (30% input + 70% output). Higher = better value.
          </p>
          <div className="card p-4">
            <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 36)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={160}
                  tick={{ fill: '#e2e8f0', fontSize: 11 }}
                />
                <Tooltip content={<BangForBuckTooltip />} cursor={{ fill: 'rgba(0,255,136,0.03)' }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={22}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={bangForBuckBarColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Pricing Table */}
      <section>
        <h2 className="section-label mb-3">
          Token Pricing Comparison
        </h2>
        <div className="rounded-xl border border-edge overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="sticky left-0 bg-surface z-10">Model</th>
                <th>Vendor</th>
                <th className="text-right">Input $/1M</th>
                <th className="text-right">Output $/1M</th>
                <th className="text-right">Cache $/1M</th>
                <th className="text-right">Context</th>
                <th className="text-right">Avg Score</th>
                <th className="text-right">Bang/Buck</th>
                <th>Available On</th>
              </tr>
            </thead>
            <tbody>
              {pricingData.map((m) => (
                <tr key={m.slug}>
                  <td className="sticky left-0 bg-void z-10">
                    <span className="text-silver font-medium">{m.name}</span>
                    {m.is_open_weight ? (
                      <span className="ml-1.5 terminal-badge bg-neon/10 text-neon">
                        Open
                      </span>
                    ) : null}
                  </td>
                  <td className="text-muted">{m.vendor}</td>
                  <td className="text-right text-silver font-mono">
                    {formatPrice(m.input_price_per_mtok)}
                  </td>
                  <td className="text-right text-silver font-mono">
                    {formatPrice(m.output_price_per_mtok)}
                  </td>
                  <td className="text-right text-dim font-mono">
                    {formatPrice(m.cache_hit_price_per_mtok)}
                  </td>
                  <td className="text-right text-muted font-mono">
                    {formatContextWindow(m.context_window)}
                  </td>
                  <td className="text-right">
                    {m.avg_benchmark_score > 0 ? (
                      <ScoreCell score={m.avg_benchmark_score} />
                    ) : (
                      <span className="text-dim">--</span>
                    )}
                  </td>
                  <td className="text-right">
                    <span className={`font-bold font-mono ${bangForBuckColor(m.bang_for_buck)}`}>
                      {m.bang_for_buck > 0 ? m.bang_for_buck.toFixed(2) : '--'}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {m.availability.length > 0
                        ? m.availability.map((a, i) => (
                            <span
                              key={i}
                              className="terminal-badge bg-raised text-muted"
                            >
                              {a.tool_name}
                              {a.plan_name ? ` (${a.plan_name})` : ''}
                            </span>
                          ))
                        : <span className="text-dim">--</span>}
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [activeTab, setActiveTab] = useState('benchmarks');

  useEffect(() => {
    async function loadBenchmarks() {
      setLoading(true);
      try {
        const res = await api.getBenchmarks(category || undefined);
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBenchmarks();
  }, [category]);

  // ── Tab Selector ─────────────────────────────────────────────────────
  const tabBar = (
    <div className="flex items-center gap-1 mb-6 border-b border-edge pb-2">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`pill ${activeTab === tab.value ? 'pill-active' : ''}`}
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
        <h1 className="text-2xl font-bold font-mono text-silver mb-1">Benchmarks</h1>
        <p className="text-sm text-muted mb-6">Compare model performance across standardized tests.</p>
        {tabBar}
        <TokenPricingTab />
      </div>
    );
  }

  // ── Benchmarks Tab ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-mono text-silver mb-1">Benchmarks</h1>
        <p className="text-sm text-muted mb-6">Compare model performance across standardized tests.</p>
        {tabBar}
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-neon animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-mono text-silver mb-1">Benchmarks</h1>
        <p className="text-sm text-muted mb-6">Compare model performance across standardized tests.</p>
        {tabBar}
        <div className="text-center py-16">
          <p className="text-hot text-sm">Failed to load benchmarks: {error}</p>
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
      return Math.max(0, Math.min(100, ((score - 1100) / (1520 - 1100)) * 100));
    }
    return score;
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

  const barColor = (score) => {
    if (score >= 80) return '#00ff88';
    if (score >= 60) return '#00d4ff';
    if (score >= 40) return '#fbbf24';
    if (score >= 20) return '#ff6b35';
    return '#ff3366';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold font-mono text-silver mb-1">Benchmarks</h1>
      <p className="text-sm text-muted mb-6">Compare model performance across standardized tests.</p>
      {tabBar}

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-dim" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`pill ${category === cat.value ? 'pill-active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {models.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-edge border-dashed">
          <BarChart3 className="w-8 h-8 text-dim mx-auto mb-2" />
          <p className="text-sm text-dim">No benchmark data available.</p>
        </div>
      ) : (
        <>
          {/* Nuance Highlight — show when nuance filter is active */}
          {category === 'nuance' && (
            <NuanceHighlight models={models} benchmarkNames={derivedBenchmarkNames} />
          )}

          {/* Bar Chart - top models */}
          <section className="mb-8">
            <h2 className="section-label mb-3">
              Top Models {category && `- ${CATEGORIES.find((c) => c.value === category)?.label}`}
            </h2>
            <div className="card p-4">
              <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 32)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    tick={{ fill: '#e2e8f0', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,255,136,0.03)' }} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={barColor(entry.avg)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Benchmark Table */}
          <section>
            <h2 className="section-label mb-3">
              Detailed Scores
            </h2>
            <div className="rounded-xl border border-edge overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-surface z-10">
                      Model
                    </th>
                    {derivedBenchmarkNames.map((name) => (
                      <th key={name} className="whitespace-nowrap">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.slug ?? model.name}>
                      <td className="sticky left-0 bg-void z-10">
                        <button
                          onClick={() => setSelectedModel(model)}
                          className="text-silver font-medium hover:text-neon transition-colors text-left"
                        >
                          {model.name ?? model.model_name}
                        </button>
                      </td>
                      {derivedBenchmarkNames.map((name) => (
                        <td key={name}>
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
