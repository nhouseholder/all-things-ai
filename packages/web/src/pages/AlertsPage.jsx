import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, ExternalLink, Zap, DollarSign, Box, Sparkles, Megaphone, Filter } from 'lucide-react';
import { setPageTitle } from '../lib/format.js';
import { useAlerts, useMarkAlertRead, useMarkAllAlertsRead, useDismissAlert } from '../lib/hooks.js';

const EVENT_TYPE_CONFIG = {
  'new-model': { icon: Sparkles, label: 'New Model', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'pricing-change': { icon: DollarSign, label: 'Pricing Change', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'new-plan': { icon: Box, label: 'New Plan', color: 'text-green-400', bg: 'bg-green-500/10' },
  'new-feature': { icon: Zap, label: 'New Feature', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'new-product': { icon: Box, label: 'New Product', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  'announcement': { icon: Megaphone, label: 'Announcement', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  'other': { icon: Bell, label: 'Other', color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

const IMPORTANCE_STYLES = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-gray-600',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AlertsPage() {
  useEffect(() => { setPageTitle('Industry Alerts'); }, []);
  const [filter, setFilter] = useState({});
  const { data, isLoading } = useAlerts(filter);
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();
  const dismiss = useDismissAlert();

  const alerts = data?.alerts || [];
  const total = data?.total || 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-400" />
            Industry Alerts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            AI industry changes detected from vendor blogs, pricing pages, and news
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter({})}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            !filter.type && !filter.unread ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          All ({total})
        </button>
        <button
          onClick={() => setFilter(f => ({ ...f, unread: f.unread === '1' ? undefined : '1' }))}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            filter.unread === '1' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          Unread
        </button>
        {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
          <button
            key={type}
            onClick={() => setFilter(f => ({ ...f, type: f.type === type ? undefined : type }))}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter.type === type ? `${config.bg} ${config.color}` : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Alert List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-900 rounded-lg h-24 border border-gray-800" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No alerts yet</p>
          <p className="text-sm mt-1">The industry monitor checks AI vendor pages daily at 9am UTC</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => {
            const config = EVENT_TYPE_CONFIG[alert.event_type] || EVENT_TYPE_CONFIG.other;
            const Icon = config.icon;
            const metadata = alert.metadata ? JSON.parse(alert.metadata) : {};

            return (
              <div
                key={alert.id}
                className={`relative bg-gray-900 rounded-lg border border-gray-800 border-l-4 ${
                  IMPORTANCE_STYLES[alert.importance] || IMPORTANCE_STYLES.low
                } p-4 transition-all ${!alert.is_read ? 'bg-gray-900' : 'bg-gray-900/50 opacity-75'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-500">{alert.source}</span>
                      <span className="text-xs text-gray-600">{timeAgo(alert.detected_at)}</span>
                      {!alert.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-tight">{alert.title}</h3>
                    {alert.summary && (
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{alert.summary}</p>
                    )}
                    {/* Metadata chips */}
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {alert.source_url && (
                      <a
                        href={alert.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-colors"
                        title="Open source"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!alert.is_read && (
                      <button
                        onClick={() => markRead.mutate(alert.id)}
                        className="p-1.5 rounded text-gray-500 hover:text-green-400 hover:bg-gray-800 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => dismiss.mutate(alert.id)}
                      className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
