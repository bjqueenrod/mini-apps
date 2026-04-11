import { useCallback, useEffect, useRef, useState } from 'react';
import { isTelegramWebView } from '../app/telegram';
import { CurrencyCode } from '../utils/format';

const STORAGE_KEY = 'currencyPreference';
export const CURRENCY_PREFERENCE_EVENT = 'currency-preference-changed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function fetchTelegramCurrencyPreference(): Promise<CurrencyCode | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE}/preferences/currency`, {
        credentials: 'include',
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

async function persistTelegramCurrencyPreference(currency: CurrencyCode): Promise<void> {
  const response = await fetch(`${API_BASE}/preferences/currency`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency }),
  });
  if (!response.ok) {
    throw new Error('Unable to persist currency preference.');
  }
}

function readCurrency(allowStoredPreference: boolean): CurrencyCode {
  if (typeof window === 'undefined') return 'GBP';

  const params = new URLSearchParams(window.location.search);
  const queryCurrency = params.get('currency') || params.get('curr') || params.get('c');

  const startParam = params.get('tgWebAppStartParam') || params.get('startapp') || '';
  const fromStartParam = /currency[:=]?([A-Za-z]{3})/i.exec(startParam)?.[1];

  const pick = (value?: string | null): CurrencyCode | undefined => {
    const upper = value?.trim().toUpperCase();
    return upper === 'USD' ? 'USD' : upper === 'GBP' ? 'GBP' : undefined;
  };

  const fromUrl = pick(queryCurrency);
  const fromStart = pick(fromStartParam);
  const stored = allowStoredPreference ? pick(window.localStorage.getItem(STORAGE_KEY)) : undefined;

  return fromUrl || fromStart || stored || 'GBP';
}

export function useCurrencyPreference(syncWithServer = false): [CurrencyCode, (next: CurrencyCode) => void] {
  const [currency, setCurrency] = useState<CurrencyCode>(() => readCurrency(!isTelegramWebView()));
  const hasLocalOverrideRef = useRef(false);

  const applyCurrency = useCallback((next: CurrencyCode, options?: { persist?: boolean; broadcast?: boolean }) => {
    const persist = options?.persist ?? true;
    const broadcast = options?.broadcast ?? true;
    setCurrency(next);
    if (persist && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.cookie = `currency=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } catch {
        // ignore persistence errors
      }
    }
    if (broadcast && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<CurrencyCode>(CURRENCY_PREFERENCE_EVENT, { detail: next }));
    }
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
    if (!syncWithServer || !isTelegramWebView()) return;
    let cancelled = false;

    const syncPreference = async () => {
      const remoteCurrency = await fetchTelegramCurrencyPreference();
      if (!cancelled && !hasLocalOverrideRef.current && remoteCurrency) {
        applyCurrency(remoteCurrency, { persist: true, broadcast: true });
      }
    };

    void syncPreference();

    return () => {
      cancelled = true;
    };
  }, [applyCurrency, syncWithServer]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<CurrencyCode>).detail;
      if (!detail) return;
      setCurrency(detail);
    };
    window.addEventListener(CURRENCY_PREFERENCE_EVENT, handleChange as EventListener);
    return () => window.removeEventListener(CURRENCY_PREFERENCE_EVENT, handleChange as EventListener);
  }, []);

  const setPreference = useCallback((next: CurrencyCode) => {
    hasLocalOverrideRef.current = true;
    applyCurrency(next, { persist: true, broadcast: true });
    if (isTelegramWebView()) {
      void persistTelegramCurrencyPreference(next).catch(() => {
        // keep local preference even if the server write fails
      });
    }
  }, [applyCurrency]);

  return [currency, setPreference];
}

export function readCurrencyPreference(): CurrencyCode {
  return readCurrency(!isTelegramWebView());
}
