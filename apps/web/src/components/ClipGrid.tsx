import { ClipItem } from '../features/clips/types';
import { CurrencyCode } from '../utils/format';
import { ClipCard } from './ClipCard';

export function ClipGrid({ items, currency = 'GBP' }: { items: ClipItem[]; currency?: CurrencyCode }) {
  return (
    <div className="clip-grid">
      {items.map((clip, index) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          position={index + 1}
          sourceList="search_results"
          currency={currency}
        />
      ))}
    </div>
  );
}
