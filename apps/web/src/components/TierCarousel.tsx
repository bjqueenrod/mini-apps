import { Link } from 'react-router-dom';
import { getTierArtwork } from '../features/tiers/artwork';
import { getTierGuideLabels } from '../features/tiers/presentation';
import { TierItem } from '../features/tiers/types';
import { formatPrice } from '../utils/format';
import { toTierPath } from '../utils/links';

function durationLabel(tier: TierItem): string {
  if (!tier.durationDays) return 'Custom duration';
  return tier.durationDays === 1 ? '1 day' : `${tier.durationDays} days`;
}

function tasksLabel(tier: TierItem): string {
  if (tier.isUnlimitedTasks) return 'Unlimited tasks';
  if (!tier.tasksPerDay) return 'Custom pace';
  return tier.tasksPerDay === 1 ? '1 task / day' : `${tier.tasksPerDay} tasks / day`;
}

function priceLabel(tier: TierItem): string {
  return tier.priceLabel || formatPrice(tier.price);
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

  return (
    <section className="top-sellers top-sellers--tiers">
      {title ? (
        <div className="top-sellers__header">
          <p className="hero__eyebrow">{title}</p>
        </div>
      ) : null}
      <div className="top-sellers__track">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="top-sellers__card top-sellers__card--skeleton" aria-hidden="true">
                <div className="top-sellers__media top-sellers__media--skeleton" />
                <div className="top-sellers__body">
                  <div className="top-sellers__eyebrow">
                    <span className="top-sellers__line top-sellers__line--small" />
                    <span className="top-sellers__line top-sellers__line--small" />
                  </div>
                  <span className="top-sellers__line top-sellers__line--title" />
                  <span className="top-sellers__line top-sellers__line--title top-sellers__line--short" />
                  <span className="top-sellers__line top-sellers__line--body" />
                  <span className="top-sellers__line top-sellers__line--body top-sellers__line--short" />
                  <div className="top-sellers__prices">
                    <span className="top-sellers__line top-sellers__line--price" />
                  </div>
                </div>
              </div>
            ))
          : items.map((tier) => (
              <Link key={tier.id} className="top-sellers__card" to={toTierPath(tier.id)}>
                {(() => {
                  const badgeLabel = guideLabels[tier.id] || tier.badge;

                  return (
                    <>
                      <div className="top-sellers__media top-sellers__media--tier">
                        <img src={getTierArtwork(tier, badgeLabel)} alt={`${tier.name} package artwork`} loading="lazy" />
                      </div>
                      <div className="top-sellers__body">
                        <div className="top-sellers__eyebrow">
                          {badgeLabel ? (
                            <span className="top-sellers__tier-badge top-sellers__tier-badge--inline">{badgeLabel}</span>
                          ) : (
                            <span />
                          )}
                          <span>{durationLabel(tier)}</span>
                        </div>
                        <h3>{tier.name}</h3>
                        <p>{tier.shortDescription || tier.description || 'A premium obedience package.'}</p>
                        <div className="top-sellers__prices">
                          <span>{tasksLabel(tier)}</span>
                          <span className="top-sellers__price-separator">•</span>
                          <span>{priceLabel(tier)}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </Link>
            ))}
      </div>
    </section>
  );
}
