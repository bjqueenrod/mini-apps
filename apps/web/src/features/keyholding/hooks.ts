import { useQuery } from '@tanstack/react-query';
import { CurrencyCode } from '../../utils/format';
import { fetchKeyholdingOptions, fetchKeyholdingTiers } from './api';

export function useKeyholdingTiers(currency: CurrencyCode = 'GBP') {
  return useQuery({
    queryKey: ['keyholding', 'tiers', currency],
    queryFn: fetchKeyholdingTiers,
  });
}

export function useKeyholdingOptions(currency: CurrencyCode = 'GBP') {
  return useQuery({
    queryKey: ['keyholding', 'options', currency],
    queryFn: fetchKeyholdingOptions,
  });
}
