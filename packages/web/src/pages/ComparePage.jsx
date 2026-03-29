import { useState, useEffect, useMemo } from 'react';
import { setPageTitle } from '../lib/format.js';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Crown,
  DollarSign,
  Globe,
  Loader2,
  Scale,
  Search,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, Cell,
} from 'recharts';
import { api } from '../lib/api.js';
import { useModels, useModelPricing } from '../lib/hooks.js';

const PRICE_TIERS = [
  { label: 'Free', max: 0, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { label: 'Budget', max: 2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { label: 'Mid-range', max: 10, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { label: 'Premium', max: Infinity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

const MODEL_COLORS = ['#60a5fa', '#a78bfa', '#fbbf24', '#34d399'];
const MODEL_GLOWS = ['rgba(96,165,250,0.3)', 'rgba(167,139,250,0.3)', 'rgba(251,191,36,0.3)', 'rgba(52,211,153,0.3)'];

const SCORE_DIMENSIONS = [
  { key: 'swe_bench', label: 'SWE-bench' },
  { key: 'livecodebench', label: 'LiveCode' },
  { key: 'nuance', label: 'Nuance' },
  { key: 'arena', label: 'Arena' },
  { key: 'tau', label: 'TAU-bench' },
  { key: 'gpqa', label: 'GPQA' },
  { key: 'success_rate', label: 'Success Rate' },
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

function steeringBadge(effort) {
  const map = {
    low: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
    medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    high: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  };
  const s = map[effort] || map.medium;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border} capitalize`}>
      {effort}
    </span>
  );
}

export default function ComparePage() {
  useEffect(() => { setPageTitle('Compare Models'); }, []);
  const { data: modelsData, isLoading: modelsLoading } = useModels();
  const { data: pricingData, isLoading: pricingLoading } = useModelPricing();
  const loading = modelsLoading || pricingLoading;

  const allModels = Array.isArray(modelsData) ? modelsData : [];
  const pricing = pricingData?.models || [];

  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [taskProfiles, setTaskProfiles] = useState([]);
  const [alternatives, setAlternatives] = useState(null);
  const [altModel, setAltModel] = useState('');
  const [comparing, setComparing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('compare');
  const [selectedTask, setSelectedTask] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Compare selected models
  async function runComparison() {
    if (selected.length < 2) return;
    setComparing(true);
    try {
      const res = await api.compareModels(selected);
      setComparison(res.models || []);
      setTaskProfiles(res.task_profiles || []);
      if (res.task_profiles?.length && !selectedTask) {
        setSelectedTask(res.task_profiles[0].slug);
      }
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

  const tabs = [
    { id: 'compare', label: 'Compare Models', icon: Scale },
    { id: 'tasks', label: 'Task Performance', icon: Zap },
    { id: 'availability', label: 'Where to Use', icon: Globe },
    { id: 'alternatives', label: 'Find Alternatives', icon: Sparkles },
    { id: 'pricing', label: 'Pricing Tiers', icon: DollarSign },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">Model Compare</h1>
        <p className="text-sm text-gray-400">
          Deep comparison with benchmarks, task performance, and availability.
          <span className="text-gray-600 text-xs ml-1">· Scores updated daily</span>
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-900 rounded-xl border border-gray-800 w-fit flex-wrap">
        {tabs.map(tab => (
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

      {/* Model Picker — shared across compare/tasks/availability tabs */}
      {['compare', 'tasks', 'availability'].includes(activeTab) && (
        <ModelPicker
          selected={selected}
          allModels={allModels}
          filteredModels={filteredModels}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showPicker={showPicker}
          setShowPicker={setShowPicker}
          addModel={addModel}
          removeModel={removeModel}
          runComparison={runComparison}
          comparing={comparing}
        />
      )}

      {/* ── Compare Tab ──────────────────────────────────── */}
      {activeTab === 'compare' && comparison && comparison.length > 0 && (
        <div className="space-y-6">
          {/* Radar Chart */}
          <RadarComparisonChart models={comparison} />

          {/* Score Breakdown (expandable) */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                Score Component Breakdown
              </span>
              {showBreakdown
                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                : <ChevronDown className="w-4 h-4 text-gray-500" />
              }
            </button>
            {showBreakdown && <ScoreBreakdown models={comparison} />}
          </div>

          {/* Main Comparison Table */}
          <ComparisonTable models={comparison} />
        </div>
      )}

      {/* ── Task Performance Tab ────────────────────────── */}
      {activeTab === 'tasks' && (
        <div>
          {!comparison || comparison.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">Select and compare 2-4 models first to see task performance.</p>
          ) : (
            <TaskPerformanceTab
              models={comparison}
              taskProfiles={taskProfiles}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
          )}
        </div>
      )}

      {/* ── Where to Use Tab ────────────────────────────── */}
      {activeTab === 'availability' && (
        <div>
          {!comparison || comparison.length === 0 ? (
            <p className="text-sm text-gray-500 mt-4">Select and compare 2-4 models first to see availability.</p>
          ) : (
            <AvailabilityMatrix models={comparison} />
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
                  <span className="text-[10px] text-gray-500">
                    {tier.max === 0 ? '$0/MTok' : tier.max === Infinity ? `>$10/MTok` : `<$${tier.max}/MTok blended`}
                  </span>
                  <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-full bg-gray-800">{models.length} models</span>
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

// ── Model Picker (shared) ────────────────────────────────────────
function ModelPicker({ selected, allModels, filteredModels, searchTerm, setSearchTerm, showPicker, setShowPicker, addModel, removeModel, runComparison, comparing }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        {selected.map(slug => {
          const m = allModels.find(m => m.slug === slug);
          const idx = selected.indexOf(slug);
          return (
            <div key={slug} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[idx] }} />
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
        <p className="text-[10px] text-gray-500 mt-2">Select 2-4 models to compare side by side</p>
      )}
    </div>
  );
}

// ── Radar Comparison Chart ───────────────────────────────────────
function RadarComparisonChart({ models }) {
  // Build radar data from score components
  const radarData = SCORE_DIMENSIONS.map(dim => {
    const point = { dimension: dim.label };
    for (const m of models) {
      const val = m.score_components?.[dim.key];
      // Values are already 0-100 scale (benchmark percentages)
      point[m.slug] = val != null ? Math.round(val) : 0;
    }
    return point;
  });

  const hasData = radarData.some(d => models.some(m => d[m.slug] > 0));
  if (!hasData) return null;

  return (
    <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        Capability Profile
      </h3>
      <div className="flex items-center gap-5 mb-3 flex-wrap">
        {models.map((m, i) => (
          <div key={m.slug} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: MODEL_COLORS[i], boxShadow: `0 0 8px ${MODEL_GLOWS[i]}` }} />
            <span className="text-xs text-gray-300 font-medium">{m.name}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <PolarGrid stroke="#1e293b" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
            tickLine={false}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          {/* Render in reverse so the first model (most important) is on top */}
          {[...models].reverse().map((m) => {
            const i = models.indexOf(m);
            return (
              <Radar
                key={m.slug}
                name={m.name}
                dataKey={m.slug}
                stroke={MODEL_COLORS[i]}
                fill={MODEL_COLORS[i]}
                fillOpacity={0.15}
                strokeWidth={2.5}
                dot={{ r: 3, fill: MODEL_COLORS[i], strokeWidth: 0 }}
                activeDot={{ r: 5, fill: MODEL_COLORS[i], stroke: '#fff', strokeWidth: 2 }}
              />
            );
          })}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: '10px',
              fontSize: '11px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            itemStyle={{ color: '#e2e8f0', paddingTop: 2, paddingBottom: 2 }}
            labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Score Component Breakdown ────────────────────────────────────
function ScoreBreakdown({ models }) {
  return (
    <div className="px-4 pb-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2 px-2 text-gray-500 font-medium w-28">Component</th>
              {models.map((m, i) => (
                <th key={m.slug} className="text-center py-2 px-2">
                  <span className="text-white font-medium">{m.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {SCORE_DIMENSIONS.map(dim => {
              const vals = models.map(m => m.score_components?.[dim.key] ?? 0);
              const max = Math.max(...vals);
              return (
                <tr key={dim.key}>
                  <td className="py-2 px-2 text-gray-500 font-medium">{dim.label}</td>
                  {models.map((m, i) => {
                    const val = m.score_components?.[dim.key];
                    const normalized = val != null ? Math.round(val) : 0;
                    const isWinner = val != null && val === max && max > 0;
                    return (
                      <td key={m.slug} className="py-2 px-2">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-2.5 bg-gray-800/80 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${normalized}%`,
                                backgroundColor: MODEL_COLORS[i],
                                boxShadow: `0 0 6px ${MODEL_GLOWS[i]}`,
                              }}
                            />
                          </div>
                          <span className={`text-[10px] font-medium ${isWinner ? 'text-white' : 'text-gray-400'}`}>
                            {val != null ? val.toFixed(1) : '—'}
                          </span>
                          {isWinner && <Crown className="w-3 h-3 text-yellow-400" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Community adjustment */}
            <tr>
              <td className="py-2 px-2 text-gray-500 font-medium">Community</td>
              {models.map((m) => {
                const val = m.score_components?.community;
                return (
                  <td key={m.slug} className="py-2 px-2 text-center">
                    <span className={`text-[10px] font-medium ${val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {val != null ? (val > 0 ? '+' : '') + val.toFixed(1) : '—'}
                    </span>
                  </td>
                );
              })}
            </tr>
            {/* Total */}
            <tr className="border-t-2 border-gray-700">
              <td className="py-2 px-2 text-white font-semibold">Total Score</td>
              {models.map(m => {
                const best = Math.max(...models.map(mm => mm.composite_score || 0));
                const isWinner = m.composite_score === best && best > 0;
                return (
                  <td key={m.slug} className="py-2 px-2 text-center">
                    <span className={`text-sm font-bold ${isWinner ? 'text-white' : scoreColor(m.composite_score || 0)}`}>
                      {m.composite_score?.toFixed(1) || '—'}
                    </span>
                    {isWinner && <Crown className="w-3 h-3 text-yellow-400 inline ml-1" />}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Task Performance Tab ─────────────────────────────────────────
function TaskPerformanceTab({ models, taskProfiles, selectedTask, setSelectedTask }) {
  const taskData = useMemo(() => {
    if (!selectedTask) return null;
    return models.map(m => ({
      slug: m.slug,
      name: m.name,
      ...m.task_estimates?.[selectedTask],
    }));
  }, [models, selectedTask]);

  const successData = useMemo(() => {
    if (!taskData) return [];
    return taskData
      .filter(d => d.success_rate != null)
      .map((d, i) => ({
        name: d.name.length > 18 ? d.name.substring(0, 16) + '…' : d.name,
        rate: Math.round((d.success_rate || 0) * 100),
        fill: MODEL_COLORS[i],
      }));
  }, [taskData]);

  if (!taskProfiles?.length) {
    return <p className="text-sm text-gray-500 mt-4">No task profiles available.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Task selector */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Select task type:</label>
        <div className="flex flex-wrap gap-2">
          {taskProfiles.map(tp => (
            <button
              key={tp.slug}
              onClick={() => setSelectedTask(tp.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedTask === tp.slug
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              {tp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Success rate bar chart */}
      {successData.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">First-Attempt Success Rate</h3>
          <ResponsiveContainer width="100%" height={Math.max(120, successData.length * 52 + 40)}>
            <BarChart data={successData} layout="vertical" margin={{ left: 10, right: 50 }} barGap={8}>
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={v => `${v}%`}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
                width={140}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '10px',
                  fontSize: '11px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
                formatter={(v) => [`${v}%`, 'Success Rate']}
              />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]} barSize={28} label={{
                position: 'right',
                fill: '#e2e8f0',
                fontSize: 12,
                fontWeight: 600,
                formatter: (v) => `${v}%`,
              }}>
                {successData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed metrics table */}
      {taskData && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-500 font-medium">Metric</th>
                  {taskData.map((d, i) => (
                    <th key={d.slug} className="text-center py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[i] }} />
                        <span className="text-white font-medium">{d.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                <TaskRow label="Success Rate" data={taskData} accessor={d => d.success_rate}
                  format={v => v != null ? `${Math.round(v * 100)}%` : '—'}
                  best={d => d.success_rate || 0} higher />
                <TaskRow label="Cost / Task" data={taskData} accessor={d => d.cost_per_task}
                  format={v => v != null ? `$${v.toFixed(3)}` : '—'}
                  best={d => d.cost_per_task || 999} />
                <TaskRow label="Avg Minutes" data={taskData} accessor={d => d.avg_minutes}
                  format={v => v != null ? `${v.toFixed(1)} min` : '—'}
                  best={d => d.avg_minutes || 999} />
                <TaskRow label="Avg Messages" data={taskData} accessor={d => d.avg_messages}
                  format={v => v != null ? v.toFixed(1) : '—'}
                  best={d => d.avg_messages || 999} />
                <TaskRow label="Autonomy" data={taskData} accessor={d => d.autonomy_score}
                  format={v => v != null ? `${v}/100` : '—'}
                  best={d => d.autonomy_score || 0} higher />
                <tr>
                  <td className="py-2.5 px-3 text-gray-500 font-medium">Steering</td>
                  {taskData.map(d => (
                    <td key={d.slug} className="py-2.5 px-3 text-center">
                      {d.steering_effort ? steeringBadge(d.steering_effort) : <span className="text-gray-600">—</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ label, data, accessor, format, best, higher = false }) {
  const vals = data.map(d => accessor(d)).filter(v => v != null);
  const bestVal = vals.length > 0 ? (higher ? Math.max(...vals) : Math.min(...vals)) : null;

  return (
    <tr>
      <td className="py-2.5 px-3 text-gray-500 font-medium">{label}</td>
      {data.map(d => {
        const val = accessor(d);
        const isWinner = val != null && val === bestVal && vals.length > 1;
        return (
          <td key={d.slug} className={`py-2.5 px-3 text-center font-medium ${isWinner ? 'text-white' : 'text-gray-300'}`}>
            <span className="inline-flex items-center gap-1">
              {format(val)}
              {isWinner && <Crown className="w-3 h-3 text-yellow-400" />}
            </span>
          </td>
        );
      })}
    </tr>
  );
}

// ── Availability Matrix Tab ──────────────────────────────────────
function AvailabilityMatrix({ models: rawModels }) {
  // Filter out BYOK entries from availability — only show subscription plans
  const models = useMemo(() =>
    rawModels.map(m => ({
      ...m,
      availability: (m.availability || []).filter(a => a.access_level !== 'byok' && !/byok/i.test(a.plan_name || '')),
    })),
  [rawModels]);

  // Collect all unique tools across all models
  const allTools = useMemo(() => {
    const toolMap = new Map();
    for (const m of models) {
      for (const a of (m.availability || [])) {
        if (!toolMap.has(a.tool_slug)) {
          toolMap.set(a.tool_slug, a.tool_name);
        }
      }
    }
    return [...toolMap.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [models]);

  // Find cheapest plan per model
  const cheapestPerModel = useMemo(() => {
    const result = {};
    for (const m of models) {
      const plans = (m.availability || []).filter(a => a.price_monthly != null);
      if (plans.length > 0) {
        result[m.slug] = Math.min(...plans.map(a => a.price_monthly));
      }
    }
    return result;
  }, [models]);

  if (allTools.length === 0) {
    return <p className="text-sm text-gray-500 mt-4">No availability data for these models.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Cheapest access summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {models.map((m, i) => {
          const cheapest = cheapestPerModel[m.slug];
          const cheapestPlan = (m.availability || []).find(a => a.price_monthly === cheapest);
          return (
            <div key={m.slug} className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[i] }} />
                <span className="text-xs font-semibold text-white truncate">{m.name}</span>
              </div>
              {cheapest != null ? (
                <>
                  <p className="text-lg font-bold text-green-400">{cheapest === 0 ? 'Free' : `$${cheapest}`}<span className="text-[10px] text-gray-500">/mo</span></p>
                  <p className="text-[10px] text-gray-500 truncate">{cheapestPlan?.tool_name} {cheapestPlan?.plan_name ? `· ${cheapestPlan.plan_name}` : ''}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-500">—</p>
                  <p className="text-[10px] text-gray-500">No subscription plans</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Full availability matrix */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-3 text-gray-500 font-medium w-32">Platform</th>
                {models.map((m, i) => (
                  <th key={m.slug} className="text-center py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[i] }} />
                      <span className="text-white font-medium">{m.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {allTools.map(([toolSlug, toolName]) => (
                <tr key={toolSlug}>
                  <td className="py-2.5 px-3 text-gray-400 font-medium">{toolName}</td>
                  {models.map(m => {
                    const plans = (m.availability || []).filter(a => a.tool_slug === toolSlug);
                    if (plans.length === 0) {
                      return <td key={m.slug} className="py-2.5 px-3 text-center text-gray-700">—</td>;
                    }
                    const cheapest = plans.reduce((min, p) => (p.price_monthly || 0) < (min.price_monthly || Infinity) ? p : min, plans[0]);
                    const isCheapestOverall = cheapest.price_monthly != null && cheapest.price_monthly === cheapestPerModel[m.slug];
                    return (
                      <td key={m.slug} className="py-2.5 px-3">
                        <div className="space-y-1">
                          {plans.slice(0, 2).map((p, j) => {
                            const isTop = p === cheapest && isCheapestOverall;
                            // Build cost detail string
                            let costDetail = '';
                            if (p.credits_per_request) {
                              costDetail = `${p.credits_per_request} credits/req`;
                            } else if (p.cost_notes) {
                              costDetail = p.cost_notes;
                            }
                            return (
                              <div key={j}>
                                <div className={`text-[10px] ${isTop ? 'text-green-400 font-semibold' : 'text-gray-400'}`}>
                                  {p.plan_name || 'Default'}{p.price_monthly != null ? ` $${p.price_monthly}/mo` : ''}
                                </div>
                                {costDetail && (
                                  <div className="text-[9px] text-gray-500 leading-tight">{costDetail}</div>
                                )}
                              </div>
                            );
                          })}
                          {plans.length > 2 && (
                            <div className="text-[9px] text-gray-600">+{plans.length - 2} more</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
  const largestContext = bestOf('context_window');

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-3 text-gray-500 font-medium w-32">Metric</th>
              {models.map((m, i) => (
                <th key={m.slug} className="text-center py-3 px-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[i] }} />
                    <div>
                      <p className="text-white font-semibold">{m.name}</p>
                      <p className="text-[10px] text-gray-500 font-normal">{m.vendor}</p>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            <CompRow label="AllThingsAI Score" models={models} accessor={m => m.composite_score}
              format={v => v?.toFixed(1) || '—'}
              highlight={v => v === bestComposite && bestComposite > 0}
            />
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
            <CompRow label="Context Window" models={models} accessor={m => m.context_window}
              format={v => v ? `${(v / 1000).toFixed(0)}K` : '—'}
              highlight={v => v === largestContext && largestContext > 0}
            />
            <CompRow label="Open Source" models={models} accessor={m => m.is_open_weight}
              format={v => v ? 'Yes' : 'No'}
            />

            {/* Community sentiment */}
            <tr>
              <td className="py-2.5 px-3 text-gray-500 font-medium">Community</td>
              {models.map(m => (
                <td key={m.slug} className="py-2.5 px-3 text-center">
                  {m.community ? (
                    <div className="space-y-0.5">
                      <div className={`text-xs font-bold ${scoreColor(m.community.satisfaction || 0)}`}>
                        {m.community.satisfaction || '—'}%
                      </div>
                      <div className="text-[9px] text-gray-500">
                        {m.community.total_reviews} reviews
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-600">No reviews</span>
                  )}
                </td>
              ))}
            </tr>

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
                    <div className="space-y-1.5">
                      {m.availability.slice(0, 4).map((a, i) => {
                        let cost = '';
                        if (a.credits_per_request) cost = `${a.credits_per_request} credits/req`;
                        else if (a.cost_notes) cost = a.cost_notes;
                        return (
                          <div key={i}>
                            <div className="text-[10px] text-gray-400">
                              {a.tool_name}{a.plan_name ? ` (${a.plan_name})` : ''}
                              {a.price_monthly ? <span className="text-green-400"> ${a.price_monthly}/mo</span> : null}
                            </div>
                            {cost && <div className="text-[9px] text-gray-500">{cost}</div>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-500">API only</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
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
            <span className="inline-flex items-center gap-1">
              {formatted}
              {isHighlighted && <Crown className="w-3 h-3 text-yellow-400" />}
            </span>
          </td>
        );
      })}
    </tr>
  );
}
