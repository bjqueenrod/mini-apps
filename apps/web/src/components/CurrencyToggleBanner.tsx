import { useCurrencyPreference } from '../hooks/useCurrencyPreference';

export function CurrencyToggleBanner() {
  const [currency, setCurrency] = useCurrencyPreference();

  return (
    <div className="dev-banner currency-banner">
      <div className="currency-banner__row">
        <div>
          <div className="currency-banner__label">Currency selector</div>
          <div className="currency-banner__hint">Choose the price display you want to use in the mini app.</div>
        </div>
        <div className="currency-banner__toggle" role="group" aria-label="Choose currency">
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
