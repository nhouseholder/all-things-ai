import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';

// Feed
export function useFeed(params) {
  return useQuery({ queryKey: ['feed', params], queryFn: () => api.getFeed(params) });
}

// Tools
export function useTools() {
  return useQuery({ queryKey: ['tools'], queryFn: api.getTools });
}

// Models
export function useModels() {
  return useQuery({ queryKey: ['models'], queryFn: api.getModels });
}

// Benchmarks
export function useBenchmarks(category) {
  return useQuery({ queryKey: ['benchmarks', category], queryFn: () => api.getBenchmarks(category) });
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
