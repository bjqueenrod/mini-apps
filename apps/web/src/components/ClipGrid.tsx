import { ClipItem } from '../features/clips/types';
import { ClipCard } from './ClipCard';

export function ClipGrid({ items }: { items: ClipItem[] }) {
  return (
    <div className="clip-grid">
      {items.map((clip, index) => (
        <ClipCard key={clip.id} clip={clip} position={index + 1} sourceList="search_results" />
      ))}
    </div>
  );
}
