/**
 * Quartile-based bar coloring for ranked charts.
 * Q1 (top 25%) = green, Q2 = blue, Q3 = yellow, Q4 = orange/red
 */

const QUARTILE_COLORS = {
  q1: '#22c55e', // green-500 — top 25%
  q2: '#3b82f6', // blue-500 — 25-50%
  q3: '#eab308', // yellow-500 — 50-75%
  q4: '#f97316', // orange-500 — bottom 25%
};

/**
 * Get bar color based on position in a sorted dataset.
 * @param {number} index - 0-based position in the sorted array
 * @param {number} total - total number of items
 * @returns {string} hex color
 */
export function quartileColor(index, total) {
  if (total <= 1) return QUARTILE_COLORS.q1;
  const pct = index / (total - 1); // 0 = best, 1 = worst
  if (pct <= 0.25) return QUARTILE_COLORS.q1;
  if (pct <= 0.50) return QUARTILE_COLORS.q2;
  if (pct <= 0.75) return QUARTILE_COLORS.q3;
  return QUARTILE_COLORS.q4;
}

/**
 * Tailwind class version for CSS-based bars.
 */
export function quartileClass(index, total) {
  if (total <= 1) return 'bg-green-500';
  const pct = index / (total - 1);
  if (pct <= 0.25) return 'bg-green-500';
  if (pct <= 0.50) return 'bg-blue-500';
  if (pct <= 0.75) return 'bg-yellow-500';
  return 'bg-orange-500';
}
