import { useState, useEffect } from 'react';
import {
  Newspaper, ExternalLink, Clock, Filter, Sparkles, Zap, Bell,
  Rss, MessageSquare, Github, Globe, Check, X, CheckCheck,
  DollarSign, Box, Megaphone, ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFeed, useWhatsNew, useAlerts, useUnreadAlertCount, useMarkAlertRead, useMarkAllAlertsRead, useDismissAlert } from '../lib/hooks.js';
import { timeAgo, setPageTitle } from '../lib/format.js';

// ── Source config ─────────────────────────────────────────────────────
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

const ALERT_TYPE_CONFIG = {
  'new-model':       { icon: Sparkles, label: 'New Model', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-l-purple-500' },
  'pricing-change':  { icon: DollarSign, label: 'Pricing', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-l-yellow-500' },
  'new-plan':        { icon: Box, label: 'New Plan', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-l-green-500' },
  'new-feature':     { icon: Zap, label: 'Feature', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
  'new-product':     { icon: Box, label: 'Product', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-l-cyan-500' },
  'announcement':    { icon: Megaphone, label: 'Announcement', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-l-orange-500' },
};

// ── Helpers ────────────────────────────────────────────────────────────
function decodeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&#8217;/g, '\u2019').replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201C').replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013').replace(/&#8212;/g, '\u2014')
    .replace(/&#038;/g, '&').replace(/&#8230;/g, '\u2026')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, m => String.fromCharCode(parseInt(m.slice(2, -1))));
}

function parseTags(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(t => t.replace(/[[\]"]/g, '').trim()).filter(Boolean);
  } catch {}
  return raw.replace(/[[\]"]/g, '').split(',').map(t => t.trim()).filter(Boolean);
}

const TAG_LABELS = {
  'model-release': 'New Model', 'new-model': 'New Model', 'pricing-change': 'Pricing',
  'pricing': 'Pricing', 'coding-tool': 'Tool Update', 'benchmark': 'Benchmark',
  'vibe-coding': 'Vibe Coding', 'new-feature': 'Feature',
};
const TAG_COLORS = {
  'New Model': 'bg-purple-500/10 text-purple-400', 'Pricing': 'bg-yellow-500/10 text-yellow-400',
  'Tool Update': 'bg-blue-500/10 text-blue-400', 'Benchmark': 'bg-cyan-500/10 text-cyan-400',
  'Vibe Coding': 'bg-green-500/10 text-green-400', 'Feature': 'bg-emerald-500/10 text-emerald-400',
};

function relevanceBar(score) {
  if (score >= 80) return { width: '100%', color: 'bg-green-500', label: 'Must Read' };
  if (score >= 60) return { width: '75%', color: 'bg-blue-500', label: 'Relevant' };
  if (score >= 40) return { width: '50%', color: 'bg-yellow-500', label: 'Related' };
  return { width: '25%', color: 'bg-gray-600', label: 'FYI' };
}

// ── News Card ─────────────────────────────────────────────────────────
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
        featured ? `${src.border} ${src.bg} p-5` : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 p-4'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <SrcIcon className={`w-3.5 h-3.5 ${src.color}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${src.color}`}>{src.label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Clock className="w-3 h-3" />
          {timeAgo(item.published_at)}
        </div>
      </div>
      <h3 className={`font-semibold text-white leading-snug group-hover:text-blue-300 transition-colors ${featured ? 'text-lg' : 'text-sm'}`}>
        {decodeHtml(item.title)}
        <ExternalLink className="inline w-3 h-3 ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity" />
      </h3>
      {item.summary && (
        <p className={`text-gray-400 leading-relaxed mt-2 ${featured ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'}`}>
          {decodeHtml(item.summary)}
        </p>
      )}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          {parseTags(item.relevance_tags).slice(0, 3).map(tag => {
            const label = TAG_LABELS[tag] || tag.replace(/-/g, ' ');
            const cls = TAG_COLORS[label] || 'bg-gray-800 text-gray-500';
            return <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${cls}`}>{label}</span>;
          })}
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

// ── Alert Card ────────────────────────────────────────────────────────
function AlertCard({ alert, onMarkRead, onDismiss }) {
  const config = ALERT_TYPE_CONFIG[alert.event_type] || ALERT_TYPE_CONFIG.announcement;
  const Icon = config.icon;
  const metadata = alert.metadata ? (typeof alert.metadata === 'string' ? JSON.parse(alert.metadata) : alert.metadata) : {};

  return (
    <div className={`relative bg-gray-900 rounded-lg border border-gray-800 border-l-4 ${config.border} p-4 transition-all ${!alert.is_read ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
            <span className="text-[10px] text-gray-500">{alert.source}</span>
            <span className="text-[10px] text-gray-600">{timeAgo(alert.detected_at)}</span>
            {!alert.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
          </div>
          <h3 className="text-sm font-semibold text-white leading-tight">{decodeHtml(alert.title)}</h3>
          {alert.summary && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{decodeHtml(alert.summary)}</p>}
          {Object.keys(metadata).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(metadata).map(([key, value]) => (
                <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {alert.source_url && (
            <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-colors" title="Open source">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          {!alert.is_read && (
            <button onClick={() => onMarkRead(alert.id)} className="p-1.5 rounded text-gray-500 hover:text-green-400 hover:bg-gray-800 transition-colors" title="Mark read">
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => onDismiss(alert.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors" title="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function NewsPage() {
  useEffect(() => { setPageTitle('News & Alerts'); }, []);
  const [tab, setTab] = useState('news');
  const [source, setSource] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [alertFilter, setAlertFilter] = useState({});

  // What's New data
  const { data: whatsNewData, isLoading: whatsNewLoading } = useWhatsNew();

  // News data
  const feedParams = { page: String(page), limit: '30' };
  if (source) feedParams.source = source;
  if (tag) feedParams.tag = tag;
  const { data: feedData, isLoading: feedLoading } = useFeed(feedParams);

  // Alerts data
  const { data: alertsData, isLoading: alertsLoading } = useAlerts({ ...alertFilter, limit: '50' });
  const { data: unreadData } = useUnreadAlertCount();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();
  const dismiss = useDismissAlert();

  const items = feedData?.items || [];
  const total = feedData?.total || 0;
  const totalPages = Math.ceil(total / 30);
  const alerts = alertsData?.alerts || [];
  const alertTotal = alertsData?.total || 0;
  const unreadCount = unreadData?.count || 0;

  const hero = items[0];
  const rest = items.slice(1);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Masthead */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Newspaper className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">The AI Wire</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
              Filtered for vibe coders &middot; Updated every 30 minutes
            </p>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-blue-500/40 via-purple-500/20 to-transparent mt-3" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-800 pb-2">
        <button
          onClick={() => setTab('whats-new')}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-t-lg transition-colors ${
            tab === 'whats-new' ? 'bg-gray-900 text-green-400 border-b-2 border-green-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          What's New
        </button>
        <button
          onClick={() => setTab('news')}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-t-lg transition-colors ${
            tab === 'news' ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          News Feed
          <span className="text-[10px] text-gray-500 ml-1">({total})</span>
        </button>
        <button
          onClick={() => setTab('alerts')}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-t-lg transition-colors ${
            tab === 'alerts' ? 'bg-gray-900 text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Industry Alerts
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── What's New Tab ───────────────────────────────────── */}
      {tab === 'whats-new' && (
        <>
          {whatsNewLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-gray-900/50 border border-gray-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Recently Added Models */}
              {(whatsNewData?.recent_models?.length > 0) && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    Recently Added Models
                    <span className="text-[10px] text-gray-600 font-normal normal-case">Last 30 days</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {whatsNewData.recent_models.map((m) => (
                      <Link
                        key={m.slug}
                        to={`/models/${m.slug}`}
                        className="block rounded-lg border border-gray-800 bg-gray-900/50 p-4 hover:border-green-500/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">{m.name}</span>
                          {m.is_open_weight ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Open</span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-gray-500">{m.vendor} · {m.family || 'Unknown family'}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px]">
                          {m.input_price_per_mtok != null && (
                            <span className="text-gray-400">${m.input_price_per_mtok}/${m.output_price_per_mtok} per MTok</span>
                          )}
                          {m.discovery_source && m.discovery_source !== 'seed' && (
                            <span className="text-blue-400">via {m.discovery_source}</span>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-600 mt-1">{new Date(m.created_at).toLocaleDateString()}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Pricing Changes */}
              {(whatsNewData?.pricing_changes?.length > 0) && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    Pricing Changes
                  </h2>
                  <div className="space-y-2">
                    {whatsNewData.pricing_changes.map((pc) => (
                      <a
                        key={pc.id}
                        href={pc.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-gray-800 bg-gray-900/50 p-3 hover:border-yellow-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-xs font-medium text-white">{decodeHtml(pc.title)}</span>
                          <span className="text-[10px] text-gray-600 ml-auto">{new Date(pc.detected_at).toLocaleDateString()}</span>
                        </div>
                        {pc.summary && <p className="text-[10px] text-gray-400 line-clamp-2 ml-5.5">{decodeHtml(pc.summary)}</p>}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* On the Horizon */}
              {(whatsNewData?.pending_models?.length > 0) && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    On the Horizon
                    <span className="text-[10px] text-gray-600 font-normal normal-case">Coming Soon</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {whatsNewData.pending_models.map((pm) => (
                      <div
                        key={pm.slug}
                        className="rounded-lg border border-dashed border-purple-500/30 bg-purple-500/5 p-4"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{pm.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Coming Soon</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{pm.vendor}{pm.family ? ` · ${pm.family}` : ''}</p>
                        {pm.description && <p className="text-[10px] text-gray-400 mt-1.5 line-clamp-2">{pm.description}</p>}
                        <p className="text-[9px] text-gray-600 mt-1">Discovered {new Date(pm.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Recent Key Alerts */}
              {(whatsNewData?.recent_alerts?.length > 0) && (
                <section>
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-400" />
                    Key Updates
                    <span className="text-[10px] text-gray-600 font-normal normal-case">Last 14 days</span>
                  </h2>
                  <div className="space-y-2">
                    {whatsNewData.recent_alerts.map((a) => {
                      const cfg = ALERT_TYPE_CONFIG[a.event_type] || ALERT_TYPE_CONFIG.announcement;
                      const Icon = cfg.icon;
                      return (
                        <a
                          key={a.id}
                          href={a.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block rounded-lg border border-gray-800 border-l-4 ${cfg.border} bg-gray-900/50 p-3 hover:border-gray-700 transition-colors`}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-[10px] text-gray-600 ml-auto">{timeAgo(a.detected_at)}</span>
                          </div>
                          <p className="text-xs font-medium text-white">{decodeHtml(a.title)}</p>
                          {a.summary && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{decodeHtml(a.summary)}</p>}
                        </a>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {!whatsNewData?.recent_models?.length && !whatsNewData?.recent_alerts?.length && !whatsNewData?.pending_models?.length && (
                <div className="text-center py-16 rounded-xl border border-gray-800 border-dashed">
                  <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No recent updates yet.</p>
                  <p className="text-xs text-gray-600 mt-1">New models and changes will appear here as they're detected.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── News Tab ──────────────────────────────────────────── */}
      {tab === 'news' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <button onClick={() => { setSource(''); setPage(1); }}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${!source ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
              All Sources
            </button>
            {Object.entries(SOURCE_CONFIG).slice(0, 7).map(([key, cfg]) => (
              <button key={key} onClick={() => { setSource(key === source ? '' : key); setPage(1); }}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${source === key ? `${cfg.bg} ${cfg.color}` : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                {cfg.label}
              </button>
            ))}
            <span className="text-gray-700 mx-1">|</span>
            {RELEVANCE_TAGS.map(t => (
              <button key={t.value} onClick={() => { setTag(t.value === tag ? '' : t.value); setPage(1); }}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${tag === t.value ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {feedLoading ? (
            <div className="space-y-4">
              <div className="h-48 rounded-xl bg-gray-900/50 border border-gray-800 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 rounded-xl bg-gray-900/50 border border-gray-800 animate-pulse" />)}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-gray-800 border-dashed">
              <Newspaper className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No articles match your filters.</p>
            </div>
          ) : (
            <>
              {hero && <div className="mb-6"><HeadlineCard item={hero} featured /></div>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {rest.map(item => <HeadlineCard key={item.id} item={item} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pb-4">
                  {page > 1 && <button onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">Previous</button>}
                  <span className="text-xs text-gray-500">Page {page} of {totalPages} &middot; {total} articles</span>
                  {page < totalPages && <button onClick={() => setPage(p => p + 1)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">Next</button>}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Alerts Tab ────────────────────────────────────────── */}
      {tab === 'alerts' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setAlertFilter({})}
                className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${!alertFilter.type ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                All ({alertTotal})
              </button>
              {Object.entries(ALERT_TYPE_CONFIG).map(([type, cfg]) => (
                <button key={type} onClick={() => setAlertFilter(f => ({ ...f, type: f.type === type ? undefined : type }))}
                  className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${alertFilter.type === type ? `${cfg.bg} ${cfg.color}` : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                  {cfg.label}
                </button>
              ))}
            </div>
            <button onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
              <CheckCheck className="w-3 h-3" /> Mark all read
            </button>
          </div>

          {alertsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="animate-pulse bg-gray-900 rounded-lg h-24 border border-gray-800" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-gray-800 border-dashed">
              <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No industry alerts yet</p>
              <p className="text-xs text-gray-600 mt-1">The monitor checks AI vendor blogs and pricing pages daily at 9am UTC.</p>
              <p className="text-xs text-gray-600 mt-0.5">Sources: OpenAI, Anthropic, Google AI, Mistral, DeepSeek, xAI, Meta AI, and more.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onMarkRead={(id) => markRead.mutate(id)}
                  onDismiss={(id) => dismiss.mutate(id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
