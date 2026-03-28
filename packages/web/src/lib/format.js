/**
 * Shared formatting utilities — eliminates duplication across pages.
 */

// ── Score colors (composite score 0-100 → tailwind class) ─────────────

export function compositeColor(score) {
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-blue-400';
  if (score >= 55) return 'text-yellow-400';
  return 'text-orange-400';
}

export function compositeBarColor(score) {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#3b82f6';
  if (score >= 55) return '#eab308';
  return '#f97316';
}

export function compositeBarBg(score) {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 55) return 'bg-yellow-500';
  return 'bg-orange-500';
}

export function compositeBadgeBg(score) {
  if (score >= 85) return 'bg-green-500/20 text-green-400';
  if (score >= 70) return 'bg-blue-500/20 text-blue-400';
  if (score >= 55) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-orange-500/20 text-orange-400';
}

export function scoreColor(score) {
  if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-400' };
  if (score >= 60) return { bg: 'bg-emerald-500', text: 'text-emerald-400' };
  if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-400' };
  if (score >= 20) return { bg: 'bg-orange-500', text: 'text-orange-400' };
  return { bg: 'bg-red-500', text: 'text-red-400' };
}

// ── Price formatting ──────────────────────────────────────────────────

/** Format token price per MTok — $0 = Free, null = dash */
export function formatTokenPrice(val) {
  if (val == null) return '—';
  if (val === 0) return 'Free';
  return `$${Number(val).toFixed(2)}`;
}

/** Format subscription price — handles BYOK detection via plan name */
export function formatSubPrice(price, planName) {
  if (price == null) return '—';
  if (price === 0) {
    if (planName && /byok/i.test(planName)) return 'BYOK';
    return 'Free';
  }
  return `$${Number(price).toFixed(0)}/mo`;
}

// ── Time formatting ───────────────────────────────────────────────────

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Page title ────────────────────────────────────────────────────────

const BASE_TITLE = 'All Things AI';

export function setPageTitle(subtitle) {
  document.title = subtitle ? `${subtitle} — ${BASE_TITLE}` : BASE_TITLE;
}
