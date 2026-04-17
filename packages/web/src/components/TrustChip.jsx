const STYLES = {
  gold:       'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  silver:     'bg-slate-400/15 text-slate-200 border-slate-400/30',
  bronze:     'bg-amber-700/20 text-amber-300 border-amber-700/40',
  unverified: 'bg-gray-700/40 text-gray-400 border-gray-700',
};

function hostOf(url) {
  if (!url) return null;
  try { return new URL(url).host.replace(/^www\./, ''); } catch { return null; }
}

export default function TrustChip({ trust, sourceUrl, showHost = true, className = '' }) {
  const t = trust || 'unverified';
  const host = hostOf(sourceUrl);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${STYLES[t] || STYLES.unverified}`}
            title={`Trust tier: ${t}`}>
        {t}
      </span>
      {showHost && host && sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noreferrer noopener"
           className="text-[10px] text-gray-500 hover:text-blue-400 underline">
          {host}
        </a>
      )}
    </span>
  );
}

export { STYLES as trustStyles };
