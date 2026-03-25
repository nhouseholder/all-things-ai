import { useState, useEffect } from 'react';
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

const TYPE_STYLES = {
  cost_saving: { accent: 'neon', text: 'text-neon', label: 'Cost Saving' },
  new_tool: { accent: 'cyan', text: 'text-cyan', label: 'New Tool' },
  model_upgrade: { accent: 'neon', text: 'text-neon', label: 'Model Upgrade' },
  plan_switch: { accent: 'cyan', text: 'text-cyan', label: 'Plan Switch' },
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
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar w-20">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-dim">{score}</span>
    </div>
  );
}

function RecommendationCard({ rec, onDismiss }) {
  const style = TYPE_STYLES[rec.type] || TYPE_STYLES.new_tool;
  const Icon = TYPE_ICONS[rec.type] || Lightbulb;
  const isNeon = style.accent === 'neon';

  return (
    <div className={`card-glow relative group ${isNeon ? 'glow-neon' : 'glow-cyan'}`}>
      <button
        onClick={() => onDismiss(rec.id)}
        className="absolute top-3 right-3 text-muted hover:text-neon opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Dismiss recommendation"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isNeon ? 'bg-neon/10' : 'bg-cyan/10'}`}>
          <Icon className={`w-4 h-4 ${style.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${style.text}`}>
              {style.label}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-silver mb-1">{rec.title}</h3>
          <p className="text-xs text-muted leading-relaxed">{rec.body}</p>
          {rec.related_tools?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {rec.related_tools.map((t) => (
                <span key={t} className="terminal-badge">
                  {t}
                </span>
              ))}
            </div>
          )}
          {rec.related_models?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {rec.related_models.map((m) => (
                <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-elevated text-dim">
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
    <div className={`card hover:border-edge-bright transition-colors ${item.is_read ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="terminal-badge">
              {item.source}
            </span>
            <span className="text-xs text-dim">{relativeTime(item.published_at)}</span>
          </div>
          <a
            href={item.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-silver hover:text-cyan transition-colors flex items-center gap-1.5 group"
          >
            {item.title}
            <ExternalLink className="w-3 h-3 text-dim group-hover:text-cyan transition-colors" />
          </a>
          {item.summary && (
            <p className="text-xs text-dim mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <RelevanceBar score={item.relevance_score ?? 0} />
            {item.relevance_tags && (
              <div className="flex flex-wrap gap-1">
                {(typeof item.relevance_tags === 'string' ? JSON.parse(item.relevance_tags) : item.relevance_tags).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan/10 text-cyan">
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
            className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-neon transition-colors"
            aria-label={item.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {item.is_bookmarked ? <BookmarkCheck className="w-4 h-4 text-neon" /> : <Bookmark className="w-4 h-4" />}
          </button>
          {!item.is_read && (
            <button
              onClick={() => onMarkRead(item.id)}
              className="p-1.5 rounded-lg hover:bg-elevated text-muted hover:text-neon transition-colors"
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
    <div className="stat-card">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-dim">{label}</p>
          <p className="text-lg font-mono font-bold text-silver">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [recsRes, feedRes] = await Promise.all([
          api.getRecommendations(),
          api.getFeed(),
        ]);
        setRecommendations(recsRes.recommendations ?? recsRes.data ?? recsRes ?? []);
        const feedItems = feedRes.items ?? feedRes.data ?? feedRes ?? [];
        setFeed(feedItems.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleDismiss(id) {
    try {
      await api.dismissRecommendation(id);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }

  async function handleBookmark(id) {
    try {
      await api.toggleBookmark(id);
      setFeed((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_bookmarked: !item.is_bookmarked } : item
        )
      );
    } catch {}
  }

  async function handleMarkRead(id) {
    try {
      await api.markRead(id);
      setFeed((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
    } catch {}
  }

  const totalSpend = feed.length > 0 ? '$--' : '$0';
  const toolsCount = '--';
  const unreadCount = feed.filter((i) => !i.is_read).length;
  const recCount = recommendations.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-neon animate-spin" />
      </div>
    );
  }

  if (error && feed.length === 0 && recommendations.length === 0) {
    return (
      <div className="text-center py-16 max-w-md mx-auto">
        <Sparkles className="w-12 h-12 text-cyan mx-auto mb-4" />
        <h2 className="text-xl font-mono font-semibold text-silver mb-2">Welcome to All Things AI</h2>
        <p className="text-muted text-sm mb-4">
          The Worker backend needs to be running to populate data. Start it with:
        </p>
        <code className="block bg-elevated rounded-lg p-3 text-sm text-neon font-mono mb-4">
          cd packages/worker && npm run dev
        </code>
        <p className="text-dim text-xs">
          Then run <code className="text-cyan font-mono">npm run db:migrate && npm run db:seed</code> to populate the database.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-mono font-bold text-silver mb-6">Dashboard</h1>

      {/* Recommendations - full width */}
      <section className="mb-8">
        <h2 className="section-label flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Recommendations
        </h2>
        {recommendations.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-edge border-dashed">
            <p className="text-sm text-dim">No recommendations right now. Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} onDismiss={handleDismiss} />
            ))}
          </div>
        )}
      </section>

      {/* Feed (2/3) + Stats (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <h2 className="section-label flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            News Feed
          </h2>
          {feed.length === 0 ? (
            <div className="text-center py-8 rounded-xl border border-edge border-dashed">
              <p className="text-sm text-dim">No news items yet. Configure your sources in Settings.</p>
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
          <h2 className="section-label flex items-center gap-2">
            <Star className="w-4 h-4" />
            Quick Stats
          </h2>
          <div className="space-y-3">
            <StatCard
              icon={DollarSign}
              label="Monthly Spend"
              value={totalSpend}
              color="bg-neon/10 text-neon"
            />
            <StatCard
              icon={Wrench}
              label="Tools Tracked"
              value={toolsCount}
              color="bg-cyan/10 text-cyan"
            />
            <StatCard
              icon={Newspaper}
              label="Unread News"
              value={unreadCount}
              color="bg-warn/10 text-warn"
            />
            <StatCard
              icon={Lightbulb}
              label="Recommendations"
              value={recCount}
              color="bg-cyan/10 text-cyan"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
