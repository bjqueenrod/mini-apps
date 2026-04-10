import { useCallback, useEffect, useState } from 'react';
import { CurrencyCode } from '../utils/format';

const STORAGE_KEY = 'currencyPreference';
export const CURRENCY_PREFERENCE_EVENT = 'currency-preference-changed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCurrency(): CurrencyCode {
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
  const stored = pick(window.localStorage.getItem(STORAGE_KEY));

  return fromUrl || fromStart || stored || 'GBP';
}

export function useCurrencyPreference(): [CurrencyCode, (next: CurrencyCode) => void] {
  const [currency, setCurrency] = useState<CurrencyCode>(() => readCurrency());

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
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<CurrencyCode>).detail;
      if (!detail) return;
      setCurrency(detail);
    };
    window.addEventListener(CURRENCY_PREFERENCE_EVENT, handleChange as EventListener);
    return () => window.removeEventListener(CURRENCY_PREFERENCE_EVENT, handleChange as EventListener);
  }, []);

  const setPreference = useCallback((next: CurrencyCode) => {
    setCurrency(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.cookie = `currency=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      } catch {
        // ignore persistence errors
      }
      window.dispatchEvent(new CustomEvent<CurrencyCode>(CURRENCY_PREFERENCE_EVENT, { detail: next }));
    }
  }, []);

  return [currency, setPreference];
}

export function readCurrencyPreference(): CurrencyCode {
  return readCurrency();
}
