import { useState, useEffect } from 'react';
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Filter,
  Package,
  Check,
} from 'lucide-react';
import { api } from '../lib/api.js';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'ide', label: 'IDE' },
  { value: 'cli', label: 'CLI' },
  { value: 'agent', label: 'Agent' },
  { value: 'ide-plugin', label: 'IDE Plugin' },
  { value: 'platform', label: 'Platform' },
];

const CATEGORY_COLORS = {
  ide: 'bg-cyan/10 text-cyan border-cyan/30',
  cli: 'bg-neon/10 text-neon border-neon/30',
  agent: 'bg-hot/10 text-hot border-hot/30',
  'ide-plugin': 'bg-warn/10 text-warn border-warn/30',
  platform: 'bg-gold/10 text-gold border-gold/30',
};

function formatPrice(price) {
  if (price == null || price === 0) return 'Free';
  return `$${Number(price).toFixed(0)}/mo`;
}

function ToolCard({ tool }) {
  const [expanded, setExpanded] = useState(false);

  const plans = tool.plans ?? [];
  const prices = plans.map((p) => p.price_monthly ?? p.monthly_price ?? 0).filter((p) => p != null);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
  const modelsCount = tool.models_count ?? tool.models?.length ?? 0;
  const categoryColor = CATEGORY_COLORS[tool.category] || 'bg-elevated text-dim border-edge';

  return (
    <div className="card overflow-hidden hover:border-neon/20 transition-all duration-200 group">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-display font-semibold text-silver">{tool.name}</h3>
            {tool.vendor && <p className="text-xs text-dim mt-0.5">{tool.vendor}</p>}
          </div>
          <span className={`terminal-badge ${categoryColor}`}>
            {tool.category}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4 font-mono text-xs">
            {plans.length > 0 && (
              <div className="text-muted">
                {plans.map((p, i) => {
                  const price = p.price_monthly ?? p.monthly_price ?? 0;
                  const isLowest = price === lowestPrice;
                  return (
                    <span key={p.name || i} className={`${i > 0 ? 'ml-2' : ''}`}>
                      <span className={isLowest ? 'text-neon font-semibold' : ''}>
                        {formatPrice(price)}
                      </span>
                      {plans.length > 1 && (
                        <span className="text-dim ml-1 text-[10px]">{p.name}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          {modelsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-dim font-mono">
              <Cpu className="w-3 h-3" />
              <span>{modelsCount}</span>
            </div>
          )}
        </div>

        {plans.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-mono text-cyan hover:text-cyan-dim mt-3 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide plans' : `View ${plans.length} plan${plans.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {expanded && plans.length > 0 && (
        <div className="border-t border-edge px-4 py-3 bg-elevated/50">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th className="text-right">Monthly</th>
                <th className="text-right">Yearly</th>
                <th className="pl-4">Features</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, i) => (
                <tr key={(plan.plan_name || plan.name || i)}>
                  <td className="text-silver font-medium">{plan.plan_name || plan.name}</td>
                  <td className="text-right">
                    <span className={(plan.price_monthly || plan.monthly_price || 0) === lowestPrice ? 'text-neon' : 'text-muted'}>
                      {formatPrice(plan.price_monthly || plan.monthly_price)}
                    </span>
                  </td>
                  <td className="text-right text-muted">
                    {(plan.price_yearly || plan.yearly_price) != null ? `$${Number(plan.price_yearly || plan.yearly_price).toFixed(0)}/yr` : '--'}
                  </td>
                  <td className="pl-4">
                    {plan.features?.length > 0 ? (
                      <ul className="space-y-0.5">
                        {plan.features.map((f, fi) => (
                          <li key={fi} className="flex items-start gap-1 text-muted text-xs">
                            <Check className="w-3 h-3 text-neon mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-dim">--</span>
                    )}
                    {plan.models?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {plan.models.map((m) => (
                          <span key={m} className="terminal-badge bg-cyan/10 text-cyan border-cyan/30">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ToolsPage() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    async function loadTools() {
      try {
        const res = await api.getTools();
        setTools(res.tools ?? res.data ?? res ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }, []);

  const filtered = category === 'all' ? tools : tools.filter((t) => t.category === category);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-neon animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-hot text-sm font-mono">Failed to load tools: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-silver mb-1">Tools</h1>
      <p className="text-sm text-muted mb-6">AI coding tools and where to find them</p>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-dim" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`pill ${category === cat.value ? 'pill-active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 card border-dashed">
          <Package className="w-8 h-8 text-dim mx-auto mb-2" />
          <p className="text-sm text-dim font-mono">
            {tools.length === 0
              ? 'No tools tracked yet.'
              : `No tools in the "${category}" category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug || tool.id || tool.name} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
