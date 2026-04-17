import { usePagedCarousel } from './usePagedCarousel';
import { KeyholdingTier } from '../features/keyholding/types';
import { CurrencyCode } from '../utils/format';
import { resolvePriceLabel } from '../utils/pricing';

/** Avoid repeating the same copy in the intro line and the “Ideal for” fact when CMS sends duplicates. */
function shouldShowTierDescriptor(desc: string | undefined, idealFor: string | undefined): boolean {
  const d = desc?.replace(/\s+/g, ' ').trim();
  if (!d) return false;
  const i = idealFor?.replace(/\s+/g, ' ').trim();
  if (!i) return true;
  return d.toLowerCase() !== i.toLowerCase();
}

export function KeyholdingTierCarousel({
  items,
  loading = false,
  onApply,
  currency = 'GBP',
}: {
  items: KeyholdingTier[];
  loading?: boolean;
  onApply?: () => void;
  currency?: CurrencyCode;
}) {
  if (!items.length && !loading) {
    return null;
  }

  const pageCount = loading ? 3 : items.length;
  const { currentPage, scrollToPage, trackRef } = usePagedCarousel(pageCount);

  return (
    <section className="top-sellers top-sellers--tiers top-sellers--keyholding">
      <div ref={trackRef} className="top-sellers__track">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="top-sellers__card top-sellers__card--skeleton" aria-hidden="true">
                <div className="top-sellers__media top-sellers__media--skeleton" />
                <div className="top-sellers__body top-sellers__body--tier">
                  <span className="top-sellers__line top-sellers__line--title" />
                  <span className="top-sellers__line top-sellers__line--body" />
                  <span className="top-sellers__line top-sellers__line--body top-sellers__line--short" />
                  <span className="top-sellers__line top-sellers__line--price" />
                </div>
              </div>
            ))
          : items.map((tier, index) => {
              const includes = tier.includes || [];
              const priceLabel = resolvePriceLabel({
                currency,
                pricings: [tier.pricing, tier.paymentProductPricing],
                fallbackAmountPenceCandidates: [tier.pricePence, tier.paymentProductPricePence],
                fallbackAmountCandidates: [tier.priceValue, tier.price],
                fallbackLabelCandidates: [tier.priceLabel],
                defaultLabel: 'Price on request',
              });
              const pricePerWeekLabel = resolvePriceLabel({
                currency,
                pricings: [tier.pricePerWeekPricing],
                fallbackAmountPenceCandidates: [tier.pricePerWeekPence],
                fallbackAmountCandidates: [tier.pricePerWeekValue, tier.pricePerWeek],
                fallbackLabelCandidates: [tier.pricePerWeek],
                defaultLabel: 'Price on request',
              });
              const controlLabel =
                tier.badge ||
                (index === 0
                  ? 'Newbie trial'
                  : index === 1
                    ? 'Daily discipline'
                    : index === 2
                      ? 'Full enforcement'
                      : index === 3
                        ? 'Total submission'
                        : undefined);
              return (
                <article
                  id={`keyholding-tier-${index}`}
                  key={tier.id || index}
                  className="top-sellers__card top-sellers__card--tier top-sellers__card--light"
                >
                  <div className="top-sellers__body top-sellers__body--tier">
                    <div className="top-sellers__eyebrow" aria-hidden="true" />
                    <h3>{tier.name}</h3>
                    {shouldShowTierDescriptor(tier.desc, tier.idealFor) ? (
                      <p className="top-sellers__descriptor">{tier.desc}</p>
                    ) : null}
                    {controlLabel ? <p className="top-sellers__badge-inline">{controlLabel}</p> : null}
                    {(tier.duration || tier.idealFor) && (
                      <div className="top-sellers__fact-grid">
                        {tier.duration ? (
                          <div className="top-sellers__fact">
                            <span className="top-sellers__fact-label">Duration</span>
                            <strong>{tier.duration}</strong>
                          </div>
                        ) : null}
                        {tier.idealFor ? (
                          <div className="top-sellers__fact">
                            <span className="top-sellers__fact-label">Ideal for</span>
                            <strong>{tier.idealFor}</strong>
                          </div>
                        ) : null}
                      </div>
                    )}
                    {includes.length ? (
                      <div className="top-sellers__includes-block">
                        <header className="top-sellers__includes-head">
                          <p className="top-sellers__includes-eyebrow">Included in this tier</p>
                          <h4 className="top-sellers__includes-title">What you get</h4>
                        </header>
                        <div className="top-sellers__pill-grid">
                          {includes.map((item) => (
                            <span key={item} className="top-sellers__pill">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="top-sellers__price-block top-sellers__price-block--keyholding">
                      <span className="top-sellers__meta-label">Price</span>
                      <strong>{priceLabel}</strong>
                      {tier.pricePerWeekPricing || tier.pricePerWeek || tier.pricePerWeekPence != null || tier.pricePerWeekValue != null ? (
                        <span className="top-sellers__price-subtext">{pricePerWeekLabel} per week</span>
                      ) : null}
                    </div>
                    {onApply ? (
                      <button type="button" className="top-sellers__cta top-sellers__cta--apply" onClick={onApply}>
                        <strong>Apply for this tier</strong>
                        <span>Application reviewed within 24h</span>
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
      </div>
      {pageCount > 1 ? (
        <div className="top-sellers__pagination" aria-label="Keyholding tier pages">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`top-sellers__pagination-dot${index === currentPage ? ' is-active' : ''}`}
              onClick={() => scrollToPage(index)}
              aria-label={`Go to tier page ${index + 1}`}
              aria-current={index === currentPage ? 'true' : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
