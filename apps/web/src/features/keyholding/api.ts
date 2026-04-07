import { KeyholdingOptionListResponse, KeyholdingTierListResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function fetchKeyholdingTiers(): Promise<KeyholdingTierListResponse> {
  const response = await fetch(`${API_BASE}/keyholding/tiers`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Unable to load keyholding tiers.');
  }
  return response.json();
}

export async function fetchKeyholdingOptions(): Promise<KeyholdingOptionListResponse> {
  const response = await fetch(`${API_BASE}/keyholding/options`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Unable to load keyholding options.');
  }
  return response.json();
}
