import { useCallback, useEffect, useState } from 'react';
import { CurrencyCode } from '../utils/format';

const STORAGE_KEY = 'currencyPreference';
export const CURRENCY_PREFERENCE_EVENT = 'currency-preference-changed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'GBP';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'USD' ? 'USD' : 'GBP';
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
