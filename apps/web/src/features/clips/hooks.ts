import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyCode } from '../../utils/format';
import { fetchClip, fetchClipHashtags, fetchClips, fetchNewClips, fetchTopSellers } from './api';
import { ClipQueryState } from './types';

export function useClipSearch(queryState: ClipQueryState) {
  const normalized = useMemo(() => queryState, [queryState]);
  return useQuery({
    queryKey: ['clips', normalized],
    queryFn: () => fetchClips(normalized),
    placeholderData: (previousData) => previousData,
  });
}

export function useClipDetail(clipId?: string, currency: CurrencyCode = 'GBP') {
  return useQuery({
    queryKey: ['clip', clipId, currency],
    queryFn: () => fetchClip(clipId!, currency),
    enabled: Boolean(clipId),
  });
}

export function useTopSellers(currency: CurrencyCode = 'GBP') {
  return useQuery({
    queryKey: ['clips', 'top-sellers', currency],
    queryFn: () => fetchTopSellers(currency),
  });
}

export function useNewClips(currency: CurrencyCode = 'GBP') {
  return useQuery({
    queryKey: ['clips', 'new', currency],
    queryFn: () => fetchNewClips(currency),
  });
}

export function useClipHashtags() {
  return useQuery({
    queryKey: ['clips', 'hashtags'],
    queryFn: fetchClipHashtags,
    staleTime: 5 * 60 * 1000,
  });
}
