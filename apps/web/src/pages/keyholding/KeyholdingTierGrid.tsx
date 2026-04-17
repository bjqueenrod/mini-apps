import { KeyholdingTierCarousel } from '../../components/KeyholdingTierCarousel';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { KeyholdingTier } from '../../features/keyholding/types';
import { CurrencyCode } from '../../utils/format';

type KeyholdingTierGridProps = {
  items: KeyholdingTier[];
  loading: boolean;
  isError: boolean;
  errorMessage?: string;
  currency: CurrencyCode;
  onApply: () => void;
};

export function KeyholdingTierGrid({
  items,
  loading,
  isError,
  errorMessage,
  currency,
  onApply,
}: KeyholdingTierGridProps) {
  return (
    <section className="tasks-section kh-tier-section" id="tiers">
      <div className="kh-tiers-head">
        <p className="kh-section__eyebrow">Tiers & pricing</p>
        <h2 className="kh-section__title">Choose how hard you want this held—then apply for that tier</h2>
        <p className="kh-section__lead">
          Swipe each card for price, duration, and what’s included. Tiers step up from lighter accountability to heavier
          contact.
        </p>
      </div>

      {isError && <ErrorState message={errorMessage || 'Unable to load tiers'} />}

      {!isError && (loading || items.length > 0) && (
        <KeyholdingTierCarousel items={items} loading={loading} onApply={onApply} currency={currency} />
      )}

      {!loading && !isError && items.length === 0 && (
        <EmptyState title="No tiers available" message="Tiers will appear here when configured." />
      )}
    </section>
  );
}
