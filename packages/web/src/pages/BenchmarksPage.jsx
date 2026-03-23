import { useState, useEffect } from 'react';
import {
  Loader2,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import { api } from '../lib/api.js';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'coding', label: 'Coding' },
  { value: 'debugging', label: 'Debugging' },
  { value: 'reasoning', label: 'Reasoning' },
  { value: 'nuance', label: 'Nuance' },
];

function scoreColor(score) {
  if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-400' };
  if (score >= 60) return { bg: 'bg-emerald-500', text: 'text-emerald-400' };
  if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-400' };
  if (score >= 20) return { bg: 'bg-orange-500', text: 'text-orange-400' };
  return { bg: 'bg-red-500', text: 'text-red-400' };
}

function ScoreCell({ score }) {
  if (score == null) return <span className="text-gray-700">--</span>;
  const { bg, text } = scoreColor(score);
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${bg}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${text}`}>{score.toFixed(1)}</span>
    </div>
  );
}

function CustomBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-medium">{data.payload.name}</p>
      <p className="text-gray-400">Score: {Number(data.value).toFixed(1)}</p>
    </div>
  );
}

function ModelToolsModal({ model, onClose }) {
  const tools = model.available_in ?? model.tools ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-1">{model.name ?? model.model_name}</h3>
        <p className="text-xs text-gray-500 mb-4">Available in the following tools/plans:</p>
        {tools.length === 0 ? (
          <p className="text-sm text-gray-500">No tool/plan information available.</p>
        ) : (
          <ul className="space-y-2">
            {tools.map((t, i) => (
              <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-800">
                <span className="text-sm text-white">{typeof t === 'string' ? t : t.tool_name ?? t.name}</span>
                {typeof t !== 'string' && t.plan_name && (
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
                    {t.plan_name}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm font-medium py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function BenchmarksPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);

  useEffect(() => {
    async function loadBenchmarks() {
      setLoading(true);
      try {
        const res = await api.getBenchmarks(category || undefined);
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBenchmarks();
  }, [category]);

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
        <p className="text-red-400 text-sm">Failed to load benchmarks: {error}</p>
      </div>
    );
  }

  // API returns { benchmarks: { coding: [...], debugging: [...] }, categories: [...] }
  // Transform into models array with scores map
  const rawBenchmarks = data?.benchmarks ?? {};
  const allEntries = Object.values(rawBenchmarks).flat();

  // Build models map: { slug: { name, vendor, slug, scores: { benchmarkName: score } } }
  const modelsMap = {};
  for (const entry of allEntries) {
    const slug = entry.model_slug ?? entry.slug;
    if (!modelsMap[slug]) {
      modelsMap[slug] = {
        name: entry.model_name ?? entry.name,
        slug,
        vendor: entry.vendor,
        scores: {},
      };
    }
    modelsMap[slug].scores[entry.benchmark_name] = entry.score;
  }
  const models = Object.values(modelsMap);

  // Derive benchmark names from all entries
  const derivedBenchmarkNames = [...new Set(allEntries.map((e) => e.benchmark_name))];

  // Compute average score per model for the bar chart
  const chartData = models
    .map((m) => {
      const scores = Object.values(m.scores ?? {}).filter((v) => v != null);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { name: m.name ?? m.model_name, avg: Number(avg.toFixed(1)) };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 15);

  const barColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#10b981';
    if (score >= 40) return '#eab308';
    if (score >= 20) return '#f97316';
    return '#ef4444';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Benchmarks</h1>

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

      {models.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-gray-800 border-dashed">
          <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No benchmark data available.</p>
        </div>
      ) : (
        <>
          {/* Bar Chart - top models */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Top Models {category && `- ${CATEGORIES.find((c) => c.value === category)?.label}`}
            </h2>
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
              <ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 32)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    tick={{ fill: '#d1d5db', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={20}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={barColor(entry.avg)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Benchmark Table */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Detailed Scores
            </h2>
            <div className="rounded-xl border border-gray-800 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-900 text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium sticky left-0 bg-gray-900 z-10">
                      Model
                    </th>
                    {derivedBenchmarkNames.map((name) => (
                      <th key={name} className="text-left px-4 py-3 font-medium whitespace-nowrap">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr
                      key={model.slug ?? model.name}
                      className="border-t border-gray-800 hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-4 py-2.5 sticky left-0 bg-gray-950 z-10">
                        <button
                          onClick={() => setSelectedModel(model)}
                          className="text-white font-medium hover:text-blue-400 transition-colors text-left"
                        >
                          {model.name ?? model.model_name}
                        </button>
                      </td>
                      {derivedBenchmarkNames.map((name) => (
                        <td key={name} className="px-4 py-2.5">
                          <ScoreCell score={model.scores?.[name]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Model Tools Modal */}
      {selectedModel && (
        <ModelToolsModal model={selectedModel} onClose={() => setSelectedModel(null)} />
      )}
    </div>
  );
}
