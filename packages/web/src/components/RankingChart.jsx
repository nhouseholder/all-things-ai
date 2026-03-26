import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import ChartContainer from './ChartContainer.jsx';
import { quartileColor, quartileClass } from '../lib/chart-utils.js';

function ScoreBar({ value, color = 'bg-blue-500' }) {
  const pct = value != null ? Math.min(100, Math.max(0, value)) : null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        {pct != null ? (
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        ) : (
          <div className="h-full w-full bg-gray-700/40 rounded-full" />
        )}
      </div>
      <span className="text-[10px] font-mono text-gray-400 w-8 text-right tabular-nums">
        {pct != null ? pct.toFixed(0) : '—'}
      </span>
    </div>
  );
}

function BreakdownTooltip({ active, payload, dimensions }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs max-w-xs">
      <p className="font-semibold text-white mb-2">{data.name}</p>
      <div className="space-y-1.5">
        {dimensions.map(d => (
          <div key={d.key} className="flex items-center justify-between gap-4">
            <span className="text-gray-400">{d.label}</span>
            <span className="font-mono text-gray-200">
              {data[d.key] != null ? Number(data[d.key]).toFixed(1) : '—'}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-700 mt-2 pt-2 flex justify-between">
        <span className="text-gray-400 font-medium">Composite</span>
        <span className="font-mono text-white font-semibold">{Number(data.composite_score).toFixed(1)}</span>
      </div>
    </div>
  );
}

/**
 * Shared ranking chart component for Tools and Plugins pages.
 *
 * @param {Object[]} rankings - sorted array of ranked items
 * @param {string} nameKey - key for the item name (default: 'name')
 * @param {Object[]} dimensions - array of { key, label, color } for breakdown bars
 * @param {string} title - chart section title
 * @param {string} subtitle - chart section subtitle
 */
export default function RankingChart({ rankings, nameKey = 'name', dimensions, title, subtitle }) {
  const [expanded, setExpanded] = useState(null);

  if (!rankings?.length) return null;

  const chartData = rankings.map(r => ({
    ...r,
    name: r[nameKey],
  }));

  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 mb-3">
        <ChartContainer width="100%" height={Math.max(250, chartData.length * 36)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#e5e7eb', fontSize: 11 }} />
            <Tooltip content={<BreakdownTooltip dimensions={dimensions} />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
            <Bar dataKey="composite_score" radius={[0, 4, 4, 0]} barSize={22}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={quartileColor(i, chartData.length)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Expandable breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {chartData.map((item, idx) => {
          const isExpanded = expanded === item.slug;
          return (
            <div
              key={item.slug || idx}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">#{idx + 1}</span>
                  <span className="text-sm font-semibold text-white">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono font-bold ${quartileClass(idx, chartData.length).replace('bg-', 'text-')}`}>
                    {Number(item.composite_score).toFixed(1)}
                  </span>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.slug)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Compact bar */}
              <ScoreBar value={item.composite_score} color={quartileClass(idx, chartData.length)} />

              {/* Expanded dimension breakdown */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                  {dimensions.map(d => (
                    <div key={d.key}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{d.label}</span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {item[d.key] != null ? Number(item[d.key]).toFixed(1) : '—'}
                        </span>
                      </div>
                      <ScoreBar value={item[d.key]} color={d.color || 'bg-blue-500'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
