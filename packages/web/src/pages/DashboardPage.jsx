import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  X,
  Sparkles,
  TrendingDown,
  ArrowRightLeft,
  Layers,
  DollarSign,
  Loader2,
  Package,
  Cpu,
  Receipt,
} from 'lucide-react';
import { useToolPlans, useModels, useStackRecommendations } from '../lib/hooks.js';
import { setPageTitle } from '../lib/format.js';

const STORAGE_KEY = 'allthingsai.mystack.v1';

const emptyStack = () => ({
  plans: [],
  subscriptions: [],
  models: [],
  updatedAt: null,
});

function loadStack() {
  if (typeof window === 'undefined') return emptyStack();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStack();
    const parsed = JSON.parse(raw);
    return {
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
      models: Array.isArray(parsed.models) ? parsed.models : [],
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return emptyStack();
  }
}

function saveStack(stack) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stack, updatedAt: new Date().toISOString() }));
  } catch {
    // ignore quota / private mode
  }
}

const REC_ICONS = {
  consolidation: Layers,
  cheaper_alternative: ArrowRightLeft,
  price_drop: TrendingDown,
};

function formatRelative(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Plan picker ─────────────────────────────────────────────────────────
function PlanPicker({ availablePlans, onAdd, onCancel }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const base = availablePlans.slice().sort((a, b) => {
      const an = `${a.tool_name} ${a.plan_name}`;
      const bn = `${b.tool_name} ${b.plan_name}`;
      return an.localeCompare(bn);
    });
    if (!q) return base.slice(0, 50);
    return base
      .filter(p => `${p.tool_name} ${p.plan_name}`.toLowerCase().includes(q))
      .slice(0, 50);
  }, [availablePlans, query]);

  return (
    <div className="rounded-xl border border-blue-500/30 bg-gray-900/80 p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plans — e.g. Claude Code, Cursor, Copilot..."
          className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={onCancel}
          className="ml-2 text-gray-500 hover:text-gray-300 p-1"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-800/60">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-500 py-4 text-center">No matching plans</p>
        )}
        {filtered.map(plan => (
          <button
            key={plan.id}
            onClick={() => onAdd({
              toolSlug: plan.tool_slug,
              toolName: plan.tool_name,
              planName: plan.plan_name,
              monthlyCost: Number(plan.price_monthly ?? plan.price_anchor) || 0,
            })}
            className="w-full text-left py-2 px-1 hover:bg-gray-800/50 rounded transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-sm text-white">{plan.tool_name}</span>
              <span className="text-xs text-gray-500 ml-2">· {plan.plan_name}</span>
            </div>
            <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300">
              {plan.price_display || `$${Number(plan.price_monthly ?? plan.price_anchor) || 0}/mo`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Model picker ────────────────────────────────────────────────────────
function ModelPicker({ availableModels, selected, onAdd, onCancel }) {
  const [query, setQuery] = useState('');
  const selectedSet = new Set(selected);
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const base = availableModels
      .filter(m => !selectedSet.has(m.slug))
      .slice()
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (!q) return base.slice(0, 60);
    return base
      .filter(m => `${m.name} ${m.slug} ${m.vendor}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [availableModels, selected, query]);

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gray-900/80 p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models — e.g. Claude, GPT, Gemini..."
          className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={onCancel}
          className="ml-2 text-gray-500 hover:text-gray-300 p-1"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-800/60">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-500 py-4 text-center">No matching models</p>
        )}
        {filtered.map(model => (
          <button
            key={model.slug}
            onClick={() => onAdd(model.slug)}
            className="w-full text-left py-2 px-1 hover:bg-gray-800/50 rounded transition-colors flex items-center justify-between"
          >
            <span className="text-sm text-white">{model.name}</span>
            <span className="text-xs text-gray-500">{model.vendor}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Subscription input (free-text) ──────────────────────────────────────
function SubscriptionInput({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');

  const submit = () => {
    const n = name.trim();
    const c = Number(cost);
    if (!n || isNaN(c) || c < 0) return;
    onAdd({ name: n, cost: c });
    setName('');
    setCost('');
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gray-900/80 p-4 mb-3 flex items-center gap-2">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Subscription name (e.g. ChatGPT Plus)"
        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
      />
      <div className="relative">
        <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="20"
          className="w-24 bg-gray-950 border border-gray-800 rounded-lg pl-7 pr-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
        />
      </div>
      <button
        onClick={submit}
        className="px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors"
      >
        Add
      </button>
      <button
        onClick={onCancel}
        className="text-gray-500 hover:text-gray-300 p-1"
        aria-label="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Dashboard (My Stack) ───────────────────────────────────────────
export default function DashboardPage() {
  useEffect(() => { setPageTitle('My Stack — Dashboard'); }, []);

  const [stack, setStack] = useState(emptyStack);
  const [openPicker, setOpenPicker] = useState(null); // 'plan' | 'model' | 'sub' | null

  // Load on mount
  useEffect(() => { setStack(loadStack()); }, []);

  // Persist on change
  useEffect(() => {
    if (!stack.updatedAt && !stack.plans.length && !stack.subscriptions.length && !stack.models.length) return;
    saveStack(stack);
  }, [stack]);

  const plansQuery = useToolPlans();
  const modelsQuery = useModels();
  const recsQuery = useStackRecommendations({
    plans: stack.plans,
    subscriptions: stack.subscriptions,
    models: stack.models,
  });

  const availablePlans = plansQuery.data?.plans ?? [];
  const availableModels = (modelsQuery.data ?? []).filter(m => m.is_active !== 0);
  const modelBySlug = useMemo(() => {
    const m = {};
    for (const model of availableModels) m[model.slug] = model;
    return m;
  }, [availableModels]);

  const totalSpend = useMemo(() => {
    const p = stack.plans.reduce((s, x) => s + (Number(x.monthlyCost) || 0), 0);
    const s = stack.subscriptions.reduce((s, x) => s + (Number(x.cost) || 0), 0);
    return p + s;
  }, [stack]);

  const addPlan = (plan) => setStack(s => ({ ...s, plans: [...s.plans, plan] }));
  const removePlan = (idx) => setStack(s => ({ ...s, plans: s.plans.filter((_, i) => i !== idx) }));
  const addModel = (slug) => setStack(s => ({ ...s, models: s.models.includes(slug) ? s.models : [...s.models, slug] }));
  const removeModel = (slug) => setStack(s => ({ ...s, models: s.models.filter(x => x !== slug) }));
  const addSub = (sub) => { setStack(s => ({ ...s, subscriptions: [...s.subscriptions, sub] })); setOpenPicker(null); };
  const removeSub = (idx) => setStack(s => ({ ...s, subscriptions: s.subscriptions.filter((_, i) => i !== idx) }));

  const hasStack = stack.plans.length || stack.subscriptions.length || stack.models.length;
  const recs = recsQuery.data?.recommendations ?? [];
  const potentialSavings = recs.reduce((sum, r) => sum + (Number(r.savings) || 0), 0);

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Stack</h1>
          <p className="text-sm text-gray-500">
            Enter what you pay for — we'll find where you can save.
            {stack.updatedAt && <span className="text-gray-600 text-xs ml-2">· Updated {formatRelative(stack.updatedAt)}</span>}
          </p>
        </div>
        {hasStack && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Monthly spend</p>
            <p className="text-2xl font-bold text-white tabular-nums">${totalSpend.toFixed(2)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Stack input (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Plans card */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Your plans</h2>
                <span className="text-xs text-gray-500">({stack.plans.length})</span>
              </div>
              {openPicker !== 'plan' && (
                <button
                  onClick={() => setOpenPicker('plan')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add plan
                </button>
              )}
            </div>

            {openPicker === 'plan' && (
              plansQuery.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading plans catalog...
                </div>
              ) : (
                <PlanPicker
                  availablePlans={availablePlans}
                  onAdd={(plan) => { addPlan(plan); setOpenPicker(null); }}
                  onCancel={() => setOpenPicker(null)}
                />
              )
            )}

            {stack.plans.length === 0 && openPicker !== 'plan' && (
              <p className="text-xs text-gray-500 py-3">
                No plans yet. Add Claude Code, Cursor, Copilot, or any plan you subscribe to.
              </p>
            )}

            <ul className="divide-y divide-gray-800/60">
              {stack.plans.map((p, i) => (
                <li key={`${p.toolSlug}-${p.planName}-${i}`} className="flex items-center justify-between py-2.5">
                  <div>
                    <span className="text-sm text-white">{p.toolName}</span>
                    <span className="text-xs text-gray-500 ml-2">· {p.planName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-200 tabular-nums">${Number(p.monthlyCost).toFixed(2)}/mo</span>
                    <button
                      onClick={() => removePlan(i)}
                      className="text-gray-600 hover:text-red-400 p-1"
                      aria-label={`Remove ${p.toolName}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Subscriptions card */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Other subscriptions</h2>
                <span className="text-xs text-gray-500">({stack.subscriptions.length})</span>
              </div>
              {openPicker !== 'sub' && (
                <button
                  onClick={() => setOpenPicker('sub')}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add subscription
                </button>
              )}
            </div>

            {openPicker === 'sub' && (
              <SubscriptionInput onAdd={addSub} onCancel={() => setOpenPicker(null)} />
            )}

            {stack.subscriptions.length === 0 && openPicker !== 'sub' && (
              <p className="text-xs text-gray-500 py-3">
                Anything not in the plans catalog — ChatGPT Plus, Perplexity Pro, custom APIs.
              </p>
            )}

            <ul className="divide-y divide-gray-800/60">
              {stack.subscriptions.map((s, i) => (
                <li key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-white">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-200 tabular-nums">${Number(s.cost).toFixed(2)}/mo</span>
                    <button
                      onClick={() => removeSub(i)}
                      className="text-gray-600 hover:text-red-400 p-1"
                      aria-label={`Remove ${s.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Models card */}
          <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Models you use</h2>
                <span className="text-xs text-gray-500">({stack.models.length})</span>
              </div>
              {openPicker !== 'model' && (
                <button
                  onClick={() => setOpenPicker('model')}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add model
                </button>
              )}
            </div>

            {openPicker === 'model' && (
              modelsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading models...
                </div>
              ) : (
                <ModelPicker
                  availableModels={availableModels}
                  selected={stack.models}
                  onAdd={(slug) => { addModel(slug); setOpenPicker(null); }}
                  onCancel={() => setOpenPicker(null)}
                />
              )
            )}

            {stack.models.length === 0 && openPicker !== 'model' && (
              <p className="text-xs text-gray-500 py-3">
                Which models do you actually use day-to-day?
              </p>
            )}

            {stack.models.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stack.models.map(slug => {
                  const m = modelBySlug[slug];
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg px-2.5 py-1 text-xs"
                    >
                      {m?.name ?? slug}
                      <button
                        onClick={() => removeModel(slug)}
                        className="text-purple-400/60 hover:text-red-400"
                        aria-label={`Remove ${slug}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT: AI Recommendations (1 col, sticky on desktop) */}
        <aside className="lg:sticky lg:top-4 self-start">
          <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">AI bang for buck</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              {hasStack
                ? 'Ranked by potential monthly savings.'
                : 'Add plans and models above to get personalized recommendations.'}
            </p>

            {!hasStack && (
              <div className="py-8 text-center">
                <Layers className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Your stack is empty.</p>
              </div>
            )}

            {hasStack && recsQuery.isLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
                <Loader2 className="w-3 h-3 animate-spin" /> Analyzing your stack...
              </div>
            )}

            {hasStack && recsQuery.isError && (
              <p className="text-xs text-red-400 py-4">Could not load recommendations. Try again in a moment.</p>
            )}

            {hasStack && !recsQuery.isLoading && recs.length === 0 && (
              <p className="text-xs text-gray-500 py-4">
                Nothing obvious to optimize — your stack looks efficient.
              </p>
            )}

            {recs.length > 0 && (
              <>
                {potentialSavings > 0 && (
                  <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
                    <p className="text-xs text-green-300">
                      Up to <span className="font-bold text-green-400">${potentialSavings.toFixed(2)}/mo</span> in potential savings
                    </p>
                  </div>
                )}
                <ul className="space-y-3">
                  {recs.map((r, i) => {
                    const Icon = REC_ICONS[r.type] ?? Sparkles;
                    return (
                      <li key={i} className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
                        <div className="flex items-start gap-2.5">
                          <Icon className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white leading-snug">{r.title}</p>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{r.body}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
