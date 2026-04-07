import { useQuery } from '@tanstack/react-query';
import { fetchKeyholdingOptions, fetchKeyholdingTiers } from './api';

export function useKeyholdingTiers() {
  return useQuery({
    queryKey: ['keyholding', 'tiers'],
    queryFn: fetchKeyholdingTiers,
  });
}

export function useKeyholdingOptions() {
  return useQuery({
    queryKey: ['keyholding', 'options'],
    queryFn: fetchKeyholdingOptions,
  });
}
