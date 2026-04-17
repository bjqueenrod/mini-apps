import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { CurrencyCode } from '../../utils/format';
import { fetchClip, fetchClipHashtags, fetchClips, fetchFeaturedClips, fetchNewClips, fetchTopSellers } from './api';
import { ClipQueryState } from './types';

/** Filters for catalog search (page is supplied by infinite query). */
export type ClipSearchFilters = Omit<ClipQueryState, 'page'>;

export function useClipSearch(queryState: ClipQueryState) {
  const normalized = useMemo(() => queryState, [queryState]);
  return useQuery({
    queryKey: ['clips', normalized],
    queryFn: () => fetchClips(normalized),
    placeholderData: (previousData) => previousData,
  });
}

export function useClipSearchInfinite(filters: ClipSearchFilters) {
  const tagsKey = useMemo(() => [...filters.tags].sort().join('\0'), [filters.tags]);

  return useInfiniteQuery({
    queryKey: ['clips', 'infinite', filters.q, filters.category, filters.sort, filters.currency ?? '', tagsKey],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchClips({
        q: filters.q,
        category: filters.category,
        tags: filters.tags,
        sort: filters.sort,
        currency: filters.currency,
        page: pageParam as number,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
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

export function useFeaturedClips(currency: CurrencyCode = 'GBP') {
  return useQuery({
    queryKey: ['clips', 'featured', currency],
    queryFn: () => fetchFeaturedClips(currency),
  });
}

export function useClipHashtags() {
  return useQuery({
    queryKey: ['clips', 'hashtags'],
    queryFn: fetchClipHashtags,
    staleTime: 5 * 60 * 1000,
  });
}
