import { TierItem } from '../features/tiers/types';
import { TierCard } from './TierCard';

export function TierGrid({ items }: { items: TierItem[] }) {
  return (
    <div className="tier-grid">
      {items.map((tier) => (
        <TierCard key={tier.id} tier={tier} />
      ))}
    </div>
  );
}
