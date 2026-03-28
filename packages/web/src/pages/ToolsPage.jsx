import { useState } from 'react';
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Filter,
  Package,
  Check,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useTools, useToolRankings } from '../lib/hooks.js';
import RankingChart from '../components/RankingChart.jsx';

const TOOL_DIMENSIONS = [
  { key: 'model_breadth_score', label: 'Model Breadth', color: 'bg-purple-500' },
  { key: 'pricing_score', label: 'Pricing', color: 'bg-green-500' },
  { key: 'community_score', label: 'Community', color: 'bg-blue-500' },
  { key: 'feature_score', label: 'Features', color: 'bg-cyan-500' },
  { key: 'freshness_score', label: 'Freshness', color: 'bg-yellow-500' },
];

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'ide', label: 'IDE' },
  { value: 'cli', label: 'CLI' },
  { value: 'agent', label: 'Agent' },
  { value: 'ide-plugin', label: 'IDE Plugin' },
  { value: 'platform', label: 'Platform' },
];

const CATEGORY_COLORS = {
  ide: 'bg-blue-500/10 text-blue-400',
  cli: 'bg-green-500/10 text-green-400',
  agent: 'bg-purple-500/10 text-purple-400',
  'ide-plugin': 'bg-orange-500/10 text-orange-400',
  platform: 'bg-cyan-500/10 text-cyan-400',
};

function formatPrice(price) {
  if (price == null || price === 0) return 'Free';
  return `$${Number(price).toFixed(0)}/mo`;
}

const INSTALL_METHOD_LABELS = {
  download: 'Download',
  npm: 'npm install',
  pip: 'pip install',
  brew: 'Homebrew',
  marketplace: 'VS Code Marketplace',
  web: 'Web App',
};

function ToolCard({ tool }) {
  const [expanded, setExpanded] = useState(false);

  const plans = tool.plans ?? [];
  const prices = plans.map((p) => p.price_monthly ?? p.monthly_price ?? 0).filter((p) => p != null);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;
  const categoryColor = CATEGORY_COLORS[tool.category] || 'bg-gray-500/10 text-gray-400';

  // Collect unique models across all plans
  const allModels = [...new Set(plans.flatMap(p => {
    if (!p.models_included) return [];
    const parsed = typeof p.models_included === 'string' ? JSON.parse(p.models_included) : p.models_included;
    return parsed || [];
  }))];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden hover:border-gray-700 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
            {tool.vendor && <p className="text-xs text-gray-500 mt-0.5">{tool.vendor}</p>}
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${categoryColor}`}>
            {tool.category}
          </span>
        </div>

        {/* Description */}
        {tool.description && (
          <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{tool.description}</p>
        )}

        {/* Pricing row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {plans.length > 0 && (
              <div className="text-xs text-gray-400">
                {plans.map((p, i) => {
                  const price = p.price_monthly ?? p.monthly_price ?? 0;
                  const isLowest = price === lowestPrice;
                  return (
                    <span key={p.name || i} className={`${i > 0 ? 'ml-2' : ''}`}>
                      <span className={isLowest ? 'text-green-400 font-medium' : ''}>
                        {formatPrice(price)}
                      </span>
                      {plans.length > 1 && (
                        <span className="text-gray-500 ml-1 text-[10px]">{p.plan_name || p.name}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Compatible models */}
        {allModels.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {allModels.filter(m => m !== 'any-via-api').slice(0, 6).map(m => (
                <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                  {m}
                </span>
              ))}
              {allModels.length > 6 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
                  +{allModels.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Install + expand row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            {tool.install_url && (
              <a
                href={tool.install_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Download className="w-3 h-3" />
                {INSTALL_METHOD_LABELS[tool.install_method] || 'Install'}
              </a>
            )}
            {tool.website_url && (
              <a
                href={tool.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Website
              </a>
            )}
          </div>
          {plans.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide plans' : `${plans.length} plan${plans.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>

      {expanded && plans.length > 0 && (
        <div className="border-t border-gray-800 px-4 py-3 bg-gray-900/80">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2 font-medium">Plan</th>
                <th className="text-right pb-2 font-medium">Monthly</th>
                <th className="text-right pb-2 font-medium">Yearly</th>
                <th className="text-left pb-2 pl-4 font-medium">Features</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, i) => {
                const planModels = plan.models_included
                  ? (typeof plan.models_included === 'string' ? JSON.parse(plan.models_included) : plan.models_included)
                  : [];
                return (
                  <tr key={(plan.plan_name || plan.name || i)} className="border-b border-gray-800/50 last:border-0">
                    <td className="py-2 text-white font-medium">{plan.plan_name || plan.name}</td>
                    <td className="py-2 text-right">
                      <span className={(plan.price_monthly || plan.monthly_price || 0) === lowestPrice ? 'text-green-400' : 'text-gray-400'}>
                        {formatPrice(plan.price_monthly || plan.monthly_price)}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-400">
                      {(plan.price_yearly || plan.yearly_price) != null ? `$${Number(plan.price_yearly || plan.yearly_price).toFixed(0)}/yr` : '--'}
                    </td>
                    <td className="py-2 pl-4">
                      {plan.features?.length > 0 ? (
                        <ul className="space-y-0.5">
                          {plan.features.map((f, fi) => (
                            <li key={fi} className="flex items-start gap-1 text-gray-400">
                              <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                      {planModels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {planModels.map((m) => (
                            <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ToolsPage() {
  const [category, setCategory] = useState('all');
  const { data: toolsData, isLoading: loading, error: queryError } = useTools();
  const { data: rankingsData } = useToolRankings();
  const error = queryError?.message;
  const tools = toolsData?.tools ?? toolsData?.data ?? toolsData ?? [];
  const rankings = rankingsData?.rankings ?? [];
  const filtered = category === 'all' ? tools : tools.filter((t) => t.category === category);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm">Failed to load tools: {error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-1">Tools</h1>
      <p className="text-sm text-gray-500 mb-6">AI coding tools ranked by model access, pricing, community satisfaction, features, and update frequency</p>

      {/* Rankings */}
      {rankings.length > 0 && (
        <RankingChart
          rankings={rankings}
          dimensions={TOOL_DIMENSIONS}
          title="Tool Rankings"
          subtitle="Composite score based on 5 weighted dimensions"
        />
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              category === cat.value
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-gray-800 border-dashed">
          <Package className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
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
