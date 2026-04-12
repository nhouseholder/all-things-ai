import { useEffect, useMemo } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  Bot,
  CircleAlert,
  Clock3,
  ExternalLink,
  Globe,
  Loader2,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';
import { useCodingPlans } from '../lib/hooks.js';
import { setPageTitle } from '../lib/format.js';

const PROVIDER_THEMES = {
  'qwen-code': {
    border: 'border-cyan-400/30',
    glow: 'from-cyan-400/18 via-sky-400/8 to-transparent',
    badge: 'bg-cyan-400/12 text-cyan-200 border-cyan-400/25',
  },
  'kimi-k': {
    border: 'border-emerald-400/30',
    glow: 'from-emerald-400/18 via-lime-300/8 to-transparent',
    badge: 'bg-emerald-400/12 text-emerald-200 border-emerald-400/25',
  },
  'glm-coding': {
    border: 'border-fuchsia-400/30',
    glow: 'from-fuchsia-400/18 via-rose-400/8 to-transparent',
    badge: 'bg-fuchsia-400/12 text-fuchsia-200 border-fuchsia-400/25',
  },
  'minimax-coding': {
    border: 'border-amber-400/30',
    glow: 'from-amber-300/18 via-orange-300/8 to-transparent',
    badge: 'bg-amber-400/12 text-amber-100 border-amber-300/25',
  },
};

const PRICING_STATUS = {
  official: 'bg-emerald-400/12 text-emerald-200 border-emerald-400/25',
  reference: 'bg-amber-400/12 text-amber-100 border-amber-300/25',
  partial: 'bg-orange-400/12 text-orange-100 border-orange-300/25',
  unknown: 'bg-slate-400/12 text-slate-200 border-slate-400/25',
};

function getTheme(plan) {
  return PROVIDER_THEMES[plan.tool_slug] || {
    border: 'border-white/10',
    glow: 'from-white/12 via-white/4 to-transparent',
    badge: 'bg-white/8 text-white border-white/15',
  };
}

function getPriceAnchor(plan) {
  const value = Number(plan.price_anchor ?? plan.price_monthly ?? plan.comparison?.reference_price_monthly);
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function getList(value) {
  return Array.isArray(value) ? value : [];
}

function renderCellList(value, fallback = 'Not clearly documented') {
  const items = getList(value);
  if (!items.length) return fallback;
  return items.slice(0, 3).join(' · ');
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{detail}</p>
    </div>
  );
}

function PlanCard({ plan }) {
  const theme = getTheme(plan);
  const comparison = plan.comparison || {};
  const capabilitySignals = getList(plan.features?.features);
  const bestFor = getList(comparison.best_for);
  const tradeoffs = getList(comparison.tradeoffs);
  const ideSupport = getList(comparison.ide_support);
  const modelNames = (plan.model_pricing || []).map((model) => model.name || model.slug);

  return (
    <article className={`relative overflow-hidden rounded-[28px] border bg-slate-950/80 p-5 shadow-[0_28px_80px_rgba(2,6,23,0.45)] ${theme.border}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.glow}`} />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.badge}`}>
                <Sparkles className="h-3 w-3" />
                {plan.tool_name}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${PRICING_STATUS[plan.pricing_status] || PRICING_STATUS.unknown}`}>
                {plan.pricing_status}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{plan.plan_name}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              {comparison.capability_summary || plan.tool_description || 'Dedicated coding subscription tier.'}
            </p>
          </div>
          <div className="min-w-[160px] rounded-2xl border border-white/10 bg-black/20 p-4 text-right backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Monthly view</p>
            <p className="mt-2 text-3xl font-semibold text-white">{plan.price_display}</p>
            <p className="mt-1 text-xs text-slate-400">
              {comparison.model_anchor || comparison.flagship_model || modelNames[0] || 'Model not listed'}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {modelNames.slice(0, 3).map((name) => (
            <span key={name} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200">
              {name}
            </span>
          ))}
          {!modelNames.length && (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-400">
              Model availability not listed
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <Bot className="h-3.5 w-3.5 text-sky-300" /> Capability Signals
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {capabilitySignals.map((signal) => (
                <span key={signal} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-slate-200">
                  {signal}
                </span>
              ))}
            </div>
            {bestFor.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Best for</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {bestFor.map((item) => (
                    <span key={item} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-100">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {tradeoffs.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Tradeoffs</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {tradeoffs.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Globe className="h-3.5 w-3.5 text-cyan-200" /> IDE / Surface Support
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ideSupport.length > 0 ? ideSupport.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-slate-200">
                    {item}
                  </span>
                )) : (
                  <span className="text-sm text-slate-400">Public IDE support details were not clearly documented.</span>
                )}
              </div>
              {comparison.support_scope && (
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{comparison.support_scope}</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <Clock3 className="h-3.5 w-3.5 text-violet-200" /> Limits & Reset Logic
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">{comparison.limit_summary || 'Public limit details were not clearly documented.'}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Reset cadence</p>
                  <p className="mt-1 text-sm text-slate-200">{comparison.limit_reset || 'Not clearly documented'}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">When you hit the wall</p>
                  <p className="mt-1 text-sm text-slate-200">{comparison.overage_path || 'Verify current upgrade and fallback behavior before buying.'}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-200" />
              {plan.pricing_status === 'official' ? 'Official monthly tier captured' : 'Reference-priced until official checkout data is clearer'}
            </span>
            {comparison.sources_note && <span>{comparison.sources_note}</span>}
          </div>
          {(plan.pricing_page_url || plan.website_url) && (
            <a
              href={plan.pricing_page_url || plan.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Official page <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CodingPlansPage() {
  useEffect(() => {
    setPageTitle('Coding Plans');
  }, []);

  const { data, isLoading } = useCodingPlans();
  const plans = useMemo(() => {
    const items = data?.plans || [];
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => getPriceAnchor(a) - getPriceAnchor(b));
  }, [data]);

  const providers = useMemo(() => new Set(plans.map((plan) => plan.tool_slug)).size, [plans]);
  const officialPlans = useMemo(() => plans.filter((plan) => plan.pricing_status === 'official').length, [plans]);
  const lowestPlan = plans[0];
  const widestSupportPlan = useMemo(() => {
    return [...plans].sort((a, b) => getList(b.comparison?.ide_support).length - getList(a.comparison?.ide_support).length)[0];
  }, [plans]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(251,191,36,0.14),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-6 shadow-[0_32px_120px_rgba(2,6,23,0.55)] lg:p-8">
        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200/80">Dedicated Comparison</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white lg:text-5xl">
              Which coding subscription actually gives you more model and workflow headroom for the money?
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 lg:text-base">
              This page isolates public self-serve coding plans from Qwen, Kimi, GLM, and MiniMax, then compares them on the things that matter when you code every day: included frontier model access, limit behavior, reset logic, and how clearly each vendor documents IDE or tool support.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-200" />
                Reference-priced rows are labeled explicitly
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                <Workflow className="h-3.5 w-3.5 text-emerald-200" />
                Focused on coding workflow value, not API token pricing
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">How to read it</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex gap-2">
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                Official rows use confirmed monthly tier prices.
              </li>
              <li className="flex gap-2">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                Reference rows stay on the board only when capability and limit docs are still valuable.
              </li>
              <li className="flex gap-2">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                IDE support means what the vendor publicly documents, not what might work unofficially.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Providers in view"
          value={String(providers)}
          detail="Qwen, Kimi, GLM, and MiniMax on one board instead of scattered pricing pages."
        />
        <MetricCard
          label="Official monthly tiers"
          value={String(officialPlans)}
          detail="These are the rows where monthly checkout pricing was captured clearly enough to treat as official."
        />
        <MetricCard
          label="Lowest entry point"
          value={lowestPlan?.price_display || 'N/A'}
          detail={lowestPlan ? `${lowestPlan.tool_name} ${lowestPlan.plan_name}` : 'No plan data loaded.'}
        />
        <MetricCard
          label="Widest tool surface"
          value={widestSupportPlan ? `${getList(widestSupportPlan.comparison?.ide_support).length} surfaces` : 'N/A'}
          detail={widestSupportPlan ? `${widestSupportPlan.tool_name} documents the broadest IDE / CLI compatibility list.` : 'No plan data loaded.'}
        />
      </section>

      <section className="space-y-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-[0_28px_80px_rgba(2,6,23,0.4)]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Fast read matrix</h2>
          <p className="mt-1 text-sm text-slate-400">A compressed view of price confidence, model access, support surface, and limit behavior.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Support</th>
                <th className="px-4 py-3 font-medium">Limit style</th>
                <th className="px-4 py-3 font-medium">Good fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-slate-200">
              {plans.map((plan) => (
                <tr key={`${plan.tool_slug}-${plan.plan_name}`} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{plan.tool_name}</div>
                    <div className="text-xs text-slate-400">{plan.plan_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{plan.price_display}</div>
                    <div className="text-xs text-slate-400 capitalize">{plan.pricing_status}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {plan.comparison?.model_anchor || plan.comparison?.flagship_model || renderCellList((plan.model_pricing || []).map((model) => model.name))}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {renderCellList(plan.comparison?.ide_support, plan.comparison?.support_scope || 'Not clearly documented')}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {plan.comparison?.limit_summary || 'Not clearly documented'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {renderCellList(plan.comparison?.best_for, 'General coding access')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}