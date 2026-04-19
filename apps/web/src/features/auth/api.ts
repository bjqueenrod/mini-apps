import { getBrowserGuestUser } from '../../app/browserGuest';
import { AuthResponse, SessionUser } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function readApiErrorMessage(response: Response): Promise<string | undefined> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: unknown }).msg);
          }
          return JSON.stringify(item);
        })
        .join('; ');
    }
    if (data.detail != null) {
      return String(data.detail);
    }
  } catch {
    /* ignore malformed JSON */
  }
  return undefined;
}

export async function authenticate(
  initData?: string,
  fallbackUser?: SessionUser,
  startParam?: string,
): Promise<AuthResponse> {
  const signedInit = initData?.trim() ?? '';
  const body = signedInit
    ? { initData: signedInit, startParam }
    : { devUser: fallbackUser ?? getBrowserGuestUser(), startParam };
  if (signedInit) {
    try {
      await fetch(`${API_BASE}/auth/telegram/track-open`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: signedInit, startParam }),
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
    const fromBody = await readApiErrorMessage(response);
    const fallback = `Unable to initialize session (${response.status}).`;
    throw new Error(fromBody?.trim() || fallback);
  }
  return response.json();
}
