import { useState, useEffect, useMemo } from 'react';
import { setPageTitle } from '../lib/format.js';
import {
  Loader2, Search, Check, X, ArrowRight, TrendingDown,
  Zap, DollarSign, Cpu, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { useOptimizer, usePreferences } from '../lib/hooks.js';
import { api } from '../lib/api.js';

// Group models by vendor for the picker
function groupByVendor(models) {
  const groups = {};
  for (const m of models) {
    const v = m.vendor || 'Other';
    if (!groups[v]) groups[v] = [];
    groups[v].push(m);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function ModelChip({ model, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(model.slug)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        selected
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10'
          : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
      }`}
    >
      {selected && <Check className="w-3 h-3" />}
      {model.name}
      {model.composite_score != null && (
        <span className={`text-[10px] ml-0.5 ${selected ? 'text-blue-300/70' : 'text-gray-500'}`}>
          {Number(model.composite_score).toFixed(0)}
        </span>
      )}
    </button>
  );
}

function AvailabilityCard({ model }) {
  const [expanded, setExpanded] = useState(false);
  const available = model.available_on || [];
  const alts = model.alternatives || [];
  const cheapest = available.length > 0 ? available[0] : null; // already sorted by price

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden hover:border-gray-700 transition-colors">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">{model.name}</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">{model.vendor}</span>
            </div>
            {model.composite_score != null && (
              <div className="flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] text-gray-400">Quality: {Number(model.composite_score).toFixed(1)}/100</span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            {model.input_price != null && (
              <div className="text-[10px] text-gray-500">
                <span className="text-gray-300 font-mono">${model.input_price}</span> in
                {' / '}
                <span className="text-gray-300 font-mono">${model.output_price}</span> out
                <span className="text-gray-600 ml-0.5">/MTok</span>
              </div>
            )}
          </div>
        </div>

        {/* Where to use — availability */}
        {available.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Available on</p>
            <div className="grid grid-cols-1 gap-1.5">
              {available.slice(0, expanded ? 20 : 3).map((a, i) => (
                <div
                  key={`${a.tool_slug}-${a.plan}-${i}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                    i === 0
                      ? 'bg-green-500/5 border border-green-500/20'
                      : 'bg-gray-800/40 border border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-gray-500" />
                    <span className="text-white font-medium">{a.tool}</span>
                    {a.plan && <span className="text-gray-500">{a.plan}</span>}
                    {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">Cheapest</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {a.access_level && (
                      <span className="text-[10px] text-gray-500">{a.access_level}</span>
                    )}
                    <span className={`font-mono font-medium ${i === 0 ? 'text-green-400' : 'text-gray-400'}`}>
                      {a.price_monthly != null
                        ? `$${a.price_monthly}/mo`
                        : (a.reference_price_monthly != null ? `~$${a.reference_price_monthly}/mo (ref)` : '—')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {available.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors mt-1"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Show less' : `+${available.length - 3} more`}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No tool availability data yet</p>
        )}

        {/* Alternatives */}
        {alts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-800">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Cheaper alternatives
            </p>
            <div className="space-y-2">
              {alts.slice(0, 3).map((alt, i) => (
                <div
                  key={alt.slug || i}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800/30 border border-gray-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ArrowRight className="w-3 h-3 text-gray-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white font-medium truncate">{alt.name}</span>
                        <span className="text-[10px] text-gray-500">{alt.vendor}</span>
                      </div>
                      {alt.trade_off_notes && (
                        <p className="text-[10px] text-gray-500 truncate">{alt.trade_off_notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {alt.similarity != null && (
                      <span className="text-[10px] text-gray-500">{(alt.similarity * 100).toFixed(0)}% similar</span>
                    )}
                    {alt.cost_savings_pct != null && alt.cost_savings_pct > 0 && (
                      <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                        Save {alt.cost_savings_pct}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CostPage() {
  useEffect(() => { setPageTitle('Optimize Costs'); }, []);
  const { data, isLoading, error } = useOptimizer();
  const { data: prefsData } = usePreferences();

  const allModels = data?.models || [];

  // Load persisted selections from preferences
  const [selectedSlugs, setSelectedSlugs] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (prefsData && !initialized) {
      const prefs = Array.isArray(prefsData) ? prefsData : (prefsData?.preferences || []);
      const saved = prefs.find(p => p.key === 'selected_models');
      if (saved?.value) {
        try {
          const slugs = JSON.parse(saved.value);
          if (Array.isArray(slugs)) setSelectedSlugs(new Set(slugs));
        } catch {}
      }
      setInitialized(true);
    }
  }, [prefsData, initialized]);

  // Persist selections
  function toggleModel(slug) {
    setSelectedSlugs(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      // Persist async (fire-and-forget)
      api.updatePreferences({ key: 'selected_models', value: JSON.stringify([...next]) }).catch(() => {});
      return next;
    });
  }

  function selectAll() {
    const all = new Set(allModels.map(m => m.slug));
    setSelectedSlugs(all);
    api.updatePreferences({ key: 'selected_models', value: JSON.stringify([...all]) }).catch(() => {});
  }

  function clearAll() {
    setSelectedSlugs(new Set());
    api.updatePreferences({ key: 'selected_models', value: '[]' }).catch(() => {});
  }

  const vendorGroups = useMemo(() => groupByVendor(allModels), [allModels]);

  // Filter vendor groups by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return vendorGroups;
    const q = searchQuery.toLowerCase();
    return vendorGroups
      .map(([vendor, models]) => [vendor, models.filter(m =>
        m.name.toLowerCase().includes(q) || m.vendor.toLowerCase().includes(q) || m.slug.includes(q)
      )])
      .filter(([, models]) => models.length > 0);
  }, [vendorGroups, searchQuery]);

  const selectedModels = useMemo(() =>
    allModels.filter(m => selectedSlugs.has(m.slug)),
    [allModels, selectedSlugs]
  );

  // Stats
  const totalAlternatives = selectedModels.reduce((s, m) => s + (m.alternatives?.length || 0), 0);
  const maxSavings = selectedModels.reduce((max, m) => {
    const bestAlt = m.alternatives?.[0];
    return bestAlt?.cost_savings_pct > max ? bestAlt.cost_savings_pct : max;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm">Failed to load optimizer data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Optimize</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select the models you use, see where to get them, and find cheaper alternatives
        </p>
      </div>

      {/* Section A: Model Picker */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" /> Your Models
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">{selectedSlugs.size} selected</span>
            <button onClick={selectAll} className="text-[10px] text-blue-400 hover:text-blue-300">Select all</button>
            <span className="text-gray-700">|</span>
            <button onClick={clearAll} className="text-[10px] text-gray-400 hover:text-gray-300">Clear</button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Model chips grouped by vendor */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-3 max-h-80 overflow-y-auto">
          {filteredGroups.map(([vendor, models]) => (
            <div key={vendor}>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{vendor}</p>
              <div className="flex flex-wrap gap-1.5">
                {models.map(m => (
                  <ModelChip
                    key={m.slug}
                    model={m}
                    selected={selectedSlugs.has(m.slug)}
                    onToggle={toggleModel}
                  />
                ))}
              </div>
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No models match your search</p>
          )}
        </div>
      </section>

      {/* Stats bar */}
      {selectedSlugs.size > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
            <p className="text-2xl font-bold text-white">{selectedSlugs.size}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Models Selected</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{totalAlternatives}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Alternatives Found</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{maxSavings > 0 ? `${maxSavings}%` : '—'}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Max Savings</p>
          </div>
        </div>
      )}

      {/* Section B + C: Availability & Alternatives per selected model */}
      {selectedSlugs.size === 0 ? (
        <div className="text-center py-12 rounded-xl border border-gray-800 border-dashed">
          <DollarSign className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Select models above to see where to use them and find cheaper alternatives</p>
        </div>
      ) : (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" /> Where to Use & Alternatives
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {selectedModels.map(model => (
              <AvailabilityCard key={model.slug} model={model} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
