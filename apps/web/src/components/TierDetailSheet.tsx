import { MouseEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { openBotDeepLink } from '../app/telegram';
import { TierItem } from '../features/tiers/types';
import { formatPrice } from '../utils/format';

function durationLabel(tier?: TierItem): string {
  if (!tier?.durationDays) return 'Custom duration';
  return tier.durationDays === 1 ? '1 day' : `${tier.durationDays} days`;
}

function tasksLabel(tier?: TierItem): string {
  if (!tier) return 'Custom pace';
  if (tier.isUnlimitedTasks) return 'Unlimited tasks per day';
  if (!tier.tasksPerDay) return 'Custom pace';
  return tier.tasksPerDay === 1 ? '1 task per day' : `${tier.tasksPerDay} tasks per day`;
}

export function TierDetailSheet({ tier, loading }: { tier?: TierItem; loading?: boolean }) {
  const handleBotAction = (url?: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!url) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
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

  return (
    <div className="detail-sheet__backdrop">
      <div className="detail-sheet detail-sheet--tier">
        <div className="detail-sheet__header">
          <Link to="/tasks" className="detail-sheet__back">
            Back
          </Link>
          <span>Task Package</span>
        </div>
        {loading && <div className="detail-sheet__loading">Loading package...</div>}
        {!loading && tier && (
          <>
            <div className="detail-sheet__body detail-sheet__body--tier">
              <div className="detail-sheet__eyebrow">
                <span>{tier.badge || 'Custom Obedience'}</span>
                <span>{durationLabel(tier)}</span>
              </div>
              <h2>{tier.name}</h2>
              <p>{tier.description || tier.shortDescription}</p>
              <div className="tier-detail__facts">
                <div className="tier-detail__fact">
                  <span className="tier-detail__label">Duration</span>
                  <strong>{durationLabel(tier)}</strong>
                </div>
                <div className="tier-detail__fact">
                  <span className="tier-detail__label">Pace</span>
                  <strong>{tasksLabel(tier)}</strong>
                </div>
                <div className="tier-detail__fact">
                  <span className="tier-detail__label">Product</span>
                  <strong>{tier.productId ? `Product ${tier.productId}` : `Tier ${tier.id}`}</strong>
                </div>
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
                <strong>🛒 Buy in Bot</strong>
                <span>{tier.priceLabel || formatPrice(tier.price)}</span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
