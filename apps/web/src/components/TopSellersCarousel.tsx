import { Link, useLocation } from 'react-router-dom';
import { ClipItem } from '../features/clips/types';
import { formatPrice } from '../utils/format';

export function TopSellersCarousel({ items }: { items: ClipItem[] }) {
  const location = useLocation();

  if (!items.length) {
    return null;
  }

  return (
    <section className="top-sellers">
      <div className="top-sellers__header">
        <p className="hero__eyebrow">Top Sellers</p>
      </div>
      <div className="top-sellers__track">
        {items.map((clip) => (
          <Link key={clip.id} className="top-sellers__card" to={`/clips/${clip.id}${location.search}`}>
            <div className="top-sellers__media">
              {clip.thumbnailUrl || clip.previewWebpUrl ? (
                <img src={clip.thumbnailUrl || clip.previewWebpUrl} alt={clip.title} loading="lazy" />
              ) : (
                <div className="top-sellers__media-fallback">Preview coming soon</div>
              )}
            </div>
            <div className="top-sellers__body">
              <h3>{clip.title}</h3>
              <p>{clip.shortDescription || clip.description || 'Preview this clip in Telegram.'}</p>
              <div className="top-sellers__prices">
                <span>{`🎬 ${formatPrice(clip.streamPrice ?? clip.price)}`}</span>
                <span className="top-sellers__price-separator">•</span>
                <span>{`📥 ${formatPrice(clip.downloadPrice ?? clip.price)}`}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
