import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

// Feed
export function useFeed(params) {
  return useQuery({ queryKey: ['feed', params], queryFn: () => api.getFeed(params) });
}

export function useWhatsNew() {
  return useQuery({ queryKey: ['whats-new'], queryFn: () => api.getWhatsNew() });
}

// Tools
export function useTools() {
  return useQuery({ queryKey: ['tools'], queryFn: api.getTools });
}

export function useToolPlans() {
  return useQuery({ queryKey: ['tools', 'plans'], queryFn: api.getToolPlans });
}

export function useCodingPlans() {
  return useQuery({ queryKey: ['tools', 'coding-plans'], queryFn: api.getCodingPlans });
}

// Models
export function useModels() {
  return useQuery({ queryKey: ['models'], queryFn: api.getModels });
}

export function useModelDetail(slug) {
  return useQuery({
    queryKey: ['model', slug],
    queryFn: () => api.getModel(slug),
    enabled: !!slug,
  });
}

// Benchmarks
export function useBenchmarks(category) {
  return useQuery({ queryKey: ['benchmarks', category], queryFn: () => api.getBenchmarks(category) });
}

// Dashboard
export function useDashboardSummary() {
  return useQuery({ queryKey: ['dashboard', 'summary'], queryFn: api.getDashboardSummary });
}

// Cost
export function useCostSummary() {
  return useQuery({ queryKey: ['cost', 'summary'], queryFn: api.getCostSummary });
}

export function useSubscriptions() {
  return useQuery({ queryKey: ['cost', 'subscriptions'], queryFn: api.getSubscriptions });
}

export function useAlternatives() {
  return useQuery({ queryKey: ['cost', 'alternatives'], queryFn: api.getAlternatives });
}

export function useOptimizer() {
  return useQuery({ queryKey: ['cost', 'optimizer'], queryFn: api.getOptimizer });
}

// Recommendations
export function useRecommendations(params) {
  return useQuery({ queryKey: ['recommendations', params], queryFn: () => api.getRecommendations(params) });
}

export function useDismissRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.dismissRecommendation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });
}

// Preferences
export function usePreferences() {
  return useQuery({ queryKey: ['preferences'], queryFn: api.getPreferences });
}

// Advisor
export function useRankings() {
  return useQuery({ queryKey: ['advisor', 'rankings'], queryFn: api.getRankings });
}

export function useCompositeScores() {
  return useQuery({ queryKey: ['advisor', 'composite-scores'], queryFn: api.getCompositeScores });
}

export function useTaskMatrix(task) {
  return useQuery({ queryKey: ['advisor', 'matrix', task], queryFn: () => api.getTaskMatrix(task) });
}

export function useModelPricing() {
  return useQuery({ queryKey: ['models', 'pricing'], queryFn: api.getModelPricing });
}

// Compare
export function useModelAlternatives(slug) {
  return useQuery({
    queryKey: ['models', 'alternatives', slug],
    queryFn: () => api.getModelAlternatives(slug),
    enabled: slug !== undefined,
  });
}

export function useCompareModels(slugs) {
  return useQuery({
    queryKey: ['models', 'compare', slugs],
    queryFn: () => api.compareModels(slugs),
    enabled: slugs?.length >= 2,
  });
}

export function useSuccessRateRankings() {
  return useQuery({ queryKey: ['advisor', 'success-rate-rankings'], queryFn: api.getSuccessRateRankings });
}

export function usePlanBurn(params) {
  return useQuery({
    queryKey: ['advisor', 'plan-burn', params],
    queryFn: () => api.getPlanBurn(params),
  });
}

// Tool & Plugin Rankings
export function useToolRankings() {
  return useQuery({ queryKey: ['tools', 'rankings'], queryFn: api.getToolRankings });
}

export function usePluginRankings() {
  return useQuery({ queryKey: ['coding-tools', 'rankings'], queryFn: api.getPluginRankings });
}

// Task Profiles
export function useTaskProfiles() {
  return useQuery({ queryKey: ['advisor', 'task-profiles'], queryFn: api.getTaskProfiles });
}

// Coding Tools
export function useCodingTools(params) {
  return useQuery({ queryKey: ['coding-tools', params], queryFn: () => api.getCodingTools(params) });
}

export function useCodingToolCategories() {
  return useQuery({ queryKey: ['coding-tools', 'categories'], queryFn: api.getCodingToolCategories });
}

export function useCodingToolTags() {
  return useQuery({ queryKey: ['coding-tools', 'tags'], queryFn: api.getCodingToolTags });
}

// Industry Alerts
export function useAlerts(params) {
  return useQuery({ queryKey: ['alerts', params], queryFn: () => api.getAlerts(params) });
}

export function useUnreadAlertCount() {
  return useQuery({
    queryKey: ['alerts', 'unread-count'],
    queryFn: api.getUnreadAlertCount,
    refetchInterval: 5 * 60 * 1000, // poll every 5 min
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.markAlertRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useMarkAllAlertsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllAlertsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDismissAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.dismissAlert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
