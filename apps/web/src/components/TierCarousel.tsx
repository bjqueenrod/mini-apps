import { MouseEvent, useState } from 'react';
import { openBotDeepLink, sendBotWebAppData } from '../app/telegram';
import { trackTierBotCtaClick } from '../features/tiers/analytics';
import { getTierArtwork, getTierArtworkVariant } from '../features/tiers/artwork';
import {
  getTierDurationLabel,
  getTierGuideLabels,
  getTierTasksLabel,
} from '../features/tiers/presentation';
import { TierItem } from '../features/tiers/types';
import { formatPrice } from '../utils/format';
import { PaymentSheet } from './PaymentSheet';
import { usePagedCarousel } from './usePagedCarousel';

function priceLabel(tier: TierItem): string {
  return tier.priceLabel || formatPrice(tier.price);
}

function displayBadgeLabel(badgeLabel?: string): string | undefined {
  switch (badgeLabel) {
    case 'Best for first timers':
      return 'Best place to start';
    case 'Most Popular':
      return 'Most popular';
    case 'High Intensity':
      return 'Deeper intensity';
    default:
      return badgeLabel;
  }
}

function descriptorLabel(tier: TierItem, badgeLabel?: string): string {
  if (tier.shortDescription?.trim()) {
    return tier.shortDescription.trim();
  }

  const duration = getTierDurationLabel(tier).toLowerCase();
  const pace = getTierTasksLabel(tier).toLowerCase();
  const base = `Telegram access for ${duration} with ${pace}.`;

  switch (badgeLabel) {
    case 'Best for first timers':
      return `${base} Best if you want guidance, softer pacing, and clear proof steps reviewed by Mistress BJQueen for a first order.`;
    case 'Most Popular':
      return `${base} Balanced control and pacing for buyers who want steady momentum.`;
    case 'High Intensity':
      return `${base} For buyers who want stricter pacing, tighter review, and firmer control.`;
    default:
      if (tier.isUnlimitedTasks) {
        return `${base} Suited to buyers who want an immersive flow with frequent check-ins.`;
      }
      return `${base} Choose this if you want clear pacing, personal tailoring, and accountable proof reviewed by Mistress BJQueen.`;
  }
}

function valueCopyLabel(tier: TierItem): string {
  const description = tier.description?.trim();
  const shortDescription = tier.shortDescription?.trim();

  if (description && description !== shortDescription) {
    return description;
  }

  return '';
}

export function TierCarousel({
  items,
  title,
  loading = false,
}: {
  items: TierItem[];
  title?: string;
  loading?: boolean;
}) {
  if (!items.length && !loading) {
    return null;
  }

  const guideLabels = getTierGuideLabels(items);
  const pageCount = loading ? 3 : items.length;
  const { currentPage, scrollToPage, trackRef } = usePagedCarousel(pageCount);
  const [paymentTier, setPaymentTier] = useState<TierItem | null>(null);
  const handleBotAction = (tier: TierItem, url?: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    trackTierBotCtaClick({ tier, source: 'tier_carousel' });

    if (tier.productId) {
      setPaymentTier(tier);
      return;
    }

    if (!url) {
      return;
    }

    const payloadId = tier.productId || tier.id;
    const isTelegramWebApp = Boolean(window.Telegram?.WebApp);
    if (payloadId && isTelegramWebApp && sendBotWebAppData(`buy_${payloadId}`)) {
      return;
    }
    if (isTelegramWebApp) {
      return;
    }
    openBotDeepLink(url);
  };

  return (
    <section className="top-sellers top-sellers--tiers">
      {title ? (
        <div className="top-sellers__header">
          <p className="hero__eyebrow">{title}</p>
        </div>
      ) : null}
      <div ref={trackRef} className="top-sellers__track">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="top-sellers__card top-sellers__card--skeleton" aria-hidden="true">
                <div className="top-sellers__media top-sellers__media--skeleton" />
                <div className="top-sellers__body top-sellers__body--tier">
                  <div className="top-sellers__eyebrow">
                    <span className="top-sellers__line top-sellers__line--small" />
                    <span className="top-sellers__line top-sellers__line--small" />
                  </div>
                  <span className="top-sellers__line top-sellers__line--title" />
                  <span className="top-sellers__line top-sellers__line--body top-sellers__line--short" />
                  <div className="top-sellers__meta-grid">
                    <span className="top-sellers__line top-sellers__line--body" />
                    <span className="top-sellers__line top-sellers__line--body" />
                  </div>
                  <span className="top-sellers__line top-sellers__line--price" />
                  <span className="top-sellers__line top-sellers__line--body" />
                  <span className="top-sellers__line top-sellers__line--body top-sellers__line--short" />
                </div>
              </div>
            ))
          : items.map((tier, index) => {
              const badgeLabel = guideLabels[tier.id] || tier.badge;
              const badgeDisplay = displayBadgeLabel(badgeLabel);
              const artworkVariant = getTierArtworkVariant(index);
              const descriptor = descriptorLabel(tier, badgeLabel);
              const valueSummary = valueCopyLabel(tier);

              return (
                <article
                  key={tier.id}
                  className={[
                    'top-sellers__card',
                    'top-sellers__card--tier',
                    artworkVariant === 'light' ? 'top-sellers__card--light' : 'top-sellers__card--base',
                    badgeLabel === 'Most Popular' ? 'top-sellers__card--featured' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="top-sellers__media top-sellers__media--tier">
                    <img
                      src={getTierArtwork(tier, badgeLabel, artworkVariant)}
                      alt={`${tier.name} package artwork`}
                      loading="lazy"
                    />
                  </div>
                  <div className="top-sellers__body top-sellers__body--tier">
                    <div className="top-sellers__eyebrow">
                      {badgeDisplay ? (
                        <span className="top-sellers__tier-badge top-sellers__tier-badge--inline">{badgeDisplay}</span>
                      ) : (
                        <span />
                      )}
                    </div>
                    <div className="top-sellers__meta-grid">
                      <div className="top-sellers__meta-item">
                        <span className="top-sellers__meta-label">Duration</span>
                        <strong>{getTierDurationLabel(tier)}</strong>
                      </div>
                      <div className="top-sellers__meta-item">
                        <span className="top-sellers__meta-label">Pace</span>
                        <strong>{getTierTasksLabel(tier)}</strong>
                      </div>
                    </div>
                    <div className="top-sellers__price-block">
                      <span className="top-sellers__meta-label">Price</span>
                      <strong>{priceLabel(tier)}</strong>
                    </div>
                    <a
                      href={tier.botBuyUrl || '#'}
                      className="top-sellers__cta"
                      onClick={handleBotAction(tier, tier.botBuyUrl)}
                      aria-label={`Continue to payment for ${tier.name}`}
                    >
                      <strong>Continue to Payment</strong>
                    </a>
                  </div>
                </article>
              );
            })}
      </div>
      {pageCount > 1 ? (
        <div className="top-sellers__pagination" aria-label="Package pages">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`top-sellers__pagination-dot${index === currentPage ? ' is-active' : ''}`}
              onClick={() => scrollToPage(index)}
              aria-label={`Go to package page ${index + 1}`}
              aria-current={index === currentPage ? 'true' : undefined}
            />
          ))}
        </div>
      ) : null}
      {paymentTier ? (
        <PaymentSheet
          productId={String(paymentTier.productId)}
          quantity={1}
          priceLabel={paymentTier.priceLabel || formatPrice(paymentTier.price)}
          botFallbackUrl={paymentTier.botBuyUrl}
          itemContext={{ tierId: paymentTier.id }}
          onClose={() => setPaymentTier(null)}
        />
      ) : null}
    </section>
  );
}
