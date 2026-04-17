import { useMemo } from 'react';
import { KeyholdingTierCarousel } from '../../components/KeyholdingTierCarousel';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { KeyholdingTier } from '../../features/keyholding/types';
import { CurrencyCode } from '../../utils/format';
import { resolvePriceLabel } from '../../utils/pricing';

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
  const compareRows = useMemo(
    () =>
      items.map((tier, index) => {
        const priceLabel = resolvePriceLabel({
          currency,
          pricings: [tier.pricing, tier.paymentProductPricing],
          fallbackAmountPenceCandidates: [tier.pricePence, tier.paymentProductPricePence],
          fallbackAmountCandidates: [tier.priceValue, tier.price],
          fallbackLabelCandidates: [tier.priceLabel],
          defaultLabel: '-',
        });
        const metaBits = (tier.includes || []).slice(0, 3).join(' · ');
        return {
          tier,
          index,
          priceLabel,
          metaBits,
        };
      }),
    [items, currency],
  );

  return (
    <section className="tasks-section kh-tier-section" id="tiers">
      <div className="kh-tiers-head">
        <p className="kh-section__eyebrow">Tiers & pricing</p>
        <h2 className="kh-section__title">Choose intensity, then apply in that lane</h2>
        <p className="kh-section__lead">
          Swipe cards for the full breakdown. Use the snapshot table to compare price and duration fast. Progression
          should read clearly from lighter accountability to heavier contact.
        </p>
      </div>

      {isError && <ErrorState message={errorMessage || 'Unable to load tiers'} />}

      {!isError && (loading || items.length > 0) && (
        <KeyholdingTierCarousel items={items} loading={loading} onApply={onApply} currency={currency} />
      )}

      {!isError && !loading && items.length > 0 && (
        <div className="kh-tier-compare" aria-label="Tier snapshot comparison">
          <table>
            <thead>
              <tr>
                <th scope="col">Tier</th>
                <th scope="col">Best for / notes</th>
                <th scope="col">Duration</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map(({ tier, index, priceLabel, metaBits }) => (
                <tr key={tier.id || String(index)}>
                  <td>
                    <strong>{tier.name}</strong>
                    {tier.badge ? (
                      <span className="kh-tier-compare__badge">{tier.badge}</span>
                    ) : null}
                  </td>
                  <td>{tier.idealFor || metaBits || tier.desc || '-'}</td>
                  <td>{tier.duration || '-'}</td>
                  <td>{priceLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !isError && items.length === 0 && (
        <EmptyState title="No tiers available" message="Tiers will appear here when configured." />
      )}
    </section>
  );
}
