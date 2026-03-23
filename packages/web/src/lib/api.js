const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  // Feed
  getFeed: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/feed${qs ? '?' + qs : ''}`);
  },
  markRead: (id) => request(`/api/feed/${id}/read`, { method: 'POST' }),
  toggleBookmark: (id) => request(`/api/feed/${id}/bookmark`, { method: 'POST' }),

  // Tools
  getTools: () => request('/api/tools'),
  getTool: (slug) => request(`/api/tools/${slug}`),

  // Models
  getModels: () => request('/api/models'),
  getModel: (slug) => request(`/api/models/${slug}`),
  getModelPricing: () => request('/api/models/pricing'),

  // Benchmarks
  getBenchmarks: (category) => request(`/api/benchmarks${category ? '?category=' + category : ''}`),
  compareBenchmarks: (model_slugs, categories) =>
    request('/api/benchmarks/compare', {
      method: 'POST',
      body: JSON.stringify({ model_slugs, categories }),
    }),

  // Cost
  getCostSummary: () => request('/api/cost/summary'),
  getSubscriptions: () => request('/api/cost/subscriptions'),
  addSubscription: (data) => request('/api/cost/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  removeSubscription: (id) => request(`/api/cost/subscriptions/${id}`, { method: 'DELETE' }),
  getAlternatives: () => request('/api/cost/alternatives'),

  // Recommendations
  getRecommendations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/recommendations${qs ? '?' + qs : ''}`);
  },
  dismissRecommendation: (id) => request(`/api/recommendations/${id}/dismiss`, { method: 'POST' }),

  // Preferences
  getPreferences: () => request('/api/preferences'),
  updatePreferences: (data) => request('/api/preferences', { method: 'PUT', body: JSON.stringify(data) }),
};
