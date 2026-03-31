const PROD_API_BASE = 'https://all-things-ai-worker.nikhouseholdr.workers.dev';

function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window === 'undefined') return '';

  const { hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocalhost ? '' : PROD_API_BASE;
}

const API_BASE = getApiBase();

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
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
  getToolPlans: () => request('/api/tools/plans'),

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
  getOptimizer: () => request('/api/cost/optimizer'),

  // Recommendations
  getRecommendations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/recommendations${qs ? '?' + qs : ''}`);
  },
  dismissRecommendation: (id) => request(`/api/recommendations/${id}/dismiss`, { method: 'POST' }),

  // Dashboard
  getDashboardSummary: () => request('/api/dashboard/summary'),

  // Preferences
  getPreferences: () => request('/api/preferences'),
  updatePreferences: (data) => request('/api/preferences', { method: 'PUT', body: JSON.stringify(data) }),

  // Compare
  getModelAlternatives: (slug) => request(`/api/models/alternatives${slug ? '?model=' + slug : ''}`),
  compareModels: (slugs) => request(`/api/models/compare?models=${slugs.join(',')}`),

  // Advisor
  getTaskProfiles: () => request('/api/advisor/tasks'),
  getTaskMatrix: (task) => request(`/api/advisor/matrix${task ? '?task=' + task : ''}`),
  getTaskRecommendation: (task) => request(`/api/advisor/recommend?task=${task}`),
  getCompositeScores: () => request('/api/advisor/composite-scores'),
  getRankings: () => request('/api/advisor/rankings'),
  getModelAvailability: () => request('/api/advisor/model-availability'),
  getTaskRankings: (task) => request(`/api/advisor/task-rankings?task=${task}`),
  getSuccessRateRankings: () => request('/api/advisor/success-rate-rankings'),

  // Tool Rankings
  getToolRankings: () => request('/api/tools/rankings'),
  getPluginRankings: () => request('/api/coding-tools/rankings'),

  // Advisor Chat
  chatWithAdvisor: (messages) => request('/api/advisor/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  }),

  // Coding Tools
  getCodingTools: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/coding-tools${qs ? '?' + qs : ''}`);
  },
  getCodingTool: (slug) => request(`/api/coding-tools/${slug}`),
  getCodingToolCategories: () => request('/api/coding-tools/categories'),
  getCodingToolTags: () => request('/api/coding-tools/tags'),
  getToolRecommendations: (data) => request('/api/coding-tools/recommend', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Industry Alerts
  getAlerts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/alerts${qs ? '?' + qs : ''}`);
  },
  getUnreadAlertCount: () => request('/api/alerts/unread-count'),
  markAlertRead: (id) => request(`/api/alerts/${id}/read`, { method: 'POST' }),
  markAllAlertsRead: () => request('/api/alerts/read-all', { method: 'POST' }),
  dismissAlert: (id) => request(`/api/alerts/${id}/dismiss`, { method: 'POST' }),
};
