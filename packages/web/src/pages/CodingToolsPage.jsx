import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, Search, Filter, ExternalLink, Star, ChevronDown, ChevronUp,
  Puzzle, Github, Terminal, Cpu, Plug, Wand2, Sparkles, ArrowRight,
} from 'lucide-react';
import { useCodingTools, useCodingToolCategories } from '../lib/hooks.js';

const CATEGORY_CONFIG = {
  'skill':         { label: 'Skills',       color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Sparkles },
  'agent':         { label: 'Agents',       color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Cpu },
  'mcp-server':    { label: 'MCP Servers',  color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: Plug },
  'github-repo':   { label: 'GitHub Repos', color: 'bg-gray-500/10 text-gray-300 border-gray-500/20', icon: Github },
  'cli-tool':      { label: 'CLI Tools',    color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: Terminal },
  'ide-extension': { label: 'IDE Extensions', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Puzzle },
  'framework':     { label: 'Frameworks',   color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Wand2 },
  'hook':          { label: 'Hooks',        color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', icon: Sparkles },
  'command':       { label: 'Commands',     color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: Terminal },
};

const PLATFORM_FILTERS = [
  { value: '', label: 'All Platforms' },
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'windsurf', label: 'Windsurf' },
  { value: 'vscode', label: 'VS Code' },
  { value: 'terminal', label: 'Terminal' },
];

const PRICING_BADGE = {
  'free':       'bg-green-500/10 text-green-400',
  'open-source':'bg-green-500/10 text-green-400',
  'freemium':   'bg-blue-500/10 text-blue-400',
  'paid':       'bg-orange-500/10 text-orange-400',
};

const COMPLEXITY_BADGE = {
  'easy':   { label: 'Easy setup', color: 'text-green-400' },
  'medium': { label: 'Medium setup', color: 'text-yellow-400' },
  'hard':   { label: 'Advanced setup', color: 'text-orange-400' },
};

function ToolCard({ tool }) {
  const [expanded, setExpanded] = useState(false);
  const catConfig = CATEGORY_CONFIG[tool.category] || CATEGORY_CONFIG['github-repo'];
  const CatIcon = catConfig.icon;
  const pricingCls = PRICING_BADGE[tool.pricing] || PRICING_BADGE.free;
  const complexity = COMPLEXITY_BADGE[tool.setup_complexity] || COMPLEXITY_BADGE.easy;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden hover:border-gray-700 transition-colors card-hover">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 rounded-lg ${catConfig.color.split(' ')[0]}`}>
              <CatIcon className={`w-3.5 h-3.5 ${catConfig.color.split(' ')[1]}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{tool.name}</h3>
              {tool.platform && tool.platform !== 'universal' && (
                <span className="text-[10px] text-gray-500">{tool.platform}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${catConfig.color}`}>
              {catConfig.label}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
          {tool.short_description || tool.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pricingCls}`}>
            {tool.pricing === 'open-source' ? 'Open Source' : tool.pricing?.charAt(0).toUpperCase() + tool.pricing?.slice(1)}
          </span>
          {tool.stars && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Star className="w-3 h-3" />
              <span>{tool.stars >= 1000 ? `${(tool.stars / 1000).toFixed(1)}k` : tool.stars}</span>
            </div>
          )}
          <span className={`text-[10px] ${complexity.color}`}>{complexity.label}</span>
          {tool.is_featured ? <span className="text-[10px] text-yellow-400">Featured</span> : null}
        </div>

        {/* Tags */}
        {tool.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tool.tags.slice(0, 5).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-3 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less' : 'More details'}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-800 px-4 py-3 bg-gray-900/80 space-y-3">
          <p className="text-xs text-gray-300 leading-relaxed">{tool.description}</p>

          {tool.setup_instructions && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Setup</h4>
              <p className="text-xs text-gray-400">{tool.setup_instructions}</p>
            </div>
          )}

          {tool.requires?.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Requires</h4>
              <div className="flex flex-wrap gap-1">
                {tool.requires.map(r => (
                  <span key={r} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tool.use_cases?.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Use Cases</h4>
              <div className="flex flex-wrap gap-1">
                {tool.use_cases.map(uc => (
                  <span key={uc} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            {tool.url && (
              <a href={tool.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                <ExternalLink className="w-3 h-3" /> Website
              </a>
            )}
            {tool.github_url && (
              <a href={tool.github_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300">
                <Github className="w-3 h-3" /> GitHub
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CodingToolsPage() {
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const params = {};
  if (category) params.category = category;
  if (platform) params.platform = platform;
  if (search) params.search = search;

  const { data, isLoading, error } = useCodingTools(params);
  const { data: catData } = useCodingToolCategories();

  const tools = data?.tools || [];
  const categories = catData?.categories || [];
  const total = data?.total || 0;

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm">Failed to load coding tools: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Plugins & Tools</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} tools for AI-assisted coding — skills, MCP servers, agents, and more
          </p>
        </div>
        <Link
          to="/coding-tools/recommend"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          Find My Tools
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search tools..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition-colors">
            Search
          </button>
        </form>

        {/* Category + Platform filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          <button
            onClick={() => setCategory('')}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              !category ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            All ({categories.reduce((s, c) => s + c.count, 0)})
          </button>
          {categories.map(cat => {
            const config = CATEGORY_CONFIG[cat.category];
            return (
              <button
                key={cat.category}
                onClick={() => setCategory(cat.category === category ? '' : cat.category)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  category === cat.category ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {config?.label || cat.category} ({cat.count})
              </button>
            );
          })}
        </div>

        {/* Platform filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Platform:</span>
          {PLATFORM_FILTERS.map(p => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value === platform ? '' : p.value)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                platform === p.value ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-gray-800 border-dashed">
          <Puzzle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No tools found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tools.map(tool => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
