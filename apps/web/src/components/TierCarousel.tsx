import { Link } from 'react-router-dom';
import { getTierArtwork, getTierArtworkVariant } from '../features/tiers/artwork';
import {
  getTierDurationLabel,
  getTierGuideLabels,
  getTierTasksLabel,
} from '../features/tiers/presentation';
import { TierItem } from '../features/tiers/types';
import { formatPrice } from '../utils/format';
import { toTierPath } from '../utils/links';

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

  switch (badgeLabel) {
    case 'Best for first timers':
      return 'Good for a first custom order with a lighter, guided pace.';
    case 'Most Popular':
      return 'More structure, more momentum, and a fuller guided experience.';
    case 'High Intensity':
      return 'For buyers who want a fuller experience with a heavier pace.';
    default:
      if (tier.isUnlimitedTasks) {
        return 'For buyers who want a more immersive, open-ended obedience flow.';
      }
      if ((tier.durationDays ?? 0) >= 5) {
        return 'For buyers who want more time to build momentum and structure.';
      }
      return 'A custom package with clear pacing, personal tailoring, and easy entry.';
  }
}

function valueCopyLabel(tier: TierItem): string {
  const description = tier.description?.trim();
  const shortDescription = tier.shortDescription?.trim();

  if (description && description !== shortDescription) {
    return description;
  }

  if (tier.isUnlimitedTasks) {
    return 'A more immersive flow with personal review, proof checks, and room to settle into the experience.';
  }

  if ((tier.durationDays ?? 0) >= 5) {
    return 'A longer package with more room for progression, pacing, and a stronger sense of build.';
  }

  return 'Custom obedience built around your preferences, limits, and desired intensity from the first step.';
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
                <Link
                  key={tier.id}
                  className={[
                    'top-sellers__card',
                    'top-sellers__card--tier',
                    artworkVariant === 'light' ? 'top-sellers__card--light' : 'top-sellers__card--base',
                    badgeLabel === 'Most Popular' ? 'top-sellers__card--featured' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  to={toTierPath(tier.id)}
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
                    <h3>{tier.name}</h3>
                    <p className="top-sellers__descriptor">{descriptor}</p>
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
                    <p className="top-sellers__value-copy">{valueSummary}</p>
                    <span className="top-sellers__cta">Choose Package</span>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
