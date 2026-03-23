import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Zap,
  Trophy,
  Coins,
  Loader2,
  ChevronRight,
  Sparkles,
  Target,
  BarChart3,
  Scale,
  Globe,
  Shield,
  Code2,
  Wrench,
  Bug,
  FileCode,
  RefreshCcw,
  Search,
  BookOpen,
} from 'lucide-react';
import { api } from '../lib/api.js';

const VERSION = 'v0.3.1';
const BUILD_DATE = 'Mar 23, 2026';

function compositeColor(score) {
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 55) return 'text-yellow-400';
  return 'text-orange-400';
}

function compositeBarBg(score) {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 55) return 'bg-yellow-500';
  return 'bg-orange-500';
}

const TASK_ICONS = {
  'complex-debugging': Bug,
  'feature-implementation': FileCode,
  'boilerplate-scaffolding': Code2,
  'quick-fixes': Zap,
  'multi-file-refactor': RefreshCcw,
  'code-review': Search,
  'learning-exploring': BookOpen,
};

export default function HomePage() {
  const [rankings, setRankings] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [rankingsRes, tasksRes] = await Promise.all([
          api.getRankings(),
          api.getTaskProfiles(),
        ]);
        setRankings(rankingsRes);
        setTasks(Array.isArray(tasksRes) ? tasksRes : tasksRes.tasks ?? []);
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const topOverall = rankings?.best_overall?.slice(0, 5) || [];
  const topValue = rankings?.bang_for_buck?.slice(0, 5) || [];
  const modelCount = rankings?.best_overall?.length || 0;
  const taskCount = tasks?.length || 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-6 pb-10">
        {/* Top bar with badges */}
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-400">
            <Sparkles className="w-3 h-3" />
            Free &middot; Open &middot; Updated Daily
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[11px] font-medium text-green-400">
            <Globe className="w-3 h-3" />
            Includes Free &amp; Open-Source Models
          </span>
        </div>

        {/* Title + version */}
        <div className="mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-1">
            <span className="text-white">The AI model guide</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              for vibe coders
            </span>
          </h1>
          <p className="text-[10px] text-gray-600 font-mono">{VERSION} &middot; {BUILD_DATE}</p>
        </div>

        <p className="text-lg text-gray-400 max-w-2xl mb-8 leading-relaxed">
          Pick your coding task. See which AI model wins on quality <em>and</em> cost.
          Find the cheapest tool to run it on &mdash; from free open-source models
          to premium APIs. Backed by benchmarks, real pricing, and developer signals.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/advisor"
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            <Target className="w-4 h-4" />
            Find My Model
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 font-medium text-sm transition-colors"
          >
            <Scale className="w-4 h-4" />
            Compare Models
          </Link>
          <Link
            to="/benchmarks"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-medium text-sm transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Browse Benchmarks
          </Link>
        </div>
      </section>

      {/* ── Live Stats Bar ────────────────────────────────────────── */}
      {!loading && (
        <section className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value={modelCount} label="AI Models Ranked" sublabel="incl. free & open-source" icon={Brain} color="text-purple-400" bg="bg-purple-500/5" border="border-purple-500/15" />
            <StatCard value={10} label="Coding Tools" sublabel="Claude Code, Cursor, Copilot..." icon={Wrench} color="text-blue-400" bg="bg-blue-500/5" border="border-blue-500/15" />
            <StatCard value={taskCount} label="Task Categories" sublabel="debugging to boilerplate" icon={Target} color="text-cyan-400" bg="bg-cyan-500/5" border="border-cyan-500/15" />
            <StatCard value="$0" label="Free Models" sublabel="DeepSeek, Z AI, Llama, Gemma" icon={DollarSign} color="text-green-400" bg="bg-green-500/5" border="border-green-500/15" />
          </div>
        </section>
      )}

      {/* ── Value Pillars ─────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Why vibe coders use this</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ValueCard
            icon={Brain}
            iconColor="text-purple-400"
            iconBg="bg-purple-500/10"
            title="Task-Matched Rankings"
            description="Select your coding task — complex debugging, feature implementation, refactoring — and see which model actually performs best for that specific workflow."
          />
          <ValueCard
            icon={DollarSign}
            iconColor="text-green-400"
            iconBg="bg-green-500/10"
            title="Real Pricing + Free Options"
            description="Every model shows token costs, tool pricing, and free alternatives. From $0 open-source models to premium APIs — find what fits your budget."
          />
          <ValueCard
            icon={Scale}
            iconColor="text-cyan-400"
            iconBg="bg-cyan-500/10"
            title="Like Opus? Try This Instead"
            description="Select any premium model and instantly see cheaper alternatives with similar capabilities. Save 50-95% without sacrificing much quality."
          />
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">How It Works</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <StepCard number="1" title="Pick your task" description="Debugging? Feature building? Boilerplate? Each task has different winners." />
          <ChevronRight className="w-5 h-5 text-gray-700 self-center hidden sm:block flex-shrink-0" />
          <StepCard number="2" title="Compare models" description="See success rates, cost per task, and quality scores side-by-side. Filter by free or budget." />
          <ChevronRight className="w-5 h-5 text-gray-700 self-center hidden sm:block flex-shrink-0" />
          <StepCard number="3" title="Find where to use it" description="Every model shows which tools offer it and at what price. Pick the cheapest path." />
        </div>
      </section>

      {/* ── Quick Task Picker ─────────────────────────────────────── */}
      {tasks && tasks.length > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">What are you building?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tasks.map(task => {
              const Icon = TASK_ICONS[task.slug] || Code2;
              return (
                <Link
                  key={task.slug}
                  to={`/advisor?task=${task.slug}`}
                  className="group rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                >
                  <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-400 mb-2 transition-colors" />
                  <h3 className="text-xs font-semibold text-white mb-0.5">{task.name}</h3>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    {task.complexity ? `${task.complexity} complexity` : 'See top models'}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Live Rankings Preview ─────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : (
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MiniLeaderboard
              title="Best Overall"
              subtitle="by AllThingsAI composite score"
              icon={Trophy}
              iconColor="text-yellow-400"
              headerBg="bg-yellow-500/5"
              headerBorder="border-yellow-500/20"
              models={topOverall}
              valueKey="composite_score"
              valueLabel="score"
              formatValue={(v) => Number(v).toFixed(1)}
            />

            <MiniLeaderboard
              title="Best Bang for Buck"
              subtitle="quality per dollar spent"
              icon={Coins}
              iconColor="text-green-400"
              headerBg="bg-green-500/5"
              headerBorder="border-green-500/20"
              models={topValue}
              valueKey="value_score"
              valueLabel="value"
              formatValue={(v) => Number(v).toFixed(1)}
            />
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/advisor"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              See full rankings for all {modelCount} models
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Free & Budget Highlight ──────────────────────────────── */}
      <section className="mb-12">
        <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-950/20 via-gray-900 to-gray-900 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-white">Free &amp; Open-Source Models</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4 max-w-lg">
            Not every project needs a $100/mo subscription. These models are free or nearly free
            and competitive enough for many coding tasks.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { name: 'DeepSeek R1', note: 'Reasoning rival to o3', cost: '$0.55/MTok' },
              { name: 'DeepSeek V3', note: 'Best free all-rounder', cost: '$0.27/MTok' },
              { name: 'Llama 4 Maverick', note: 'Meta open-weight', cost: '$0.20/MTok' },
              { name: 'Z AI GLM-5', note: 'Totally free API', cost: 'Free' },
            ].map(m => (
              <div key={m.name} className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-3">
                <p className="text-xs font-semibold text-white">{m.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{m.note}</p>
                <p className="text-[10px] text-green-400 font-medium mt-1">{m.cost}</p>
              </div>
            ))}
          </div>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
          >
            See all pricing tiers
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Stop overpaying for AI</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Most vibe coders pick a model based on hype. Use our task-specific rankings
            to find the model that wins for <em>your</em> workflow — then find the cheapest place to use it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/advisor"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20"
            >
              <Target className="w-4 h-4" />
              Open Task Advisor
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/compare"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-medium text-sm transition-colors"
            >
              <Scale className="w-4 h-4" />
              Find Alternatives
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function StatCard({ value, label, sublabel, icon: Icon, color, bg, border }) {
  return (
    <div className={`rounded-xl ${bg} border ${border} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-xl font-bold text-white`}>{value}</span>
      </div>
      <p className="text-xs text-gray-300 font-medium">{label}</p>
      {sublabel && <p className="text-[10px] text-gray-500 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function ValueCard({ icon: Icon, iconColor, iconBg, title, description }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 transition-colors">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-3">
        <span className="text-xs font-bold text-blue-400">{number}</span>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function MiniLeaderboard({ title, subtitle, icon: Icon, iconColor, headerBg, headerBorder, models, valueKey, valueLabel, formatValue }) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      <div className={`${headerBg} border-b ${headerBorder} px-4 py-3`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-[10px] text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-800">
        {models.map((m, i) => {
          const score = m.composite_score ?? 0;
          return (
            <div key={m.model_slug} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`text-xs font-bold w-5 text-center ${i === 0 ? iconColor : 'text-gray-500'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{m.model_name}</p>
                <p className="text-[10px] text-gray-500">{m.vendor}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${compositeBarBg(score)}`}
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
                <span className={`text-xs font-bold tabular-nums ${compositeColor(score)}`}>
                  {formatValue(m[valueKey])}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
