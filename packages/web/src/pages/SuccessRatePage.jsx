import { Loader2, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import ChartContainer from '../components/ChartContainer.jsx';
import { useSuccessRateRankings } from '../lib/hooks.js';
import { quartileColor } from '../lib/chart-utils.js';

function SuccessRateTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-medium">{d.name}</p>
      <p className="text-gray-400">Success Rate: {d.rate}%</p>
      <p className="text-gray-500">{d.vendor} &middot; {d.tasks} tasks evaluated</p>
    </div>
  );
}

export default function SuccessRatePage() {
  const { data, isLoading, error: queryError } = useSuccessRateRankings();
  const error = queryError?.message;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Real World Success Rate</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Real World Success Rate</h1>
        <div className="text-center py-16">
          <p className="text-red-400 text-sm">Failed to load data: {error}</p>
        </div>
      </div>
    );
  }

  const models = data ?? [];

  if (models.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Real World Success Rate</h1>
        <div className="text-center py-12 rounded-xl border border-gray-800 border-dashed">
          <Target className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No success rate data available yet.</p>
        </div>
      </div>
    );
  }

  const chartData = models.map((m) => ({
    name: m.model_name,
    rate: m.avg_success_rate,
    vendor: m.vendor,
    tasks: m.tasks_evaluated,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Real World Success Rate</h1>
      <p className="text-sm text-gray-400 mb-6">
        Average first-attempt success rate across all coding tasks. Higher = fewer retries needed.
      </p>

      {/* Bar Chart */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-green-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Models Ranked by Success Rate
          </h2>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <ChartContainer width="100%" height={Math.max(300, chartData.length * 32)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
              <YAxis
                dataKey="name"
                type="category"
                width={160}
                tick={{ fill: '#d1d5db', fontSize: 11 }}
              />
              <Tooltip content={<SuccessRateTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={quartileColor(i, chartData.length)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Detailed Rankings
        </h2>
        <div className="rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-900 text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium w-10">#</th>
                <th className="text-left px-4 py-3 font-medium">Model</th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-right px-4 py-3 font-medium">Success Rate</th>
                <th className="text-right px-4 py-3 font-medium">Tasks Evaluated</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => (
                <tr
                  key={m.model_slug}
                  className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-4 py-2.5 text-gray-500 font-medium">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-white font-medium">{m.model_name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">{m.vendor}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, m.avg_success_rate)}%`,
                            backgroundColor: quartileColor(i, models.length),
                          }}
                        />
                      </div>
                      <span className="text-white font-mono font-medium w-12 text-right">
                        {m.avg_success_rate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-400">{m.tasks_evaluated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
