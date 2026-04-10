import { useEffect, useState } from 'react';

type Currency = 'GBP' | 'USD';

const STORAGE_KEY = 'currencyPreference';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCurrency(): Currency {
  if (typeof window === 'undefined') return 'GBP';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'USD') return 'USD';
  return 'GBP';
}

function persistCurrency(next: Currency) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `currency=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // ignore persistence errors
  }
}

export function CurrencyToggleBanner() {
  const [currency, setCurrency] = useState<Currency>(() => readCurrency());

  useEffect(() => {
    persistCurrency(currency);
  }, [currency]);

  return (
    <div className="dev-banner currency-banner">
      <div className="currency-banner__row">
        <div className="currency-banner__label">
          Price display
          <span className="currency-banner__hint">(toggle for your currency)</span>
        </div>
        <div className="currency-banner__toggle">
          <button
            type="button"
            className={`currency-pill ${currency === 'GBP' ? 'is-active' : ''}`}
            onClick={() => setCurrency('GBP')}
            aria-pressed={currency === 'GBP'}
          >
            £ GBP
          </button>
          <button
            type="button"
            className={`currency-pill ${currency === 'USD' ? 'is-active' : ''}`}
            onClick={() => setCurrency('USD')}
            aria-pressed={currency === 'USD'}
          >
            $ USD
          </button>
        </div>
      </div>
    </div>
  );
}
