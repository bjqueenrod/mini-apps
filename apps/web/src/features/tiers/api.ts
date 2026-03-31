import { TierItem, TierListResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function fetchTiers(): Promise<TierListResponse> {
  const response = await fetch(`${API_BASE}/tiers`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load packages.');
  return response.json();
}

export async function fetchFeaturedTiers(): Promise<TierListResponse> {
  const response = await fetch(`${API_BASE}/tiers/featured`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load featured packages.');
  return response.json();
}

export async function fetchTier(id: string): Promise<TierItem> {
  const response = await fetch(`${API_BASE}/tiers/${encodeURIComponent(id)}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load package details.');
  return response.json();
}
