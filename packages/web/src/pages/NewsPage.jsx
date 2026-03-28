import { useState, useEffect } from 'react';
import {
  Newspaper, ExternalLink, Clock, TrendingUp, Filter,
  Bookmark, BookmarkCheck, Sparkles, Zap, ChevronRight,
  Rss, MessageSquare, Github, Globe,
} from 'lucide-react';
import { useFeed, useAlerts } from '../lib/hooks.js';
import { timeAgo, setPageTitle } from '../lib/format.js';

const SOURCE_CONFIG = {
  'rss:anthropic':      { label: 'Anthropic',    icon: Zap,            color: 'text-orange-400',  bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  'rss:openai':         { label: 'OpenAI',       icon: Sparkles,       color: 'text-green-400',   bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  'rss:google-ai':      { label: 'Google AI',    icon: Globe,          color: 'text-blue-400',    bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  'rss:huggingface':    { label: 'HuggingFace',  icon: Github,         color: 'text-yellow-400',  bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  'rss:techcrunch-ai':  { label: 'TechCrunch',   icon: Newspaper,      color: 'text-emerald-400', bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
  'rss:verge-ai':       { label: 'The Verge',    icon: Rss,            color: 'text-purple-400',  bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  'rss:arstechnica':    { label: 'Ars Technica',  icon: Rss,            color: 'text-red-400',     bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  'reddit:locallama':   { label: 'r/LocalLLaMA', icon: MessageSquare,  color: 'text-orange-300',  bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  'reddit:ml':          { label: 'r/ML',         icon: MessageSquare,  color: 'text-blue-300',    bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  'reddit:artificial':  { label: 'r/artificial',  icon: MessageSquare,  color: 'text-cyan-300',    bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30' },
};

const RELEVANCE_TAGS = [
  { value: '', label: 'All' },
  { value: 'model-release', label: 'Model Releases' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'coding-tool', label: 'Coding Tools' },
  { value: 'benchmark', label: 'Benchmarks' },
  { value: 'new-model', label: 'New Models' },
  { value: 'vibe-coding', label: 'Vibe Coding' },
];

function relevanceBar(score) {
  if (score >= 80) return { width: '100%', color: 'bg-green-500', label: 'Must Read' };
  if (score >= 60) return { width: '75%', color: 'bg-blue-500', label: 'Relevant' };
  if (score >= 40) return { width: '50%', color: 'bg-yellow-500', label: 'Related' };
  return { width: '25%', color: 'bg-gray-600', label: 'FYI' };
}

function HeadlineCard({ item, featured }) {
  const src = SOURCE_CONFIG[item.source] || { label: item.source, icon: Rss, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' };
  const SrcIcon = src.icon;
  const rel = relevanceBar(item.relevance_score || 0);

  return (
    <a
      href={item.content_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-xl border transition-all duration-200 hover:scale-[1.01] ${
        featured
          ? `${src.border} ${src.bg} p-5`
          : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 p-4'
      }`}
    >
      {/* Source + time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <SrcIcon className={`w-3.5 h-3.5 ${src.color}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${src.color}`}>
            {src.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Clock className="w-3 h-3" />
          {timeAgo(item.published_at)}
        </div>
      </div>

      {/* Headline */}
      <h3 className={`font-semibold text-white leading-snug group-hover:text-blue-300 transition-colors ${
        featured ? 'text-lg' : 'text-sm'
      }`}>
        {item.title}
        <ExternalLink className="inline w-3 h-3 ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity" />
      </h3>

      {/* Summary */}
      {item.summary && (
        <p className={`text-gray-400 leading-relaxed mt-2 ${
          featured ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'
        }`}>
          {item.summary}
        </p>
      )}

      {/* Tags + relevance */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          {item.relevance_tags && item.relevance_tags.split(',').slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 uppercase tracking-wider">
              {tag.trim()}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${rel.color}`} style={{ width: rel.width }} />
          </div>
          <span className="text-[9px] text-gray-500">{rel.label}</span>
        </div>
      </div>
    </a>
  );
}

function AlertBanner({ alerts }) {
  if (!alerts?.length) return null;
  const recent = alerts.slice(0, 3);

  return (
    <div className="mb-6 rounded-xl border border-yellow-500/20 bg-gradient-to-r from-yellow-950/20 via-gray-900 to-gray-900 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
        </div>
        <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Breaking / Industry Alerts</h3>
      </div>
      <div className="space-y-2">
        {recent.map(a => (
          <a
            key={a.id}
            href={a.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
            <span className="text-sm text-gray-200 group-hover:text-yellow-300 transition-colors flex-1 truncate">
              {a.title}
            </span>
            <span className="text-[10px] text-gray-500 shrink-0">{timeAgo(a.detected_at)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function NewsPage() {
  useEffect(() => { setPageTitle('News & Developments'); }, []);
  const [source, setSource] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);

  const params = { page: String(page), limit: '30' };
  if (source) params.source = source;
  if (tag) params.tag = tag;

  const { data, isLoading } = useFeed(params);
  const { data: alertsData } = useAlerts({ limit: '5', unread: '1' });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 30);
  const alerts = alertsData?.alerts || [];

  // Split: first item is the hero, rest fill the grid
  const hero = items[0];
  const rest = items.slice(1);

  // Unique sources from data for filter pills
  const sources = [...new Set(items.map(i => i.source))].sort();

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Masthead */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              The AI Wire
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
              Filtered for vibe coders &middot; Updated every 30 minutes
            </p>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-blue-500/40 via-purple-500/20 to-transparent mt-3" />
      </div>

      {/* Breaking alerts */}
      <AlertBanner alerts={alerts} />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-3.5 h-3.5 text-gray-500" />

        {/* Source filters */}
        <button
          onClick={() => { setSource(''); setPage(1); }}
          className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
            !source ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
          }`}
        >
          All Sources
        </button>
        {Object.entries(SOURCE_CONFIG).slice(0, 7).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setSource(key === source ? '' : key); setPage(1); }}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
              source === key ? `${cfg.bg} ${cfg.color}` : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {cfg.label}
          </button>
        ))}

        <span className="text-gray-700 mx-1">|</span>

        {/* Tag filters */}
        {RELEVANCE_TAGS.map(t => (
          <button
            key={t.value}
            onClick={() => { setTag(t.value === tag ? '' : t.value); setPage(1); }}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
              tag === t.value ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-48 rounded-xl bg-gray-900/50 border border-gray-800 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 rounded-xl bg-gray-900/50 border border-gray-800 animate-pulse" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-gray-800 border-dashed">
          <Newspaper className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No news articles match your filters.</p>
          <p className="text-xs text-gray-600 mt-1">The RSS fetcher checks sources every 30 minutes.</p>
        </div>
      ) : (
        <>
          {/* Hero article */}
          {hero && (
            <div className="mb-6">
              <HeadlineCard item={hero} featured />
            </div>
          )}

          {/* Grid of remaining articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {rest.map(item => (
              <HeadlineCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pb-4">
              {page > 1 && (
                <button
                  onClick={() => setPage(p => p - 1)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  Previous
                </button>
              )}
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages} &middot; {total} articles
              </span>
              {page < totalPages && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
