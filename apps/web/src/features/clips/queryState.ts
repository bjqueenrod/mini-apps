import { URLSearchParamsInit } from 'react-router-dom';
import { ClipQueryState } from './types';

export const DEFAULT_SORT = 'newest';

export function readQueryState(searchParams: URLSearchParams): ClipQueryState {
  return {
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    tags: (searchParams.get('tags') ?? '').split(',').map((value) => value.trim()).filter(Boolean),
    sort: searchParams.get('sort') ?? DEFAULT_SORT,
    page: Number(searchParams.get('page') ?? '1') || 1,
  };
}

export function toSearchParams(state: ClipQueryState): URLSearchParamsInit {
  const params: Record<string, string> = {};
  if (state.q) params.q = state.q;
  if (state.category) params.category = state.category;
  if (state.sort && state.sort !== DEFAULT_SORT) params.sort = state.sort;
  if (state.page > 1) params.page = String(state.page);
  return params;
}
