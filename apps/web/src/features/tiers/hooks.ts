import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedTiers, fetchTier, fetchTiers } from './api';

export function useTiers() {
  return useQuery({
    queryKey: ['tiers'],
    queryFn: fetchTiers,
  });
}

export function useFeaturedTiers() {
  return useQuery({
    queryKey: ['tiers', 'featured'],
    queryFn: fetchFeaturedTiers,
  });
}

export function useTierDetail(tierId?: string) {
  return useQuery({
    queryKey: ['tier', tierId],
    queryFn: () => fetchTier(tierId!),
    enabled: Boolean(tierId),
  });
}
