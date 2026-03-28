/**
 * Fetch with timeout — prevents hung external services from exhausting Worker CPU budget.
 * Default timeout: 10 seconds.
 */
const DEFAULT_TIMEOUT = 10000;

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
