import { useQuery } from '@tanstack/react-query';
import { CurrencyCode } from '../../utils/format';
import { fetchFeaturedTiers, fetchTier, fetchTiers } from './api';

export function useTiers(currency: CurrencyCode = 'GBP') {
  return useQuery({
    queryKey: ['tiers', currency],
    queryFn: fetchTiers,
  });
}

export function useFeaturedTiers(currency: CurrencyCode = 'GBP') {
  return useQuery({
    queryKey: ['tiers', 'featured', currency],
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
