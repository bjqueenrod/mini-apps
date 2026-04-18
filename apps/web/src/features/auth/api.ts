import { AuthResponse, SessionUser } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function authenticate(
  initData?: string,
  fallbackUser?: SessionUser,
  startParam?: string,
): Promise<AuthResponse> {
  const body = initData ? { initData, startParam } : { devUser: fallbackUser, startParam };
  if (initData) {
    try {
      await fetch(`${API_BASE}/auth/telegram/track-open`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, startParam }),
      });
    } catch {
      /* Session auth below still runs notify_miniapp_open as a fallback. */
    }
  }
  const response = await fetch(`${API_BASE}/auth/telegram`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Unable to initialize session.');
  }
  return response.json();
}
