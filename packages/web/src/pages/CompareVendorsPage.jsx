import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Scale, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api.js';
import { setPageTitle } from '../lib/format.js';
import TrustChip from '../components/TrustChip.jsx';

function fmtUsd(n) {
  if (n == null) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

function flag(country) {
  if (!country) return '🌐';
  const code = country.toUpperCase();
  if (code.length !== 2) return '🌐';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + code.charCodeAt(0) - 65) + String.fromCodePoint(A + code.charCodeAt(1) - 65);
}

const ROWS = [
  { label: 'HQ', get: (v) => `${flag(v.hq_country)} ${v.hq_city || v.hq_country || '—'}` },
  { label: 'Founded', get: (v) => v.founded_year || '—' },
  { label: 'Status', get: (v) => v.status || '—' },
  { label: 'Employees', get: (v) => v.employee_count ? v.employee_count.toLocaleString() : '—' },
  { label: 'AI headcount', get: (v) => v.ai_headcount ? v.ai_headcount.toLocaleString() : '—' },
  { label: 'Total funding', get: (v) => fmtUsd(v.total_funding_usd), highlight: 'max', key: 'total_funding_usd' },
  { label: 'Valuation', get: (v) => fmtUsd(v.latest_valuation_usd), highlight: 'max', key: 'latest_valuation_usd' },
  { label: 'R&D capex', get: (v) => fmtUsd(v.rnd_commitment_usd), highlight: 'max', key: 'rnd_commitment_usd' },
  { label: 'Top investors', get: (v) => (v.investors || []).slice(0, 3).join(', ') || '—' },
];

export default function CompareVendorsPage() {
  setPageTitle('Compare Vendors');
  const [params, setParams] = useSearchParams();
  const slugs = (params.get('slugs') || 'moonshot-ai,minimax,zhipu-ai,alibaba-qwen')
    .split(',').map((s) => s.trim()).filter(Boolean);

  const { data: allData } = useQuery({
    queryKey: ['vendors-all'],
    queryFn: () => api.getVendors({ sort: 'name' }),
  });
  const allVendors = allData?.vendors || [];

  const { data, isLoading } = useQuery({
    queryKey: ['vendors-compare', slugs.join(',')],
    queryFn: () => api.compareVendors(slugs),
    enabled: slugs.length > 0,
  });
  const vendors = data?.vendors || [];

  const maxByKey = useMemo(() => {
    const out = {};
    for (const row of ROWS) {
      if (row.highlight === 'max' && row.key) {
        out[row.key] = Math.max(...vendors.map((v) => v[row.key] || 0));
      }
    }
    return out;
  }, [vendors]);

  function toggle(slug) {
    const next = slugs.includes(slug)
      ? slugs.filter((s) => s !== slug)
      : [...slugs, slug].slice(0, 6);
    setParams({ slugs: next.join(',') });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Link to="/vendors" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> All vendors
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 mb-2">
        <Scale className="w-7 h-7 text-blue-400" aria-hidden /> Compare vendors
      </h1>
      <p className="text-sm text-gray-400 mb-6">Pick up to 6. Green = max in column.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {allVendors.map((v) => {
          const on = slugs.includes(v.slug);
          return (
            <button key={v.slug} onClick={() => toggle(v.slug)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      on
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                        : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}>
              {flag(v.hq_country)} {v.name}
            </button>
          );
        })}
      </div>

      {isLoading && <p className="text-gray-400">Loading…</p>}

      {!isLoading && vendors.length > 0 && (
        <div className="overflow-x-auto border border-gray-800 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left text-xs uppercase tracking-wide text-gray-500 px-4 py-3 sticky left-0 bg-gray-900">Stat</th>
                {vendors.map((v) => (
                  <th key={v.slug} className="text-left px-4 py-3 min-w-[180px]">
                    <Link to={`/vendors/${v.slug}`} className="text-white font-semibold hover:text-blue-300">
                      {flag(v.hq_country)} {v.name}
                    </Link>
                    <div className="mt-1">
                      <TrustChip trust={v.source_trust} sourceUrl={v.source_url} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {ROWS.map((row) => (
                <tr key={row.label} className="hover:bg-gray-900/50">
                  <td className="text-xs text-gray-500 px-4 py-3 sticky left-0 bg-gray-950">{row.label}</td>
                  {vendors.map((v) => {
                    const value = row.get(v);
                    const isMax = row.highlight === 'max' && row.key && (v[row.key] || 0) > 0 && (v[row.key] || 0) === maxByKey[row.key];
                    return (
                      <td key={v.slug}
                          className={`px-4 py-3 ${isMax ? 'text-green-400 font-semibold' : 'text-gray-200'}`}>
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
