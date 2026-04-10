import { ClipHashtagListResponse, ClipItem, ClipListResponse, ClipQueryState } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

function buildQuery(state: ClipQueryState): string {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.category) params.set('category', state.category);
  if (state.tags.length) params.set('tags', state.tags.join(','));
  if (state.sort) params.set('sort', state.sort);
  params.set('page', String(Math.max(1, state.page)));
  params.set('limit', '20');
  if (state.currency) params.set('currency', state.currency);
  return params.toString();
}

export async function fetchClips(state: ClipQueryState): Promise<ClipListResponse> {
  const response = await fetch(`${API_BASE}/clips?${buildQuery(state)}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load clips.');
  return response.json();
}

export async function fetchClip(id: string, currency?: string): Promise<ClipItem> {
  const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  const response = await fetch(`${API_BASE}/clips/${encodeURIComponent(id)}${query}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load clip details.');
  return response.json();
}

export async function fetchTopSellers(currency?: string): Promise<ClipListResponse> {
  const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  const response = await fetch(`${API_BASE}/clips/top-sellers${query}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load top sellers.');
  return response.json();
}

export async function fetchNewClips(currency?: string): Promise<ClipListResponse> {
  const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  const response = await fetch(`${API_BASE}/clips/new${query}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load new clips.');
  return response.json();
}

export async function fetchClipHashtags(): Promise<ClipHashtagListResponse> {
  const response = await fetch(`${API_BASE}/clips/hashtags`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load clip hashtags.');
  return response.json();
}
