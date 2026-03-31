import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BarChart3,
  Brain,
  ChevronRight,
  Crown,
  DollarSign,
  ExternalLink,
  Globe,
  MessageSquare,
  Scale,
  Shield,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import ChartContainer from '../components/ChartContainer.jsx';
import { api } from '../lib/api.js';
import { compositeColor, compositeBarBg, setPageTitle, timeAgo } from '../lib/format.js';
import { quartileColor } from '../lib/chart-utils.js';

const SCORE_COMPONENTS = [
  { key: 'swe_bench_component', label: 'SWE-bench', weight: '25%' },
  { key: 'livecodebench_component', label: 'LiveCodeBench', weight: '15%' },
  { key: 'nuance_component', label: 'Human Nuance', weight: '20%' },
  { key: 'arena_component', label: 'Arena ELO', weight: '10%' },
  { key: 'tau_component', label: 'TAU-bench', weight: '10%' },
  { key: 'gpqa_component', label: 'GPQA', weight: '10%' },
  { key: 'success_rate_component', label: 'Success Rate', weight: '10%' },
];

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
    low: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30', label: 'Low steering' },
    medium: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Medium steering' },
    high: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', label: 'High steering' },
  };
  const s = map[effort] || map.medium;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border}`}>
      {s.label}
    </span>
  );
}

function formatPrice(val) {
  if (val == null) return '—';
  if (val === 0) return 'Free';
  return `$${Number(val).toFixed(2)}`;
}

function formatCompact(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(val);
}

export default function ModelDetailPage() {
  const { slug } = useParams();
  const { data: model, isLoading, error } = useQuery({
    queryKey: ['model', slug],
    queryFn: () => api.getModel(slug),
    enabled: !!slug,
  });

  useEffect(() => {
    if (model?.name) setPageTitle(model.name);
    else setPageTitle('Model Details');
  }, [model?.name]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded mb-4" />
        <div className="h-4 w-96 bg-gray-800/50 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-800/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="text-center py-16">
        <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Model not found</h2>
        <p className="text-gray-400 text-sm mb-4">No model found with slug "{slug}"</p>
        <Link to="/advisor" className="text-blue-400 hover:text-blue-300 text-sm">
          Browse all models
        </Link>
      </div>
    );
  }

  const benchmarks = model.benchmarks || [];
  const availability = model.availability || [];
  const community = model.community || {};
  const taskEstimates = model.task_estimates || [];
  const alternatives = model.alternatives || [];
  const compositeScore = model.composite_score;
  const openrouter = model.openrouter;
  const vibeProfile = model.vibe_coder_profile;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Back nav */}
      <Link to="/advisor" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All Models
      </Link>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-white truncate">{model.name}</h1>
              {model.is_open_weight && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap">
                  Open Weight
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {model.vendor} · {model.family}
              {model.context_window && ` · ${(model.context_window / 1000).toFixed(0)}K context`}
              {model.params_total && ` · ${model.params_total}B params`}
            </p>
            {model.score_updated_at && (
              <p className="text-[10px] text-gray-500 mt-1">
                Scores updated {timeAgo(model.score_updated_at)}
              </p>
            )}
          </div>

          {/* Composite score ring */}
          {compositeScore != null && (
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${
                compositeScore >= 85 ? 'border-green-500' :
                compositeScore >= 70 ? 'border-blue-500' :
                compositeScore >= 55 ? 'border-yellow-500' : 'border-orange-500'
              }`}>
                <span className={`text-2xl font-bold ${scoreColor(compositeScore)}`}>
                  {Number(compositeScore).toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">Composite Score</span>
            </div>
          )}
        </div>

        {/* Quick stat pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {model.input_price_per_mtok != null && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
              <DollarSign className="w-3 h-3 text-green-400" />
              ${model.input_price_per_mtok} / ${model.output_price_per_mtok} per MTok
            </span>
          )}
          {model.blended_cost_per_mtok != null && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
              <Scale className="w-3 h-3 text-cyan-400" />
              ${model.blended_cost_per_mtok.toFixed(2)} blended
            </span>
          )}
          {community.total_reviews > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
              <Users className="w-3 h-3 text-purple-400" />
              {community.total_reviews} reviews ({community.source_count} sources)
            </span>
          )}
          {availability.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
              <Zap className="w-3 h-3 text-yellow-400" />
              Available on {availability.length} plans
            </span>
          )}
          {vibeProfile?.score != null && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Vibe fit {vibeProfile.score.toFixed(1)}
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2/3) ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Score Breakdown */}
          {compositeScore != null && (
            <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Score Breakdown
              </h2>
              <div className="space-y-2">
                {SCORE_COMPONENTS.map(sc => {
                  const val = model[sc.key];
                  if (val == null) return null;
                  const rounded = Number(val).toFixed(1);
                  return (
                    <div key={sc.key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-28 shrink-0">{sc.label}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreBarBg(val)}`}
                          style={{ width: `${Math.min(100, val)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold tabular-nums w-10 text-right ${scoreColor(val)}`}>
                        {rounded}
                      </span>
                      <span className="text-[10px] text-gray-600 w-8">{sc.weight}</span>
                    </div>
                  );
                })}
                {model.community_adjustment != null && model.community_adjustment !== 0 && (
                  <div className="flex items-center gap-3 pt-1 border-t border-gray-800/50 mt-2">
                    <span className="text-xs text-gray-500 w-28 shrink-0">Community Adj.</span>
                    <span className={`text-xs font-semibold ${model.community_adjustment > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {model.community_adjustment > 0 ? '+' : ''}{Number(model.community_adjustment).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Benchmarks */}
          {benchmarks.length > 0 && (
            <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Raw Benchmark Scores
              </h2>
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-800/50">
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">Benchmark</th>
                        <th className="text-left px-3 py-2 text-gray-400 font-medium">Category</th>
                        <th className="text-right px-3 py-2 text-gray-400 font-medium">Score</th>
                        <th className="text-right px-3 py-2 text-gray-400 font-medium">Max</th>
                        <th className="px-3 py-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {benchmarks.map((b, i) => {
                        const pct = b.max_score ? (b.score / b.max_score) * 100 : b.score;
                        return (
                          <tr key={i} className="hover:bg-gray-800/30">
                            <td className="px-3 py-2 text-white font-medium">{b.benchmark_name}</td>
                            <td className="px-3 py-2 text-gray-400 capitalize">{b.category}</td>
                            <td className="px-3 py-2 text-right text-white tabular-nums">{Number(b.score).toFixed(1)}</td>
                            <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{b.max_score || '—'}</td>
                            <td className="px-3 py-2">
                              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${scoreBarBg(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Task Performance */}
          {taskEstimates.length > 0 && (
            <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Task Performance
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {taskEstimates.map(t => {
                  const successPct = t.first_attempt_success_rate != null
                    ? Math.round(t.first_attempt_success_rate * 100)
                    : null;
                  return (
                    <div key={t.task_slug} className="rounded-lg border border-gray-800 p-3 hover:border-gray-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-white">{t.task_name}</h3>
                        {t.steering_effort && steeringBadge(t.steering_effort)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {successPct != null && (
                          <div>
                            <span className="text-gray-500">Success rate</span>
                            <p className={`font-semibold ${scoreColor(successPct)}`}>{successPct}%</p>
                          </div>
                        )}
                        {t.cost_per_task_estimate != null && (
                          <div>
                            <span className="text-gray-500">Cost/task</span>
                            <p className="text-white font-semibold">${Number(t.cost_per_task_estimate).toFixed(2)}</p>
                          </div>
                        )}
                        {t.avg_messages_to_complete != null && (
                          <div>
                            <span className="text-gray-500">Avg messages</span>
                            <p className="text-gray-300 font-medium">{Number(t.avg_messages_to_complete).toFixed(1)}</p>
                          </div>
                        )}
                        {t.autonomy_score != null && (
                          <div>
                            <span className="text-gray-500">Autonomy</span>
                            <p className="text-gray-300 font-medium">{Number(t.autonomy_score).toFixed(0)}/100</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── Right Column (1/3) ─────────────────────────────── */}
        <div className="space-y-6">

          {/* Vibe Coder Fit */}
          {vibeProfile?.score != null && (
            <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Vibe Coder Fit
              </h2>
              <div className="flex items-end justify-between gap-3 mb-3">
                <div>
                  <p className="text-2xl font-bold text-white">{vibeProfile.score.toFixed(1)}</p>
                  <p className="text-xs text-purple-400">{vibeProfile.label}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  vibeProfile.price_tier === 'budget'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : vibeProfile.price_tier === 'balanced'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}>
                  {vibeProfile.price_tier}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{vibeProfile.summary}</p>
              {vibeProfile.badges?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {vibeProfile.badges.map((badge) => (
                    <span key={badge} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/15">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
              {vibeProfile.cautions?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider">Watch-outs</p>
                  <div className="space-y-1">
                    {vibeProfile.cautions.map((item) => (
                      <p key={item} className="text-[11px] text-gray-400">{item}</p>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Pricing */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Input</span>
                <span className="text-white font-medium">{formatPrice(model.input_price_per_mtok)}/MTok</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Output</span>
                <span className="text-white font-medium">{formatPrice(model.output_price_per_mtok)}/MTok</span>
              </div>
              {model.cache_hit_price_per_mtok != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cache Hit</span>
                  <span className="text-white font-medium">{formatPrice(model.cache_hit_price_per_mtok)}/MTok</span>
                </div>
              )}
              {model.blended_cost_per_mtok != null && (
                <div className="flex justify-between pt-2 border-t border-gray-800">
                  <span className="text-gray-400 font-medium">Blended (30/70)</span>
                  <span className="text-cyan-400 font-semibold">${model.blended_cost_per_mtok.toFixed(2)}/MTok</span>
                </div>
              )}
            </div>
          </section>

          {/* OpenRouter Signals */}
          {openrouter && (
            <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                OpenRouter Signals
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Daily activity</span>
                  <span className="text-white font-medium">{formatCompact(openrouter.total_activity_tokens_daily)} tokens</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Prompt / completion</span>
                  <span className="text-white font-medium">
                    {formatCompact(openrouter.prompt_tokens_daily)} / {formatCompact(openrouter.completion_tokens_daily)}
                  </span>
                </div>
                {openrouter.reasoning_tokens_daily != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Reasoning tokens</span>
                    <span className="text-white font-medium">{formatCompact(openrouter.reasoning_tokens_daily)}</span>
                  </div>
                )}
                {openrouter.max_completion_tokens != null && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Max completion</span>
                    <span className="text-white font-medium">{formatCompact(openrouter.max_completion_tokens)}</span>
                  </div>
                )}
                {openrouter.knowledge_cutoff && (
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">Knowledge cutoff</span>
                    <span className="text-white font-medium">{openrouter.knowledge_cutoff}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(openrouter.input_modalities || []).map((modality) => (
                  <span key={modality} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                    {modality} input
                  </span>
                ))}
                {openrouter.supports_tools ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    tools
                  </span>
                ) : null}
                {openrouter.supports_structured_outputs ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    structured outputs
                  </span>
                ) : null}
                {openrouter.supports_reasoning ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    reasoning
                  </span>
                ) : null}
              </div>
            </section>
          )}

          {/* Where to Use */}
          {availability.length > 0 && (
            <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Where to Use
              </h2>
              <div className="space-y-2">
                {availability.map((a, i) => (
                  <div key={i} className="rounded-lg border border-gray-800 p-3 hover:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">{a.tool_name}</span>
                      <span className="text-xs text-green-400 font-semibold">
                        {a.price_monthly != null ? `$${a.price_monthly}/mo` : 'BYOK'}
                      </span>
                    </div>
                    {a.plan_name && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{a.plan_name}</p>
                    )}
                    {a.cost_notes && (
                      <p className="text-[10px] text-gray-400 mt-1">{a.cost_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Community */}
          {community.total_reviews > 0 && (
            <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Community
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total reviews</span>
                  <span className="text-white font-medium">{community.total_reviews}</span>
                </div>
                {community.satisfaction != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Satisfaction</span>
                    <span className="text-white font-medium">{community.satisfaction}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Sources</span>
                  <span className="text-white font-medium">{community.source_count}</span>
                </div>
                {/* User type breakdown */}
                {(community.heavy_coder_count > 0 || community.vibe_coder_count > 0 || community.casual_count > 0) && (
                  <div className="pt-2 border-t border-gray-800">
                    <p className="text-[10px] text-gray-500 mb-2">Reviewer breakdown</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Heavy coders', count: community.heavy_coder_count, color: 'bg-purple-500' },
                        { label: 'Vibe coders', count: community.vibe_coder_count, color: 'bg-blue-500' },
                        { label: 'Casual users', count: community.casual_count, color: 'bg-gray-500' },
                      ].map(({ label, count, color }) => {
                        const total = community.heavy_coder_count + community.vibe_coder_count + community.casual_count;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 w-20 shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400 w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Alternatives
              </h2>
              <div className="space-y-2">
                {alternatives.map((alt, i) => (
                  <Link
                    key={alt.slug}
                    to={`/models/${alt.slug}`}
                    className="block rounded-lg border border-gray-800 p-3 hover:border-gray-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">{alt.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{alt.vendor}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {alt.similarity_score != null && (
                        <span className="text-[10px] text-gray-400">{Math.round(alt.similarity_score * 100)}% similar</span>
                      )}
                      {alt.cost_savings_pct != null && alt.cost_savings_pct > 0 && (
                        <span className="text-[10px] text-green-400">Save {Math.round(alt.cost_savings_pct)}%</span>
                      )}
                      {alt.composite_score != null && (
                        <span className={`text-[10px] font-medium ${scoreColor(alt.composite_score)}`}>
                          {Number(alt.composite_score).toFixed(1)}
                        </span>
                      )}
                    </div>
                    {alt.trade_off_notes && (
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{alt.trade_off_notes}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Link
              to={`/compare?models=${slug}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
            >
              <Scale className="w-3.5 h-3.5" />
              Compare with other models
            </Link>
            <Link
              to="/advisor/chat"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask the AI Advisor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
