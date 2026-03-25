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
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-medium">{data.name}</p>
      <p className="text-gray-400">${Number(data.value).toFixed(2)}/mo</p>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-400">{entry.value}</span>
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
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-sm">Failed to load cost data: {error}</p>
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
      <h1 className="text-2xl font-bold text-white mb-6">Cost Management</h1>

      {/* Spend Summary */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Big number */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Total Monthly Spend
              </h2>
            </div>
            <p className="text-4xl font-bold text-white mt-2">
              ${Number(totalSpend).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Across {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Pie chart */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PieIcon className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No spending data to display</p>
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
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Subscriptions
        </h2>
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-gray-800 border-dashed">
            <p className="text-sm text-gray-500">No active subscriptions.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Tool</th>
                  <th className="text-left px-4 py-3 font-medium">Plan</th>
                  <th className="text-right px-4 py-3 font-medium">Monthly Cost</th>
                  <th className="text-left px-4 py-3 font-medium">Started</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">
                      {sub.tool_name ?? sub.name}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{sub.plan_name ?? sub.plan ?? '--'}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">
                      ${Number(sub.monthly_cost ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {sub.started_at
                        ? new Date(sub.started_at).toLocaleDateString()
                        : '--'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(sub.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Cheaper Alternatives
        </h2>
        {alternatives.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-gray-800 border-dashed">
            <p className="text-sm text-gray-500">No cheaper alternatives found for your current subscriptions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alternatives.map((alt, i) => {
              const savings = (alt.current_cost ?? 0) - (alt.alternative_cost ?? 0);
              return (
                <div
                  key={alt.id ?? i}
                  className="rounded-xl border border-gray-800 bg-gray-900/50 p-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm text-gray-400">
                          <span className="text-white font-medium">{alt.current_tool ?? alt.tool_name}</span>
                          {alt.current_plan && (
                            <span className="text-gray-500 ml-1">({alt.current_plan})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${Number(alt.current_cost ?? 0).toFixed(2)}/mo
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-white font-medium">
                          {alt.alternative_tool ?? alt.alternative_name}
                          {alt.alternative_plan && (
                            <span className="text-gray-500 font-normal ml-1">({alt.alternative_plan})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${Number(alt.alternative_cost ?? 0).toFixed(2)}/mo
                        </p>
                      </div>
                    </div>
                    {savings > 0 && (
                      <span className="text-sm font-semibold text-green-400 bg-green-500/10 px-3 py-1 rounded-lg">
                        Save ${savings.toFixed(2)}/mo
                      </span>
                    )}
                  </div>
                  {alt.reason && (
                    <p className="text-xs text-gray-500 mt-2">{alt.reason}</p>
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
