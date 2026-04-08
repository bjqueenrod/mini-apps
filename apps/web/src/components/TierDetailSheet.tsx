import { MouseEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { openBotDeepLink, sendBotWebAppData } from '../app/telegram';
import { getTierArtwork, TierArtworkVariant } from '../features/tiers/artwork';
import { trackTierBotCtaClick, trackTierDetailView } from '../features/tiers/analytics';
import { getTierDurationLabel, getTierSummary, getTierTasksLabel } from '../features/tiers/presentation';
import { TierItem } from '../features/tiers/types';
import { formatPrice } from '../utils/format';
import { PaymentSheet } from './PaymentSheet';

const PACKAGE_HIGHLIGHTS = [
  'Time-limited access inside Telegram; no auto-renewal',
  'Duration and maximum tasks per day are set by this tier',
  'Tasks are generated from your saved categories, sex toys/props, limits, and schedule',
  'Delivery and proof submission happen in the Telegram bot, with proof reviewed by Mistress BJQueen',
  'Only one task is active at a time, with proof manually reviewed by Mistress BJQueen',
] as const;

export function TierDetailSheet({
  tier,
  loading,
  artworkVariant = 'base',
}: {
  tier?: TierItem;
  loading?: boolean;
  artworkVariant?: TierArtworkVariant;
}) {
  const lastTrackedTierIdRef = useRef('');
  const [showPayment, setShowPayment] = useState(false);

  const handleBotAction = (url?: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (tier?.productId) {
      event.preventDefault();
      trackTierBotCtaClick({ tier, source: 'detail_sheet' });
      setShowPayment(true);
      return;
    }
    if (!url) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    if (tier) {
      trackTierBotCtaClick({ tier, source: 'detail_sheet' });
    }
    const payloadId = tier?.productId || tier?.id;
    const isTelegramWebApp = Boolean(window.Telegram?.WebApp);
    if (payloadId && isTelegramWebApp && sendBotWebAppData(`buy_${payloadId}`)) {
      return;
    }
    if (isTelegramWebApp) {
      return;
    }
    openBotDeepLink(url);
  };

  useEffect(() => {
    const scrollY = window.scrollY;
    const { body } = document;
    const root = document.documentElement;
    const previousBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const previousRootOverflow = root.style.overflow;

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBody.overflow;
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.width = previousBody.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    if (!tier || lastTrackedTierIdRef.current === tier.id) {
      return;
    }
    lastTrackedTierIdRef.current = tier.id;
    trackTierDetailView(tier);
  }, [tier]);

  return (
    <div className="detail-sheet__backdrop">
      <div className="detail-sheet detail-sheet--tier">
        <div className="detail-sheet__header">
          <Link to="/tasks" className="detail-sheet__back">
            Back
          </Link>
          <span>Custom Obedience Package</span>
        </div>
        {loading && <div className="detail-sheet__loading">Loading package...</div>}
        {!loading && tier && (
          <>
            <div className="detail-sheet__body detail-sheet__body--tier">
              <div className={`detail-sheet__tier-hero ${artworkVariant === 'light' ? 'detail-sheet__tier-hero--light' : 'detail-sheet__tier-hero--base'}`}>
                <div className="detail-sheet__tier-media">
                  <img src={getTierArtwork(tier, tier.badge, artworkVariant)} alt={`${tier.name} package artwork`} />
                </div>
                <div className="detail-sheet__tier-summary">
                  <div className="detail-sheet__eyebrow">
                    {tier.badge ? <span className="top-sellers__tier-badge top-sellers__tier-badge--inline">{tier.badge}</span> : <span />}
                    <span>{getTierDurationLabel(tier)}</span>
                  </div>
                  <h2>{tier.name}</h2>
                  <p>{getTierSummary(tier)}</p>
                  <p className="detail-sheet__supporting-copy">
                    Choose your package here, then continue in the bot for payment, setup, and delivery. One task stays
                    active at a time, and access ends when the package duration ends.
                  </p>
                </div>
              </div>
              <div className="tier-detail__facts">
                <div className="tier-detail__fact">
                  <span className="tier-detail__label">Duration</span>
                  <strong>{getTierDurationLabel(tier)}</strong>
                </div>
                <div className="tier-detail__fact">
                  <span className="tier-detail__label">Pace</span>
                  <strong>{getTierTasksLabel(tier)}</strong>
                </div>
                {tier.priceLabel || tier.price ? (
                  <div className="tier-detail__fact">
                    <span className="tier-detail__label">Price</span>
                    <strong>{tier.priceLabel || formatPrice(tier.price)}</strong>
                  </div>
                ) : null}
              </div>
              <div>
                <p className="detail-sheet__supporting-copy">
                  What you get with this package:
                </p>
                <ul>
                  {PACKAGE_HIGHLIGHTS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="detail-sheet__actions detail-sheet__actions--single">
              <a
                href={tier.botBuyUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="detail-sheet__action detail-sheet__action--stream"
                onClick={handleBotAction(tier.botBuyUrl)}
              >
                <strong>Continue to Payment</strong>
                <span>{tier.priceLabel || formatPrice(tier.price)}</span>
              </a>
            </div>
            {showPayment && tier.productId ? (
              <PaymentSheet
                productId={tier.productId}
                quantity={1}
                priceLabel={tier.priceLabel || formatPrice(tier.price)}
                botFallbackUrl={tier.botBuyUrl}
                onClose={() => setShowPayment(false)}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
