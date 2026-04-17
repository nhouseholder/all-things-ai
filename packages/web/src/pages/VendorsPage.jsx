import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, DollarSign, Scale } from 'lucide-react';
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

export default function VendorsPage() {
  setPageTitle('Vendors');
  const [sort, setSort] = useState('funding');
  const [country, setCountry] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors', sort, country],
    queryFn: () => api.getVendors({ sort, ...(country ? { country } : {}) }),
  });

  const vendors = data?.vendors || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-400" aria-hidden />
            AI Vendors
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Company facts for every lab behind the models we track. Every number cites its source.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={country} onChange={(e) => setCountry(e.target.value)}
                  className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2">
            <option value="">All countries</option>
            <option value="CN">🇨🇳 China</option>
            <option value="US">🇺🇸 United States</option>
            <option value="FR">🇫🇷 France</option>
            <option value="GB">🇬🇧 UK</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
                  className="bg-gray-900 border border-gray-800 text-sm text-gray-200 rounded-lg px-3 py-2">
            <option value="funding">Sort: Funding</option>
            <option value="valuation">Sort: Valuation</option>
            <option value="employees">Sort: Employees</option>
            <option value="name">Sort: Name</option>
          </select>
          <Link to="/compare/vendors"
                className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm flex items-center gap-1.5 hover:bg-blue-500/20">
            <Scale className="w-4 h-4" aria-hidden /> Compare
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-gray-400">Loading vendors...</p>}
      {error && <p className="text-red-400">Failed to load vendors.</p>}

      {!isLoading && vendors.length === 0 && (
        <p className="text-gray-400">No vendors match those filters yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <Link key={v.slug} to={`/vendors/${v.slug}`}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/50 transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>{flag(v.hq_country)}</span>
                  <h2 className="text-lg font-semibold text-white group-hover:text-blue-300">{v.name}</h2>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {v.hq_city || v.hq_country || '—'}
                  {v.founded_year ? ` · est. ${v.founded_year}` : ''}
                  {v.status ? ` · ${v.status}` : ''}
                </p>
              </div>
              <TrustChip trust={v.source_trust} sourceUrl={v.source_url} showHost={false} />
            </div>

            {v.description && (
              <p className="text-sm text-gray-300 leading-snug mb-4 line-clamp-3">{v.description}</p>
            )}

            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-950/60 rounded-lg px-3 py-2 border border-gray-800">
                <dt className="text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" aria-hidden />Employees</dt>
                <dd className="text-gray-100 font-medium mt-0.5">
                  {v.employee_count ? v.employee_count.toLocaleString() : '—'}
                  {v.ai_headcount ? <span className="text-gray-500"> ({v.ai_headcount.toLocaleString()} AI)</span> : null}
                </dd>
              </div>
              <div className="bg-gray-950/60 rounded-lg px-3 py-2 border border-gray-800">
                <dt className="text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" aria-hidden />Funding</dt>
                <dd className="text-gray-100 font-medium mt-0.5">{fmtUsd(v.total_funding_usd)}</dd>
              </div>
              <div className="bg-gray-950/60 rounded-lg px-3 py-2 border border-gray-800">
                <dt className="text-gray-500">Valuation</dt>
                <dd className="text-gray-100 font-medium mt-0.5">{fmtUsd(v.latest_valuation_usd)}</dd>
              </div>
              <div className="bg-gray-950/60 rounded-lg px-3 py-2 border border-gray-800">
                <dt className="text-gray-500">R&D capex</dt>
                <dd className="text-gray-100 font-medium mt-0.5">{fmtUsd(v.rnd_commitment_usd)}</dd>
              </div>
            </dl>

            {v.investors?.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-3 truncate">
                Investors: <span className="text-gray-300">{v.investors.slice(0, 4).join(', ')}</span>
                {v.investors.length > 4 ? ` +${v.investors.length - 4}` : ''}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
