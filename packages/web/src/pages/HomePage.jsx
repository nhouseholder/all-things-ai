import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  DollarSign,
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
  Code2,
  Wrench,
  Bug,
  FileCode,
  RefreshCcw,
  Search,
  BookOpen,
  Users,
} from 'lucide-react';
import { api } from '../lib/api.js';

const VERSION = 'v0.6.0';
const BUILD_DATE = 'Mar 24, 2026';

function compositeColor(score) {
  if (score >= 85) return 'text-neon';
  if (score >= 70) return 'text-cyan';
  if (score >= 55) return 'text-gold';
  return 'text-warn';
}

function compositeBarBg(score) {
  if (score >= 85) return 'bg-neon';
  if (score >= 70) return 'bg-cyan';
  if (score >= 55) return 'bg-gold';
  return 'bg-warn';
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
          <span className="terminal-badge">
            <Sparkles className="w-3 h-3" />
            Free &middot; Open &middot; Updated Daily
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon/10 border border-neon/20 text-[11px] font-medium text-neon">
            <Globe className="w-3 h-3" />
            Includes Free &amp; Open-Source Models
          </span>
        </div>

        {/* Title + version */}
        <div className="mb-6">
          <h1 className="text-4xl sm:text-5xl font-mono font-bold leading-tight mb-1">
            <span className="text-silver">The AI model guide</span>
            <br />
            <span className="text-neon glow-neon">
              for vibe coders
            </span>
          </h1>
          <p className="text-[10px] text-dim font-mono">
            <span className="terminal-badge text-[10px] py-0 px-1.5">{VERSION}</span>
            {' '}&middot; {BUILD_DATE}
          </p>
        </div>

        <p className="text-lg text-muted max-w-2xl mb-8 leading-relaxed font-sans">
          Pick your coding task. See which AI model wins on quality <em>and</em> cost.
          Find the cheapest tool to run it on &mdash; from free open-source models
          to premium APIs. Backed by benchmarks, real pricing, and developer signals.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/advisor"
            className="btn-neon group inline-flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            Find My Model
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/compare"
            className="btn-outline inline-flex items-center gap-2"
          >
            <Scale className="w-4 h-4" />
            Compare Models
          </Link>
          <Link
            to="/benchmarks"
            className="btn-ghost inline-flex items-center gap-2"
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
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-cyan" />
                <span className="text-xl font-mono font-bold text-silver">{modelCount}</span>
              </div>
              <p className="text-xs text-silver font-medium">AI Models Ranked</p>
              <p className="text-[10px] text-dim mt-0.5">incl. free & open-source</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-neon" />
                <span className="text-xl font-mono font-bold text-silver">10</span>
              </div>
              <p className="text-xs text-silver font-medium">Coding Tools</p>
              <p className="text-[10px] text-dim mt-0.5">Claude Code, Cursor, Copilot...</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-gold" />
                <span className="text-xl font-mono font-bold text-silver">{taskCount}</span>
              </div>
              <p className="text-xs text-silver font-medium">Task Categories</p>
              <p className="text-[10px] text-dim mt-0.5">debugging to boilerplate</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-hot" />
                <span className="text-xl font-mono font-bold text-silver">$0</span>
              </div>
              <p className="text-xs text-silver font-medium">Free Models</p>
              <p className="text-[10px] text-dim mt-0.5">DeepSeek, Z AI, Llama, Gemma</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Value Pillars ─────────────────────────────────────────── */}
      <section className="mb-12">
        <p className="section-label mb-4">Why vibe coders use this</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ValueCard
            icon={Brain}
            iconColor="text-cyan"
            iconBg="bg-cyan/10"
            title="Task-Matched Rankings"
            description="Select your coding task — complex debugging, feature implementation, refactoring — and see which model actually performs best for that specific workflow."
          />
          <ValueCard
            icon={DollarSign}
            iconColor="text-neon"
            iconBg="bg-neon/10"
            title="Real Pricing + Free Options"
            description="Every model shows token costs, tool pricing, and free alternatives. From $0 open-source models to premium APIs — find what fits your budget."
          />
          <ValueCard
            icon={Scale}
            iconColor="text-gold"
            iconBg="bg-gold/10"
            title="Like Opus? Try This Instead"
            description="Select any premium model and instantly see cheaper alternatives with similar capabilities. Save 50-95% without sacrificing much quality."
          />
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="mb-12">
        <p className="section-label mb-4">How It Works</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <StepCard number="1" title="Pick your task" description="Debugging? Feature building? Boilerplate? Each task has different winners." />
          <ChevronRight className="w-5 h-5 text-dim self-center hidden sm:block flex-shrink-0" />
          <StepCard number="2" title="Compare models" description="See success rates, cost per task, and quality scores side-by-side. Filter by free or budget." />
          <ChevronRight className="w-5 h-5 text-dim self-center hidden sm:block flex-shrink-0" />
          <StepCard number="3" title="Find where to use it" description="Every model shows which tools offer it and at what price. Pick the cheapest path." />
        </div>
      </section>

      {/* ── Quick Task Picker ─────────────────────────────────────── */}
      {tasks && tasks.length > 0 && (
        <section className="mb-12">
          <p className="section-label mb-4">What are you building?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tasks.map(task => {
              const Icon = TASK_ICONS[task.slug] || Code2;
              return (
                <Link
                  key={task.slug}
                  to={`/advisor?task=${task.slug}`}
                  className="group card p-4 hover:border-neon/30 hover:bg-neon/5 transition-all"
                >
                  <Icon className="w-5 h-5 text-dim group-hover:text-neon mb-2 transition-colors" />
                  <h3 className="text-xs font-semibold text-silver mb-0.5">{task.name}</h3>
                  <p className="text-[10px] text-dim leading-relaxed">
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
          <Loader2 className="w-6 h-6 text-neon animate-spin" />
        </div>
      ) : (
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MiniLeaderboard
              title="Best Overall"
              subtitle="by AllThingsAI composite score"
              icon={Trophy}
              iconColor="text-gold"
              headerBg="bg-gold/5"
              headerBorder="border-gold/20"
              models={topOverall}
              valueKey="composite_score"
              valueLabel="score"
              formatValue={(v) => Number(v).toFixed(1)}
            />

            <MiniLeaderboard
              title="Best Bang for Buck"
              subtitle="quality per dollar spent"
              icon={Coins}
              iconColor="text-neon"
              headerBg="bg-neon/5"
              headerBorder="border-neon/20"
              models={topValue}
              valueKey="value_score"
              valueLabel="value"
              formatValue={(v) => Number(v).toFixed(1)}
            />
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/advisor"
              className="inline-flex items-center gap-2 text-sm text-neon hover:text-cyan font-medium transition-colors"
            >
              See full rankings for all {modelCount} models
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Free & Budget Highlight ──────────────────────────────── */}
      <section className="mb-12">
        <div className="card-glow p-6 border-neon/20">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-neon" />
            <h2 className="text-lg font-mono font-bold text-silver">Free &amp; Open-Source Models</h2>
          </div>
          <p className="text-sm text-muted mb-4 max-w-lg font-sans">
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
              <div key={m.name} className="rounded-lg bg-elevated border border-edge p-3">
                <p className="text-xs font-semibold text-silver">{m.name}</p>
                <p className="text-[10px] text-dim mt-0.5">{m.note}</p>
                <p className="text-[10px] text-neon font-mono font-medium mt-1">{m.cost}</p>
              </div>
            ))}
          </div>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 text-xs text-neon hover:text-cyan font-medium transition-colors"
          >
            See all pricing tiers
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="rounded-2xl border border-edge bg-gradient-to-br from-surface via-surface to-neon/5 p-8 text-center">
          <h2 className="text-2xl font-mono font-bold text-silver mb-2">Stop overpaying for AI</h2>
          <p className="text-muted text-sm mb-6 max-w-lg mx-auto font-sans">
            Most vibe coders pick a model based on hype. Use our task-specific rankings
            to find the model that wins for <em>your</em> workflow — then find the cheapest place to use it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/advisor"
              className="btn-neon inline-flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Open Task Advisor
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/compare"
              className="btn-outline inline-flex items-center gap-2"
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

function ValueCard({ icon: Icon, iconColor, iconBg, title, description }) {
  return (
    <div className="card-glow p-5">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h3 className="text-sm font-mono font-semibold text-silver mb-1.5">{title}</h3>
      <p className="text-xs text-muted leading-relaxed font-sans">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="flex-1 card p-4">
      <div className="w-7 h-7 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center mb-3">
        <span className="text-xs font-mono font-bold text-neon">{number}</span>
      </div>
      <h3 className="text-sm font-mono font-semibold text-silver mb-1">{title}</h3>
      <p className="text-xs text-muted leading-relaxed font-sans">{description}</p>
    </div>
  );
}

function CommunityBadge({ reviews, sources }) {
  if (!reviews || reviews < 10) return null;
  const confidence = reviews >= 50 && sources >= 2 ? 'high' : reviews >= 25 ? 'medium' : 'low';
  const colors = {
    high: 'text-neon bg-neon/10 border-neon/20',
    medium: 'text-gold bg-gold/10 border-gold/20',
    low: 'text-dim bg-raised border-edge',
  };
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium border ${colors[confidence]}`} title={`${reviews} reviews from ${sources} sources`}>
      <Users className="w-2.5 h-2.5" />
      {reviews >= 1000 ? `${(reviews/1000).toFixed(1)}k` : reviews}
    </span>
  );
}

function MiniLeaderboard({ title, subtitle, icon: Icon, iconColor, headerBg, headerBorder, models, valueKey, valueLabel, formatValue }) {
  return (
    <div className="rounded-xl border border-edge overflow-hidden bg-surface">
      <div className={`${headerBg} border-b ${headerBorder} px-4 py-3`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <div>
            <h3 className="text-sm font-mono font-semibold text-silver">{title}</h3>
            <p className="text-[10px] text-dim">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-edge">
        {models.map((m, i) => {
          const score = m.composite_score ?? 0;
          return (
            <div key={m.model_slug} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`text-xs font-mono font-bold w-5 text-center ${i === 0 ? iconColor : 'text-dim'}`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-silver font-medium truncate">{m.model_name}</p>
                  <CommunityBadge reviews={m.community_reviews} sources={m.community_sources} />
                </div>
                <p className="text-[10px] text-dim">{m.vendor}{m.community_adjustment ? ` · community ${m.community_adjustment > 0 ? '+' : ''}${m.community_adjustment.toFixed(1)}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="score-bar w-16">
                  <div
                    className={`score-bar-fill ${compositeBarBg(score)}`}
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                </div>
                <span className={`text-xs font-mono font-bold tabular-nums ${compositeColor(score)}`}>
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
