/**
 * Rate limiting middleware using Cloudflare KV.
 * Implements a sliding window counter per IP.
 *
 * @param {Object} opts
 * @param {number} opts.max - Max requests per window (default: 60)
 * @param {number} opts.windowSec - Window size in seconds (default: 60)
 */
export function rateLimit({ max = 60, windowSec = 60 } = {}) {
  return async (c, next) => {
    const kv = c.env.RATE_LIMIT;
    if (!kv) {
      // KV not bound — skip rate limiting (dev mode)
      return next();
    }

    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const key = `rl:${ip}:${Math.floor(Date.now() / (windowSec * 1000))}`;

    const current = parseInt(await kv.get(key) || '0', 10);

    if (current >= max) {
      return c.json(
        { error: 'Too many requests', retry_after: windowSec },
        429,
        { 'Retry-After': String(windowSec) }
      );
    }

    // Increment counter with TTL
    await kv.put(key, String(current + 1), { expirationTtl: windowSec * 2 });

    // Add rate limit headers
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(max - current - 1));

    return next();
  };
}
