import { MouseEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { isTelegramRuntime, openBotDeepLink, sendBotWebAppData } from '../app/runtime';
import { trackTierBotCtaClick, trackTierSelect } from '../features/tiers/analytics';
import { TierItem } from '../features/tiers/types';
import { getTierDurationLabel, getTierSummary, getTierTasksLabel } from '../features/tiers/presentation';
import { CurrencyCode } from '../utils/format';
import { toTierPath } from '../utils/links';
import { resolvePriceLabel } from '../utils/pricing';
import { PaymentSheet } from './PaymentSheet';

export function TierCard({
  tier,
  guideLabel,
  currency = 'GBP',
}: {
  tier: TierItem;
  guideLabel?: string;
  currency?: CurrencyCode;
}) {
  const [showPayment, setShowPayment] = useState(false);
  const tierPriceLabel = resolvePriceLabel({
    currency,
    pricings: [tier.pricing],
    defaultLabel: 'Price on request',
  });
  const showBotCta = Boolean(tier.productId || isTelegramRuntime());
  const ctaLabel = tier.productId ? 'Continue to Payment' : 'Choose in Bot';

  const handleBotAction = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    trackTierBotCtaClick({ tier, source: 'tier_card' });

    if (tier.productId) {
      setShowPayment(true);
      return;
    }

    if (!tier.botBuyUrl) {
      return;
    }
    const payloadId = tier.productId || tier.id;
    const isTelegramWebApp = isTelegramRuntime();
    if (payloadId && isTelegramWebApp && sendBotWebAppData(`buy_${payloadId}`)) {
      return;
    }
    if (isTelegramWebApp) {
      return;
    }
    openBotDeepLink(tier.botBuyUrl);
  };

  return (
    <article className="tier-card">
      <div className="tier-card__eyebrow">
        <div className="tier-card__tags">
          {guideLabel ? <span className="tier-card__badge tier-card__badge--guide">{guideLabel}</span> : null}
          {tier.badge ? <span className="tier-card__badge">{tier.badge}</span> : null}
        </div>
        <span>{getTierDurationLabel(tier)}</span>
      </div>
      <Link to={toTierPath(tier.id)} className="tier-card__content" onClick={() => trackTierSelect({ tier, source: 'tier_card' })}>
        <h3>{tier.name}</h3>
        <p>{getTierSummary(tier)}</p>
      </Link>
      <div className="tier-card__facts">
        <span>{getTierTasksLabel(tier)}</span>
        <strong>{tierPriceLabel}</strong>
      </div>
      <div className="tier-card__actions">
        <Link to={toTierPath(tier.id)} className="tier-card__link" onClick={() => trackTierSelect({ tier, source: 'tier_card' })}>
          View package
        </Link>
        {showBotCta ? (
          <a href={tier.productId ? '#' : tier.botBuyUrl || '#'} className="tier-card__cta" onClick={handleBotAction}>
            {ctaLabel}
          </a>
        ) : null}
      </div>
      {showPayment ? (
        <PaymentSheet
          productId={String(tier.productId)}
          quantity={1}
          priceLabel={tierPriceLabel}
          botFallbackUrl={tier.botBuyUrl}
          preferredCurrency={currency}
          itemContext={{ tierId: tier.id }}
          onClose={() => setShowPayment(false)}
        />
      ) : null}
    </article>
  );
}
