import { useState } from 'react';
import {
  Lightbulb,
  X,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Loader2,
  DollarSign,
  Wrench,
  Newspaper,
  Star,
  ExternalLink,
  Sparkles,
  ArrowUpCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useRecommendations, useFeed, useDismissRecommendation } from '../lib/hooks.js';
import { SkeletonDashboard } from '../components/Skeleton.jsx';

const TYPE_STYLES = {
  cost_saving: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', label: 'Cost Saving' },
  new_tool: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'New Tool' },
  model_upgrade: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Model Upgrade' },
  plan_switch: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', label: 'Plan Switch' },
};

const TYPE_ICONS = {
  cost_saving: DollarSign,
  new_tool: Sparkles,
  model_upgrade: ArrowUpCircle,
  plan_switch: RefreshCw,
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function RelevanceBar({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : pct >= 25 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}</span>
    </div>
  );
}

function RecommendationCard({ rec, onDismiss }) {
  const style = TYPE_STYLES[rec.type] || TYPE_STYLES.new_tool;
  const Icon = TYPE_ICONS[rec.type] || Lightbulb;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4 relative group card-hover`}>
      <button
        onClick={() => onDismiss(rec.id)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Dismiss recommendation"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${style.bg}`}>
          <Icon className={`w-4 h-4 ${style.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
              {style.label}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">{rec.title}</h3>
          <p className="text-xs text-gray-400 leading-relaxed">{rec.body}</p>
          {rec.related_tools?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {rec.related_tools.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                  {t}
                </span>
              ))}
            </div>
          )}
          {rec.related_models?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {rec.related_models.map((m) => (
                <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800/60 text-gray-500">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsItem({ item, onBookmark, onMarkRead }) {
  return (
    <div className={`p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors card-hover ${item.is_read ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 uppercase tracking-wider">
              {item.source}
            </span>
            <span className="text-xs text-gray-500">{relativeTime(item.published_at)}</span>
          </div>
          <a
            href={item.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 group"
          >
            {item.title}
            <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </a>
          {item.summary && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <RelevanceBar score={item.relevance_score ?? 0} />
            {item.relevance_tags && (
              <div className="flex flex-wrap gap-1">
                {(typeof item.relevance_tags === 'string' ? JSON.parse(item.relevance_tags) : item.relevance_tags).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => onBookmark(item.id)}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-yellow-400 transition-colors"
            aria-label={item.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {item.is_bookmarked ? <BookmarkCheck className="w-4 h-4 text-yellow-400" /> : <Bookmark className="w-4 h-4" />}
          </button>
          {!item.is_read && (
            <button
              onClick={() => onMarkRead(item.id)}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-green-400 transition-colors"
              aria-label="Mark as read"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const recsQuery = useRecommendations();
  const feedQuery = useFeed();
  const dismissMutation = useDismissRecommendation();
  const [localFeed, setLocalFeed] = useState(null);

  const recsData = recsQuery.data;
  const recommendations = recsData?.recommendations ?? recsData?.data ?? recsData ?? [];

  const feedData = feedQuery.data;
  const rawFeed = feedData?.items ?? feedData?.data ?? feedData ?? [];
  const feed = localFeed ?? [...rawFeed].sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));

  const loading = recsQuery.isLoading || feedQuery.isLoading;
  const error = recsQuery.error || feedQuery.error;

  function handleDismiss(id) {
    dismissMutation.mutate(id);
  }

  async function handleBookmark(id) {
    try {
      await api.toggleBookmark(id);
      setLocalFeed((prev) =>
        (prev ?? feed).map((item) =>
          item.id === id ? { ...item, is_bookmarked: !item.is_bookmarked } : item
        )
      );
    } catch {}
  }

  async function handleMarkRead(id) {
    try {
      await api.markRead(id);
      setLocalFeed((prev) =>
        (prev ?? feed).map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch {}
  }

  const totalSpend = feed.length > 0 ? '$--' : '$0';
  const toolsCount = '--';
  const unreadCount = feed.filter((i) => !i.is_read).length;
  const recCount = recommendations.length;

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error && feed.length === 0 && recommendations.length === 0) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Welcome to All Things AI</h2>
        <p className="text-gray-400 text-sm mb-4">
          The Worker backend needs to be running to populate data. Start it with:
        </p>
        <code className="block bg-gray-800 rounded-lg p-3 text-sm text-green-400 mb-4">
          cd packages/worker && npm run dev
        </code>
        <p className="text-gray-500 text-xs">
          Then run <code className="text-blue-400">npm run db:migrate && npm run db:seed</code> to populate the database.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Recommendations - full width */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Recommendations
        </h2>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-gray-800 border-dashed">
            <p className="text-sm text-gray-500">No recommendations right now. Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec, i) => (
              <div key={rec.id} className="stagger-item">
                <RecommendationCard rec={rec} onDismiss={handleDismiss} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Feed (2/3) + Stats (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            News Feed
          </h2>
          {feed.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-gray-800 border-dashed">
              <p className="text-sm text-gray-500">No news items yet. Configure your sources in Settings.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {feed.map((item) => (
                <NewsItem
                  key={item.id}
                  item={item}
                  onBookmark={handleBookmark}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star className="w-4 h-4" />
            Quick Stats
          </h2>
          <div className="space-y-3">
            <StatCard
              icon={DollarSign}
              label="Monthly Spend"
              value={totalSpend}
              color="bg-green-500/10 text-green-400"
            />
            <StatCard
              icon={Wrench}
              label="Tools Tracked"
              value={toolsCount}
              color="bg-blue-500/10 text-blue-400"
            />
            <StatCard
              icon={Newspaper}
              label="Unread News"
              value={unreadCount}
              color="bg-orange-500/10 text-orange-400"
            />
            <StatCard
              icon={Lightbulb}
              label="Recommendations"
              value={recCount}
              color="bg-purple-500/10 text-purple-400"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
