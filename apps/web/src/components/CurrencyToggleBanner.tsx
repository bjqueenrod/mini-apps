import { useCurrencyPreference } from '../hooks/useCurrencyPreference';

export function CurrencyToggleBanner() {
  const [currency, setCurrency] = useCurrencyPreference();

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
