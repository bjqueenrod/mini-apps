import { usePagedCarousel } from './usePagedCarousel';
import { KeyholdingTier } from '../features/keyholding/types';
import { formatPrice } from '../utils/format';

function formatMoney(value?: string | number): string {
  if (value === undefined || value === null) return 'Price on request';
  if (typeof value === 'number') return formatPrice(value);
  const trimmed = value.toString().trim();
  if (!trimmed) return 'Price on request';
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) return formatPrice(numeric);
  }
  return trimmed;
}

export function KeyholdingTierCarousel({
  items,
  loading = false,
  onApply,
}: {
  items: KeyholdingTier[];
  loading?: boolean;
  onApply?: () => void;
}) {
  if (!items.length && !loading) {
    return null;
  }

  const pageCount = loading ? 3 : items.length;
  const { currentPage, scrollToPage, trackRef } = usePagedCarousel(pageCount);

  return (
    <section className="top-sellers top-sellers--tiers">
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
              const priceLabel = formatMoney(tier.priceLabel ?? tier.price ?? tier.priceValue);
              const pricePerWeekLabel = formatMoney(tier.pricePerWeek);
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
                  key={tier.id || index}
                  className="top-sellers__card top-sellers__card--tier top-sellers__card--light"
                >
                  <div className="top-sellers__body top-sellers__body--tier">
                    {controlLabel ? <span className="top-sellers__tier-badge top-sellers__tier-badge--inline">{controlLabel}</span> : null}
                    <h3>{tier.name}</h3>
                    {tier.desc ? <p className="top-sellers__descriptor">{tier.desc}</p> : null}
                    {tier.duration ? (
                      <p>
                        <strong>Duration:</strong> {tier.duration}
                      </p>
                    ) : null}
                    {tier.idealFor ? (
                      <p>
                        <strong>Ideal for:</strong> {tier.idealFor}
                      </p>
                    ) : null}
                    {includes.length ? (
                      <div>
                        <p>
                          <strong>What&apos;s included:</strong>
                        </p>
                        <ul>
                          {includes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <p>
                      <strong>Price:</strong> {priceLabel}
                    </p>
                    {tier.pricePerWeek ? (
                      <p>
                        <strong>Price per week:</strong> {pricePerWeekLabel}
                      </p>
                    ) : null}
                    {onApply ? (
                      <button type="button" className="tasks-button tasks-button--primary" onClick={onApply}>
                        Apply for this tier
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
