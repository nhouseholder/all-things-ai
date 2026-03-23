import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ArrowDown,
  BarChart3,
  ChevronDown,
  DollarSign,
  Loader2,
  Scale,
  Search,
  Sparkles,
  X,
  Zap,
  Shield,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api.js';

const PRICE_TIERS = [
  { label: 'Free', max: 0, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { label: 'Budget', max: 2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { label: 'Mid-range', max: 10, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { label: 'Premium', max: Infinity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

function getPriceTier(blendedCost) {
  return PRICE_TIERS.find(t => blendedCost <= t.max) || PRICE_TIERS[3];
}

function formatPrice(val) {
  if (val == null) return '—';
  if (val === 0) return 'Free';
  return `$${Number(val).toFixed(2)}`;
}

function scoreColor(score) {
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 55) return 'text-yellow-400';
  return 'text-orange-400';
}

function scoreBarBg(score) {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 55) return 'bg-yellow-500';
  return 'bg-orange-500';
}

export default function ComparePage() {
  const [allModels, setAllModels] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [alternatives, setAlternatives] = useState(null);
  const [altModel, setAltModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('compare'); // compare | alternatives | pricing

  useEffect(() => {
    async function load() {
      try {
        const [modelsRes, pricingRes] = await Promise.all([
          api.getModels(),
          api.getModelPricing(),
        ]);
        setAllModels(Array.isArray(modelsRes) ? modelsRes : []);
        setPricing(pricingRes.models || []);
      } catch { /* non-critical */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Compare selected models
  async function runComparison() {
    if (selected.length < 2) return;
    setComparing(true);
    try {
      const res = await api.compareModels(selected);
      setComparison(res.models || []);
    } catch { /* */ }
    finally { setComparing(false); }
  }

  // Load alternatives for a model
  async function loadAlternatives(slug) {
    setAltModel(slug);
    try {
      const res = await api.getModelAlternatives(slug);
      setAlternatives(res);
    } catch { setAlternatives(null); }
  }

  function addModel(slug) {
    if (selected.length < 4 && !selected.includes(slug)) {
      setSelected([...selected, slug]);
    }
    setShowPicker(false);
    setSearchTerm('');
  }

  function removeModel(slug) {
    setSelected(selected.filter(s => s !== slug));
    setComparison(null);
  }

  const filteredModels = useMemo(() => {
    if (!searchTerm) return allModels;
    const q = searchTerm.toLowerCase();
    return allModels.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.vendor.toLowerCase().includes(q) ||
      m.family?.toLowerCase().includes(q)
    );
  }, [allModels, searchTerm]);

  // Group pricing models by tier
  const pricingByTier = useMemo(() => {
    const groups = { Free: [], Budget: [], 'Mid-range': [], Premium: [] };
    for (const m of pricing) {
      const blended = (m.input_price_per_mtok * 0.3) + (m.output_price_per_mtok * 0.7);
      const tier = getPriceTier(blended);
      groups[tier.label]?.push({ ...m, blended_cost: blended, tier });
    }
    // Sort each group by bang_for_buck descending
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => (b.bang_for_buck || 0) - (a.bang_for_buck || 0));
    }
    return groups;
  }, [pricing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">Model Compare</h1>
        <p className="text-sm text-gray-400">Side-by-side comparison, pricing tiers, and affordable alternatives.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-900 rounded-xl border border-gray-800 w-fit">
        {[
          { id: 'compare', label: 'Compare Models', icon: Scale },
          { id: 'alternatives', label: 'Find Alternatives', icon: Sparkles },
          { id: 'pricing', label: 'Pricing Tiers', icon: DollarSign },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Compare Tab ──────────────────────────────────── */}
      {activeTab === 'compare' && (
        <div>
          {/* Model picker */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              {selected.map(slug => {
                const m = allModels.find(m => m.slug === slug);
                return (
                  <div key={slug} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
                    <span className="text-xs text-white font-medium">{m?.name || slug}</span>
                    <button onClick={() => removeModel(slug)} className="text-gray-500 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {selected.length < 4 && (
                <div className="relative">
                  <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-600 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    + Add Model
                  </button>
                  {showPicker && (
                    <div className="absolute top-full left-0 mt-2 w-72 max-h-64 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
                      <div className="sticky top-0 bg-gray-900 p-2 border-b border-gray-800">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" />
                          <input
                            autoFocus
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search models..."
                            className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-500 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      {filteredModels.filter(m => !selected.includes(m.slug)).map(m => (
                        <button
                          key={m.slug}
                          onClick={() => addModel(m.slug)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0"
                        >
                          <p className="text-xs text-white font-medium">{m.name}</p>
                          <p className="text-[10px] text-gray-500">{m.vendor} · {m.input_price_per_mtok != null ? `$${m.input_price_per_mtok}/$${m.output_price_per_mtok} per MTok` : 'Free'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {selected.length >= 2 && (
                <button
                  onClick={runComparison}
                  disabled={comparing}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                  Compare
                </button>
              )}
            </div>
            {selected.length < 2 && (
              <p className="text-[10px] text-gray-600 mt-2">Select 2-4 models to compare side by side</p>
            )}
          </div>

          {/* Comparison results */}
          {comparison && comparison.length > 0 && (
            <ComparisonTable models={comparison} />
          )}
        </div>
      )}

      {/* ── Alternatives Tab ─────────────────────────────── */}
      {activeTab === 'alternatives' && (
        <div>
          <div className="mb-6">
            <label className="text-xs text-gray-400 mb-2 block">Select a model to find cheaper alternatives:</label>
            <select
              value={altModel}
              onChange={e => loadAlternatives(e.target.value)}
              className="w-full max-w-sm px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Choose a model...</option>
              {allModels.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                <option key={m.slug} value={m.slug}>{m.name} ({m.vendor})</option>
              ))}
            </select>
          </div>

          {alternatives && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-white">Alternatives to {alternatives.model}</h2>
                <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-full bg-gray-800">{alternatives.alternatives?.length || 0} found</span>
              </div>

              {alternatives.alternatives?.length === 0 ? (
                <p className="text-sm text-gray-500">No alternatives mapped yet for this model.</p>
              ) : (
                <div className="space-y-3">
                  {alternatives.alternatives.map((alt, i) => {
                    const blended = (alt.input_price_per_mtok * 0.3) + (alt.output_price_per_mtok * 0.7);
                    const tier = getPriceTier(blended);
                    return (
                      <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-white">{alt.name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${tier.bg} ${tier.color} ${tier.border} border`}>
                                {tier.label}
                              </span>
                              {alt.is_open_weight ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Open Source
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{alt.vendor} · {alt.family}</p>
                            <p className="text-xs text-gray-300 leading-relaxed">{alt.trade_off_notes}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs text-gray-500">Similarity</span>
                              <span className={`text-sm font-bold ${scoreColor(alt.similarity_score * 100)}`}>
                                {Math.round(alt.similarity_score * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs text-gray-500">Savings</span>
                              <span className="text-sm font-bold text-green-400">{alt.cost_savings_pct}%</span>
                            </div>
                            {alt.composite_score && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Score</span>
                                <span className={`text-sm font-bold ${scoreColor(alt.composite_score)}`}>
                                  {Number(alt.composite_score).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-4 text-[10px] text-gray-500">
                          <span>Input: {formatPrice(alt.input_price_per_mtok)}/MTok</span>
                          <span>Output: {formatPrice(alt.output_price_per_mtok)}/MTok</span>
                          <span>Blended: {formatPrice(blended)}/MTok</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Pricing Tiers Tab ────────────────────────────── */}
      {activeTab === 'pricing' && (
        <div className="space-y-8">
          {PRICE_TIERS.map(tier => {
            const models = pricingByTier[tier.label] || [];
            if (models.length === 0) return null;
            return (
              <div key={tier.label}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-bold ${tier.color}`}>{tier.label}</span>
                  <span className="text-[10px] text-gray-600">
                    {tier.max === 0 ? '$0/MTok' : tier.max === Infinity ? `>$10/MTok` : `<$${tier.max}/MTok blended`}
                  </span>
                  <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full bg-gray-800">{models.length} models</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {models.map(m => (
                    <div key={m.slug} className={`rounded-xl border ${tier.border} bg-gray-900/50 p-4 hover:bg-gray-900/80 transition-colors`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-semibold text-white">{m.name}</h3>
                            {m.is_open_weight ? (
                              <Globe className="w-3 h-3 text-emerald-400" />
                            ) : null}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{m.vendor} · {m.family}</p>
                        </div>
                        <div className="text-right">
                          {m.composite_score ? (
                            <span className={`text-sm font-bold ${scoreColor(m.avg_benchmark_score)}`}>
                              {m.avg_benchmark_score}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-500">
                        <span>In: {formatPrice(m.input_price_per_mtok)}/MTok</span>
                        <span>Out: {formatPrice(m.output_price_per_mtok)}/MTok</span>
                        <span className={`font-medium ${tier.color}`}>
                          BFB: {m.bang_for_buck?.toFixed(1) || '—'}
                        </span>
                      </div>
                      {m.availability?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {m.availability.slice(0, 3).map((a, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                              {a.tool_name}{a.plan_name ? ` · ${a.plan_name}` : ''}{a.price_monthly ? ` $${a.price_monthly}/mo` : ''}
                            </span>
                          ))}
                          {m.availability.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">+{m.availability.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Comparison Table ────────────────────────────────────────────

function ComparisonTable({ models }) {
  if (!models?.length) return null;

  // All benchmark names across all models
  const allBenchmarks = [...new Set(models.flatMap(m => m.benchmarks?.map(b => b.benchmark_name) || []))];

  // Find the "best" value for highlighting
  function bestOf(key, higher = true) {
    const vals = models.map(m => m[key]).filter(v => v != null);
    return higher ? Math.max(...vals) : Math.min(...vals);
  }

  const bestComposite = bestOf('composite_score');
  const lowestInput = bestOf('input_price_per_mtok', false);
  const lowestOutput = bestOf('output_price_per_mtok', false);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-3 text-gray-500 font-medium w-32">Metric</th>
            {models.map(m => (
              <th key={m.slug} className="text-center py-3 px-3">
                <p className="text-white font-semibold">{m.name}</p>
                <p className="text-[10px] text-gray-500 font-normal">{m.vendor}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {/* Composite Score */}
          <CompRow label="AllThingsAI Score" models={models} accessor={m => m.composite_score}
            format={v => v?.toFixed(1) || '—'}
            highlight={v => v === bestComposite}
          />

          {/* Pricing */}
          <CompRow label="Input $/MTok" models={models} accessor={m => m.input_price_per_mtok}
            format={v => formatPrice(v)}
            highlight={v => v === lowestInput}
            highlightColor="text-green-400"
          />
          <CompRow label="Output $/MTok" models={models} accessor={m => m.output_price_per_mtok}
            format={v => formatPrice(v)}
            highlight={v => v === lowestOutput}
            highlightColor="text-green-400"
          />
          <CompRow label="Blended $/MTok" models={models} accessor={m => m.blended_cost}
            format={v => formatPrice(v)}
          />

          {/* Context */}
          <CompRow label="Context Window" models={models} accessor={m => m.context_window}
            format={v => v ? `${(v / 1000).toFixed(0)}K` : '—'}
          />

          {/* Open Weight */}
          <CompRow label="Open Source" models={models} accessor={m => m.is_open_weight}
            format={v => v ? 'Yes' : 'No'}
          />

          {/* Benchmarks */}
          {allBenchmarks.map(name => {
            const bestScore = Math.max(...models.map(m => {
              const b = m.benchmarks?.find(b => b.benchmark_name === name);
              return b?.score || 0;
            }));
            return (
              <CompRow key={name} label={name} models={models}
                accessor={m => m.benchmarks?.find(b => b.benchmark_name === name)?.score}
                format={v => v != null ? Number(v).toFixed(1) : '—'}
                highlight={v => v === bestScore && bestScore > 0}
              />
            );
          })}

          {/* Availability */}
          <tr>
            <td className="py-3 px-3 text-gray-500 font-medium align-top">Available on</td>
            {models.map(m => (
              <td key={m.slug} className="py-3 px-3 text-center align-top">
                {m.availability?.length > 0 ? (
                  <div className="space-y-1">
                    {m.availability.slice(0, 4).map((a, i) => (
                      <div key={i} className="text-[10px] text-gray-400">
                        {a.tool_name}{a.plan_name ? ` (${a.plan_name})` : ''}
                        {a.price_monthly ? <span className="text-green-400"> ${a.price_monthly}/mo</span> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-600">API only</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CompRow({ label, models, accessor, format, highlight, highlightColor = 'text-blue-400' }) {
  return (
    <tr>
      <td className="py-2.5 px-3 text-gray-500 font-medium">{label}</td>
      {models.map(m => {
        const val = accessor(m);
        const formatted = format(val);
        const isHighlighted = highlight?.(val);
        return (
          <td key={m.slug} className={`py-2.5 px-3 text-center font-medium ${isHighlighted ? highlightColor + ' font-bold' : 'text-gray-300'}`}>
            {formatted}
          </td>
        );
      })}
    </tr>
  );
}
