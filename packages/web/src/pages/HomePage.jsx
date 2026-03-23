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
} from 'lucide-react';
import { api } from '../lib/api.js';

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
        // Non-critical — page still renders without live data
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
    <div className="max-w-4xl mx-auto">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-8 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-medium text-blue-400">
            <Sparkles className="w-3 h-3" />
            Free &middot; Open &middot; Updated Daily
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
          <span className="text-white">What model should</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            you actually use?
          </span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mb-8 leading-relaxed">
          Stop guessing. Pick your coding task, see which AI model wins on quality <em>and</em> cost,
          and find the cheapest tool to run it on.
          Backed by benchmarks, real pricing, and developer community signals.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/advisor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20"
          >
            <Target className="w-4 h-4" />
            Find My Model
            <ArrowRight className="w-4 h-4" />
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
          <div className="flex flex-wrap gap-6 px-5 py-4 rounded-xl border border-gray-800 bg-gray-900/50">
            <Stat value={modelCount} label="AI Models Ranked" icon={Brain} color="text-purple-400" />
            <Stat value={10} label="Coding Tools Tracked" icon={Zap} color="text-blue-400" />
            <Stat value={taskCount} label="Task Categories" icon={Target} color="text-cyan-400" />
            <Stat value={22} label="Pricing Plans Compared" icon={DollarSign} color="text-green-400" />
          </div>
        </section>
      )}

      {/* ── Value Pillars ─────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ValueCard
            icon={Brain}
            iconColor="text-purple-400"
            iconBg="bg-purple-500/10"
            title="Task-Matched Rankings"
            description="Select your coding task — complex debugging, feature implementation, refactoring — and see which model actually performs best."
          />
          <ValueCard
            icon={DollarSign}
            iconColor="text-green-400"
            iconBg="bg-green-500/10"
            title="Real Pricing, Not Marketing"
            description="Compare actual monthly costs across Claude Code, Cursor, Windsurf, Copilot, and more. Token prices included."
          />
          <ValueCard
            icon={TrendingUp}
            iconColor="text-cyan-400"
            iconBg="bg-cyan-500/10"
            title="Bang for Buck Scores"
            description="Our composite score per dollar metric. The one number that tells you which model gives you the most for your money."
          />
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">How It Works</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <StepCard number="1" title="Pick your task" description="Complex debugging? Boilerplate? Refactoring? Each task has different winners." />
          <ChevronRight className="w-5 h-5 text-gray-700 self-center hidden sm:block flex-shrink-0" />
          <StepCard number="2" title="Compare models" description="See first-attempt success rates, cost per task, and time to complete side-by-side." />
          <ChevronRight className="w-5 h-5 text-gray-700 self-center hidden sm:block flex-shrink-0" />
          <StepCard number="3" title="Find where to use it" description="Every model shows which tools offer it and at what price. Pick the cheapest path." />
        </div>
      </section>

      {/* ── Live Rankings Preview ─────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : (
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Overall */}
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

            {/* Best Bang for Buck */}
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

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/30 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Stop overpaying for AI</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Most developers pick a model based on hype, not data. Use our task-specific rankings
            to find the model that actually wins for your workflow — then find the cheapest place to use it.
          </p>
          <Link
            to="/advisor"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-500/20"
          >
            <Target className="w-4 h-4" />
            Open Task Intelligence Advisor
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function Stat({ value, label, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-[140px]">
      <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-[11px] text-gray-500">{label}</p>
      </div>
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
