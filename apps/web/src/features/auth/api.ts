import { AuthResponse, SessionUser } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function authenticate(
  initData?: string,
  fallbackUser?: SessionUser,
  startParam?: string,
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/telegram`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initData ? { initData, startParam } : { devUser: fallbackUser, startParam }),
  });
  if (!response.ok) {
    throw new Error('Unable to initialize Telegram session.');
  }
  return response.json();
}
