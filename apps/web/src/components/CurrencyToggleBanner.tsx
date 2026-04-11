import { useCurrencyPreference } from '../hooks/useCurrencyPreference';

type CurrencyToggleBannerProps = {
  onBackClick?: () => void;
  showBackButton?: boolean;
  alignRight?: boolean;
  syncWithServer?: boolean;
};

export function CurrencyToggleBanner({
  onBackClick,
  showBackButton = false,
  alignRight = false,
  syncWithServer = false,
}: CurrencyToggleBannerProps) {
  const [currency, setCurrency] = useCurrencyPreference(syncWithServer);

  return (
    <div
      className={`dev-banner currency-banner${showBackButton ? ' currency-banner--with-back' : ''}${
        alignRight ? ' currency-banner--right-aligned' : ''
      }`}
    >
      <div className="currency-banner__row">
        {showBackButton ? (
          <button type="button" className="currency-banner__back" onClick={onBackClick} aria-label="Back to Home">
            ← Back
          </button>
        ) : null}
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
