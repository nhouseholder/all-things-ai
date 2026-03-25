import { useState, useEffect } from 'react';
import {
  Loader2,
  DollarSign,
  Trash2,
  TrendingDown,
  ArrowRight,
  PieChart as PieIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../lib/api.js';

const PIE_COLORS = [
  '#00ff88', '#00d4ff', '#ff3366', '#fbbf24', '#ff6b35',
  '#00ff88cc', '#00d4ffcc', '#ff3366cc', '#fbbf24cc', '#ff6b35cc',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-elevated border border-edge-bright rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-silver font-medium font-mono">{data.name}</p>
      <p className="text-muted">${Number(data.value).toFixed(2)}/mo</p>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function CostPage() {
  const [summary, setSummary] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryRes, altRes] = await Promise.all([
          api.getCostSummary(),
          api.getAlternatives(),
        ]);
        setSummary(summaryRes);
        setAlternatives(altRes.alternatives ?? altRes.data ?? altRes ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleRemove(id) {
    try {
      await api.removeSubscription(id);
      setSummary((prev) => {
        if (!prev) return prev;
        const subs = (prev.subscriptions ?? []).filter((s) => s.id !== id);
        const total = subs.reduce((sum, s) => sum + (s.monthly_cost ?? 0), 0);
        return { ...prev, subscriptions: subs, total_monthly: total };
      });
    } catch {}
  }

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
        <p className="text-hot text-sm">Failed to load cost data: {error}</p>
      </div>
    );
  }

  const totalSpend = summary?.total_monthly ?? 0;
  const subscriptions = summary?.subscriptions ?? [];
  const breakdown = summary?.breakdown ?? subscriptions.map((s) => ({
    name: s.tool_name ?? s.name,
    value: s.monthly_cost ?? 0,
  }));

  const pieData = breakdown.filter((d) => d.value > 0);

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-silver mb-6">Cost Management</h1>

      {/* Spend Summary */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Big number */}
          <div className="card-glow glow-neon">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-neon" />
              <h2 className="section-label !mb-0">
                Total Monthly Spend
              </h2>
            </div>
            <p className="text-4xl font-mono font-bold text-neon mt-2">
              ${Number(totalSpend).toFixed(2)}
            </p>
            <p className="text-xs text-dim mt-1">
              Across {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Pie chart */}
          <div className="card">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PieIcon className="w-8 h-8 text-dim mx-auto mb-2" />
                  <p className="text-sm text-dim">No spending data to display</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* Subscriptions Table */}
      <section className="mb-8">
        <h2 className="section-label">
          Subscriptions
        </h2>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-edge border-dashed">
            <p className="text-sm text-dim">No active subscriptions.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-edge overflow-hidden">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Tool</th>
                  <th className="text-left">Plan</th>
                  <th className="text-right">Monthly Cost</th>
                  <th className="text-left">Started</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="text-silver font-medium">
                      {sub.tool_name ?? sub.name}
                    </td>
                    <td className="text-muted">{sub.plan_name ?? sub.plan ?? '--'}</td>
                    <td className="text-right text-neon font-mono font-medium">
                      ${Number(sub.monthly_cost ?? 0).toFixed(2)}
                    </td>
                    <td className="text-dim text-xs">
                      {sub.started_at
                        ? new Date(sub.started_at).toLocaleDateString()
                        : '--'}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleRemove(sub.id)}
                        className="p-1.5 rounded-lg text-muted hover:text-hot hover:bg-hot/10 transition-colors"
                        aria-label={`Remove ${sub.tool_name ?? sub.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Alternatives */}
      <section>
        <h2 className="section-label flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Cheaper Alternatives
        </h2>
        {alternatives.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-edge border-dashed">
            <p className="text-sm text-dim">No cheaper alternatives found for your current subscriptions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alternatives.map((alt, i) => {
              const savings = (alt.current_cost ?? 0) - (alt.alternative_cost ?? 0);
              return (
                <div
                  key={alt.id ?? i}
                  className="card"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm text-muted">
                          <span className="text-silver font-medium">{alt.current_tool ?? alt.tool_name}</span>
                          {alt.current_plan && (
                            <span className="text-dim ml-1">({alt.current_plan})</span>
                          )}
                        </p>
                        <p className="text-xs font-mono text-dim">
                          ${Number(alt.current_cost ?? 0).toFixed(2)}/mo
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-dim" />
                      <div>
                        <p className="text-sm text-silver font-medium">
                          {alt.alternative_tool ?? alt.alternative_name}
                          {alt.alternative_plan && (
                            <span className="text-dim font-normal ml-1">({alt.alternative_plan})</span>
                          )}
                        </p>
                        <p className="text-xs font-mono text-dim">
                          ${Number(alt.alternative_cost ?? 0).toFixed(2)}/mo
                        </p>
                      </div>
                    </div>
                    {savings > 0 && (
                      <span className="text-sm font-mono font-semibold text-neon bg-neon/10 px-3 py-1 rounded-lg">
                        Save ${savings.toFixed(2)}/mo
                      </span>
                    )}
                  </div>
                  {alt.reason && (
                    <p className="text-xs text-dim mt-2">{alt.reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
