import { Link } from 'react-router-dom';
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
  return tier.tasksPerDay === 1 ? '1 task per day' : `${tier.tasksPerDay} tasks per day`;
}

export function TierCard({ tier }: { tier: TierItem }) {
  return (
    <Link to={toTierPath(tier.id)} className="tier-card">
      <div className="tier-card__eyebrow">
        <span className="tier-card__badge">{tier.badge || 'Package'}</span>
        <span>{durationLabel(tier)}</span>
      </div>
      <h3>{tier.name}</h3>
      <p>{tier.shortDescription || tier.description || 'A premium obedience package.'}</p>
      <div className="tier-card__facts">
        <span>{tasksLabel(tier)}</span>
        <strong>{tier.priceLabel || formatPrice(tier.price)}</strong>
      </div>
    </Link>
  );
}
