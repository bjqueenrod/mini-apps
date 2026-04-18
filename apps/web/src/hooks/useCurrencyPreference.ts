import { useCallback, useEffect, useRef, useState } from 'react';
import { isTelegramRuntime } from '../app/runtime';
import { CurrencyCode } from '../utils/format';

const STORAGE_KEY = 'currencyPreference';
export const CURRENCY_PREFERENCE_EVENT = 'currency-preference-changed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

function getTelegramCurrencyUserId(telegramUserId?: number | null): number | null {
  if (!isTelegramRuntime()) {
    return telegramUserId ?? null;
  }
  return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? telegramUserId ?? null;
}

function shouldSyncTelegramCurrency(telegramUserId?: number | null): boolean {
  return Boolean(window.Telegram?.WebApp || telegramUserId != null);
}

async function fetchTelegramCurrencyPreference(telegramUserId?: number | null): Promise<CurrencyCode | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const url = new URL(`${API_BASE}/preferences/currency`, window.location.origin);
      if (telegramUserId != null) {
        url.searchParams.set('telegram_user_id', String(telegramUserId));
      }
      const response = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = (await response.json()) as { currency?: CurrencyCode };
        return data.currency === 'USD' ? 'USD' : 'GBP';
      }
      if (response.status === 401 || response.status === 403) {
        await new Promise((resolve) => window.setTimeout(resolve, 200 * (attempt + 1)));
        continue;
      }
      return null;
    } catch {
      await new Promise((resolve) => window.setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  return null;
}

async function persistTelegramCurrencyPreference(currency: CurrencyCode, telegramUserId?: number | null): Promise<void> {
  const url = new URL(`${API_BASE}/preferences/currency`, window.location.origin);
  if (telegramUserId != null) {
    url.searchParams.set('telegram_user_id', String(telegramUserId));
  }
  const response = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency }),
  });
  if (!response.ok) {
    throw new Error('Unable to persist currency preference.');
  }
}

function pick(value?: string | null): CurrencyCode | undefined {
  const upper = value?.trim().toUpperCase();
  return upper === 'USD' ? 'USD' : upper === 'GBP' ? 'GBP' : undefined;
}

/** Synchronous sources only; used for first paint so the toggle matches cached / URL preference. */
function readCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'GBP';

  const params = new URLSearchParams(window.location.search);
  const queryCurrency = params.get('currency') || params.get('curr') || params.get('c');

  const startParam = params.get('tgWebAppStartParam') || params.get('startapp') || '';
  const fromStartParam = /currency[:=]?([A-Za-z]{3})/i.exec(startParam)?.[1];

  const fromUrl = pick(queryCurrency);
  const fromStart = pick(fromStartParam);
  const stored = pick(window.localStorage.getItem(STORAGE_KEY));

  const cookieMatch = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )currency=(USD|GBP)(?:;|$)/) : null;
  const fromCookie = pick(cookieMatch?.[1]);

  return fromUrl || fromStart || stored || fromCookie || 'GBP';
}

export function useCurrencyPreference(
  syncWithServer = false,
  telegramUserId?: number | null,
  isTelegramSession = false,
): [CurrencyCode, (next: CurrencyCode) => void] {
  const [currency, setCurrency] = useState<CurrencyCode>(() => readCurrency());
  const hasLocalOverrideRef = useRef(false);

  const applyCurrency = useCallback((next: CurrencyCode, options?: { broadcast?: boolean }) => {
    const broadcast = options?.broadcast ?? true;
    setCurrency((prev) => {
      if (prev === next) return prev;
      if (broadcast && typeof window !== 'undefined') {
        const detail = next;
        queueMicrotask(() => {
          window.dispatchEvent(new CustomEvent<CurrencyCode>(CURRENCY_PREFERENCE_EVENT, { detail }));
        });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, currency);
      document.cookie = `currency=${currency}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    } catch {
      // ignore persistence errors
    }
  }, [currency]);

  useEffect(() => {
    if (!isTelegramSession && !shouldSyncTelegramCurrency(telegramUserId)) return;
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const syncPreference = async () => {
      const telegramLookupId = getTelegramCurrencyUserId(telegramUserId);
      const remoteCurrency = await fetchTelegramCurrencyPreference(telegramLookupId);
      if (cancelled || hasLocalOverrideRef.current || !remoteCurrency) return;
      applyCurrency(remoteCurrency, { broadcast: true });
    };

    void syncPreference();

    return () => {
      cancelled = true;
    };
  }, [applyCurrency, isTelegramSession, telegramUserId]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<CurrencyCode>).detail;
      if (!detail) return;
      setCurrency(detail);
    };
    window.addEventListener(CURRENCY_PREFERENCE_EVENT, handleChange as EventListener);
    return () => window.removeEventListener(CURRENCY_PREFERENCE_EVENT, handleChange as EventListener);
  }, []);

  const setPreference = useCallback(
    (next: CurrencyCode) => {
      hasLocalOverrideRef.current = true;
      applyCurrency(next, { broadcast: true });
      if (isTelegramSession) {
        void persistTelegramCurrencyPreference(next, getTelegramCurrencyUserId(telegramUserId)).catch(() => {
          // keep local preference even if the server write fails
        });
      }
    },
    [applyCurrency, isTelegramSession, telegramUserId],
  );

  return [currency, setPreference];
}

export function readCurrencyPreference(): CurrencyCode {
  return readCurrency();
}
