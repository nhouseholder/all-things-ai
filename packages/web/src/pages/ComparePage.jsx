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
  Globe,
} from 'lucide-react';
import { api } from '../lib/api.js';

const PRICE_TIERS = [
  { label: 'Free', max: 0, color: 'text-neon', bg: 'bg-neon/10', border: 'border-neon/20' },
  { label: 'Budget', max: 2, color: 'text-cyan', bg: 'bg-cyan/10', border: 'border-cyan/20' },
  { label: 'Mid-range', max: 10, color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' },
  { label: 'Premium', max: Infinity, color: 'text-hot', bg: 'bg-hot/10', border: 'border-hot/20' },
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
  if (score >= 85) return 'text-neon';
  if (score >= 70) return 'text-cyan';
  if (score >= 55) return 'text-gold';
  return 'text-warn';
}

function scoreBarBg(score) {
  if (score >= 85) return 'bg-neon';
  if (score >= 70) return 'bg-cyan';
  if (score >= 55) return 'bg-gold';
  return 'bg-warn';
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
  const [activeTab, setActiveTab] = useState('compare');

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

  async function runComparison() {
    if (selected.length < 2) return;
    setComparing(true);
    try {
      const res = await api.compareModels(selected);
      setComparison(res.models || []);
    } catch { /* */ }
    finally { setComparing(false); }
  }

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

  const pricingByTier = useMemo(() => {
    const groups = { Free: [], Budget: [], 'Mid-range': [], Premium: [] };
    for (const m of pricing) {
      const blended = (m.input_price_per_mtok * 0.3) + (m.output_price_per_mtok * 0.7);
      const tier = getPriceTier(blended);
      groups[tier.label]?.push({ ...m, blended_cost: blended, tier });
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => (b.bang_for_buck || 0) - (a.bang_for_buck || 0));
    }
    return groups;
  }, [pricing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-neon animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-mono font-bold text-silver mb-1">Model Compare</h1>
        <p className="text-sm text-muted">Side-by-side comparison, pricing tiers, and affordable alternatives.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {[
          { id: 'compare', label: 'Compare Models', icon: Scale },
          { id: 'alternatives', label: 'Find Alternatives', icon: Sparkles },
          { id: 'pricing', label: 'Pricing Tiers', icon: DollarSign },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pill flex items-center gap-2 ${activeTab === tab.id ? 'pill-active' : ''}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Compare Tab ──────────────────────────────────── */}
      {activeTab === 'compare' && (
        <div>
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              {selected.map(slug => {
                const m = allModels.find(m => m.slug === slug);
                return (
                  <div key={slug} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-elevated border border-edge font-mono text-xs">
                    <span className="text-silver font-medium">{m?.name || slug}</span>
                    <button onClick={() => removeModel(slug)} className="text-dim hover:text-hot transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {selected.length < 4 && (
                <div className="relative">
                  <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="btn-ghost text-xs border-dashed"
                  >
                    + Add Model
                  </button>
                  {showPicker && (
                    <div className="absolute top-full left-0 mt-2 w-72 max-h-64 overflow-y-auto bg-surface border border-edge rounded-md shadow-2xl shadow-black/50 z-50">
                      <div className="sticky top-0 bg-surface p-2 border-b border-edge">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-dim" />
                          <input
                            autoFocus
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search models..."
                            className="w-full pl-8 pr-3 py-1.5 bg-elevated border border-edge rounded-md text-xs text-silver font-mono placeholder:text-dim outline-none focus:border-neon/50"
                          />
                        </div>
                      </div>
                      {filteredModels.filter(m => !selected.includes(m.slug)).map(m => (
                        <button
                          key={m.slug}
                          onClick={() => addModel(m.slug)}
                          className="w-full text-left px-3 py-2 hover:bg-elevated transition-colors border-b border-edge/50 last:border-0"
                        >
                          <p className="text-xs text-silver font-mono font-medium">{m.name}</p>
                          <p className="text-[11px] text-dim">{m.vendor} · {m.input_price_per_mtok != null ? `$${m.input_price_per_mtok}/$${m.output_price_per_mtok} per MTok` : 'Free'}</p>
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
                  className="btn-neon text-xs disabled:opacity-50"
                >
                  {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                  Compare
                </button>
              )}
            </div>
            {selected.length < 2 && (
              <p className="text-xs text-dim font-mono mt-2">Select 2-4 models to compare side by side</p>
            )}
          </div>

          {comparison && comparison.length > 0 && (
            <ComparisonTable models={comparison} />
          )}
        </div>
      )}

      {/* ── Alternatives Tab ─────────────────────────────── */}
      {activeTab === 'alternatives' && (
        <div>
          <div className="mb-6">
            <label className="text-xs text-muted mb-2 block font-mono">Select a model to find cheaper alternatives:</label>
            <select
              value={altModel}
              onChange={e => loadAlternatives(e.target.value)}
              className="w-full max-w-sm px-3 py-2 bg-surface border border-edge rounded-md text-sm text-silver font-mono outline-none focus:border-neon/50"
            >
              <option value="">Choose a model...</option>
              {[...allModels].sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                <option key={m.slug} value={m.slug}>{m.name} ({m.vendor})</option>
              ))}
            </select>
          </div>

          {alternatives && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-mono font-bold text-silver">Alternatives to {alternatives.model}</h2>
                <span className="terminal-badge bg-elevated text-dim border-edge">{alternatives.alternatives?.length || 0} found</span>
              </div>

              {alternatives.alternatives?.length === 0 ? (
                <p className="text-sm text-dim font-mono">No alternatives mapped yet for this model.</p>
              ) : (
                <div className="space-y-3">
                  {alternatives.alternatives.map((alt, i) => {
                    const blended = (alt.input_price_per_mtok * 0.3) + (alt.output_price_per_mtok * 0.7);
                    const tier = getPriceTier(blended);
                    return (
                      <div key={i} className="card p-4 hover:border-neon/20 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-mono font-semibold text-silver">{alt.name}</h3>
                              <span className={`terminal-badge ${tier.bg} ${tier.color} ${tier.border}`}>
                                {tier.label}
                              </span>
                              {alt.is_open_weight ? (
                                <span className="terminal-badge bg-neon/10 text-neon border-neon/20">
                                  Open Source
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-dim mb-2">{alt.vendor} · {alt.family}</p>
                            <p className="text-xs text-muted leading-relaxed">{alt.trade_off_notes}</p>
                          </div>
                          <div className="text-right flex-shrink-0 font-mono">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-[11px] text-dim">Similarity</span>
                              <span className={`text-sm font-bold ${scoreColor(alt.similarity_score * 100)}`}>
                                {Math.round(alt.similarity_score * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-[11px] text-dim">Savings</span>
                              <span className="text-sm font-bold text-neon">{alt.cost_savings_pct}%</span>
                            </div>
                            {alt.composite_score && (
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-dim">Score</span>
                                <span className={`text-sm font-bold ${scoreColor(alt.composite_score)}`}>
                                  {Number(alt.composite_score).toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-edge flex items-center gap-4 text-[11px] text-dim font-mono">
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
                  <span className={`text-sm font-mono font-bold ${tier.color}`}>{tier.label}</span>
                  <span className="text-[11px] text-dim font-mono">
                    {tier.max === 0 ? '$0/MTok' : tier.max === Infinity ? `>$10/MTok` : `<$${tier.max}/MTok blended`}
                  </span>
                  <span className="terminal-badge bg-elevated text-dim border-edge">{models.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {models.map(m => (
                    <div key={m.slug} className={`card p-4 hover:border-opacity-50 transition-colors`} style={{ borderColor: `${tier.color === 'text-neon' ? '#00ff8830' : tier.color === 'text-cyan' ? '#00d4ff30' : tier.color === 'text-gold' ? '#fbbf2430' : '#ff336630'}` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-mono font-semibold text-silver">{m.name}</h3>
                            {m.is_open_weight ? (
                              <Globe className="w-3 h-3 text-neon" />
                            ) : null}
                          </div>
                          <p className="text-[11px] text-dim mt-0.5">{m.vendor} · {m.family}</p>
                        </div>
                        <div className="text-right">
                          {m.composite_score ? (
                            <span className={`text-sm font-mono font-bold ${scoreColor(m.avg_benchmark_score)}`}>
                              {m.avg_benchmark_score}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-dim font-mono">
                        <span>In: {formatPrice(m.input_price_per_mtok)}/MTok</span>
                        <span>Out: {formatPrice(m.output_price_per_mtok)}/MTok</span>
                        <span className={`font-semibold ${tier.color}`}>
                          BFB: {m.bang_for_buck?.toFixed(1) || '—'}
                        </span>
                      </div>
                      {m.availability?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {m.availability.slice(0, 3).map((a, i) => (
                            <span key={i} className="terminal-badge bg-elevated text-dim border-edge">
                              {a.tool_name}{a.plan_name ? ` · ${a.plan_name}` : ''}{a.price_monthly ? ` $${a.price_monthly}/mo` : ''}
                            </span>
                          ))}
                          {m.availability.length > 3 && (
                            <span className="terminal-badge bg-elevated text-dim border-edge">+{m.availability.length - 3}</span>
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

  const allBenchmarks = [...new Set(models.flatMap(m => m.benchmarks?.map(b => b.benchmark_name) || []))];

  function bestOf(key, higher = true) {
    const vals = models.map(m => m[key]).filter(v => v != null);
    return higher ? Math.max(...vals) : Math.min(...vals);
  }

  const bestComposite = bestOf('composite_score');
  const lowestInput = bestOf('input_price_per_mtok', false);
  const lowestOutput = bestOf('output_price_per_mtok', false);

  return (
    <div className="overflow-x-auto card p-0">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-32">Metric</th>
            {models.map(m => (
              <th key={m.slug} className="text-center">
                <p className="text-silver font-semibold">{m.name}</p>
                <p className="text-dim font-normal">{m.vendor}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <CompRow label="AllThingsAI Score" models={models} accessor={m => m.composite_score}
            format={v => v?.toFixed(1) || '—'}
            highlight={v => v === bestComposite}
          />
          <CompRow label="Input $/MTok" models={models} accessor={m => m.input_price_per_mtok}
            format={v => formatPrice(v)}
            highlight={v => v === lowestInput}
            highlightColor="text-neon"
          />
          <CompRow label="Output $/MTok" models={models} accessor={m => m.output_price_per_mtok}
            format={v => formatPrice(v)}
            highlight={v => v === lowestOutput}
            highlightColor="text-neon"
          />
          <CompRow label="Blended $/MTok" models={models} accessor={m => m.blended_cost}
            format={v => formatPrice(v)}
          />
          <CompRow label="Context Window" models={models} accessor={m => m.context_window}
            format={v => v ? `${(v / 1000).toFixed(0)}K` : '—'}
          />
          <CompRow label="Open Source" models={models} accessor={m => m.is_open_weight}
            format={v => v ? 'Yes' : 'No'}
          />
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
          <tr>
            <td className="text-dim font-medium align-top">Available on</td>
            {models.map(m => (
              <td key={m.slug} className="text-center align-top">
                {m.availability?.length > 0 ? (
                  <div className="space-y-1">
                    {m.availability.slice(0, 4).map((a, i) => (
                      <div key={i} className="text-[11px] text-muted">
                        {a.tool_name}{a.plan_name ? ` (${a.plan_name})` : ''}
                        {a.price_monthly ? <span className="text-neon"> ${a.price_monthly}/mo</span> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-dim">API only</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CompRow({ label, models, accessor, format, highlight, highlightColor = 'text-cyan' }) {
  return (
    <tr>
      <td className="text-dim font-medium">{label}</td>
      {models.map(m => {
        const val = accessor(m);
        const formatted = format(val);
        const isHighlighted = highlight?.(val);
        return (
          <td key={m.slug} className={`text-center font-medium ${isHighlighted ? highlightColor + ' font-bold' : 'text-muted'}`}>
            {formatted}
          </td>
        );
      })}
    </tr>
  );
}
