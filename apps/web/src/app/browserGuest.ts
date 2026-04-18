import type { SessionUser } from '../features/auth/types';

const STORAGE_KEY = 'ma_browser_guest_uid';
/** Synthetic IDs stay above typical Telegram user id ranges. */
const BROWSER_GUEST_ID_BASE = 9_000_000_000;

function hashToPositiveInt(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(31, h) + input.charCodeAt(i);
  }
  return Math.abs(h) % 1_000_000_000;
}

/** Stable pseudo-user for browser sessions when Telegram initData is unavailable. */
export function getBrowserGuestUser(): SessionUser {
  let token = '';
  try {
    token = localStorage.getItem(STORAGE_KEY) || '';
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, token);
    }
  } catch {
    token = `anon_${Date.now()}`;
  }
  const id = BROWSER_GUEST_ID_BASE + hashToPositiveInt(token);
  return { id, username: 'browser-guest', firstName: 'Guest' };
}
