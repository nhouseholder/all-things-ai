/**
 * Shared auth middleware — timing-safe admin key comparison.
 * Single source of truth: imported by index.js, cost.js, preferences.js, feed.js, recommendations.js.
 */

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 * Falls back to byte-level comparison if crypto.subtle.timingSafeEqual is unavailable.
 */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.byteLength !== bufB.byteLength) return false;
  let result = 0;
  for (let i = 0; i < bufA.byteLength; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

/**
 * Hono middleware that requires a valid Bearer token matching ADMIN_API_KEY.
 * Usage: router.post('/path', requireAdmin(), handler)
 */
export function requireAdmin() {
  return async (c, next) => {
    const auth = c.req.header('Authorization');
    const adminKey = c.env.ADMIN_API_KEY;
    if (!adminKey || !auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const expected = `Bearer ${adminKey}`;
    if (!timingSafeEqual(auth, expected)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
  };
}
