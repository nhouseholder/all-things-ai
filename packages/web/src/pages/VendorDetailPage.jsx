import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Users, DollarSign, TrendingUp, Globe, ExternalLink, Newspaper } from 'lucide-react';
import { api } from '../lib/api.js';
import { setPageTitle, timeAgo } from '../lib/format.js';
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

function Stat({ label, value, icon: Icon, trust, sourceUrl }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          {Icon ? <Icon className="w-3.5 h-3.5" aria-hidden /> : null}
          {label}
        </span>
        <TrustChip trust={trust} sourceUrl={sourceUrl} showHost={false} />
      </div>
      <p className="text-xl sm:text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function VendorDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['vendor', slug],
    queryFn: () => api.getVendor(slug),
    enabled: !!slug,
  });

  const vendor = data?.vendor;
  setPageTitle(vendor?.name || 'Vendor');

  if (isLoading) return <div className="max-w-5xl mx-auto px-4 py-10 text-gray-400">Loading…</div>;
  if (error || !vendor) return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <p className="text-red-400">Vendor not found.</p>
      <Link to="/vendors" className="text-blue-400 text-sm underline">Back to vendors</Link>
    </div>
  );

  const models = data.models || [];
  const news = data.news || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Link to="/vendors" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" aria-hidden /> All vendors
      </Link>

      <header className="mb-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl" aria-hidden>{flag(vendor.hq_country)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-white">{vendor.name}</h1>
              {vendor.status && (
                <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border border-gray-700 text-gray-300 bg-gray-900">
                  {vendor.status}{vendor.parent_company ? ` · ${vendor.parent_company}` : ''}
                </span>
              )}
              <TrustChip trust={vendor.source_trust} sourceUrl={vendor.source_url} />
            </div>
            {vendor.legal_name && <p className="text-xs text-gray-500 mt-1">{vendor.legal_name}</p>}
            <p className="text-sm text-gray-400 mt-1">
              {vendor.hq_city || vendor.hq_country || '—'}
              {vendor.founded_year ? ` · Founded ${vendor.founded_year}` : ''}
              {vendor.ticker ? ` · ${vendor.ticker}` : ''}
            </p>
            {vendor.description && (
              <p className="text-base text-gray-200 mt-3 leading-snug max-w-3xl">{vendor.description}</p>
            )}
            {vendor.website_url && (
              <a href={vendor.website_url} target="_blank" rel="noreferrer noopener"
                 className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2">
                <Globe className="w-3.5 h-3.5" aria-hidden /> {vendor.website_url.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3 h-3" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <Stat label="Employees" icon={Users}
              value={vendor.employee_count ? vendor.employee_count.toLocaleString() : '—'}
              trust={vendor.source_trust} sourceUrl={vendor.source_url} />
        <Stat label="AI headcount" icon={Building2}
              value={vendor.ai_headcount ? vendor.ai_headcount.toLocaleString() : '—'}
              trust={vendor.source_trust} sourceUrl={vendor.source_url} />
        <Stat label="Total funding" icon={DollarSign}
              value={fmtUsd(vendor.total_funding_usd)}
              trust={vendor.source_trust} sourceUrl={vendor.source_url} />
        <Stat label="Valuation" icon={TrendingUp}
              value={fmtUsd(vendor.latest_valuation_usd)}
              trust={vendor.source_trust} sourceUrl={vendor.source_url} />
        <Stat label="R&D capex" icon={DollarSign}
              value={fmtUsd(vendor.rnd_commitment_usd)}
              trust={vendor.source_trust} sourceUrl={vendor.source_url} />
      </section>

      {vendor.investors?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-2">Investors</h2>
          <div className="flex flex-wrap gap-2">
            {vendor.investors.map((inv) => (
              <span key={inv} className="px-2.5 py-1 rounded-full text-xs bg-gray-900 border border-gray-800 text-gray-200">
                {inv}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-3">Models shipped by {vendor.name}</h2>
        {models.length === 0 ? (
          <p className="text-sm text-gray-500">No models linked to this vendor yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {models.map((m) => (
              <Link key={m.id} to={`/models/${m.slug}`}
                    className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:border-blue-500/50 transition">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {m.family || '—'}
                    {m.context_window ? ` · ${(m.context_window / 1000).toFixed(0)}K ctx` : ''}
                  </p>
                </div>
                <span className="text-sm text-blue-400 font-semibold ml-3 whitespace-nowrap">
                  {m.composite_score != null ? m.composite_score.toFixed(1) : '—'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-gray-400" aria-hidden /> Recent news
        </h2>
        {news.length === 0 ? (
          <p className="text-sm text-gray-500">No news tagged to this vendor yet.</p>
        ) : (
          <ul className="space-y-2">
            {news.map((n) => (
              <li key={n.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                <a href={n.source_url} target="_blank" rel="noreferrer noopener"
                   className="text-sm text-white hover:text-blue-300 font-medium">
                  {n.title}
                </a>
                <p className="text-xs text-gray-500 mt-0.5">
                  {n.source} · {timeAgo(n.detected_at)} · {n.event_type}
                </p>
                {n.summary && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{n.summary}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
