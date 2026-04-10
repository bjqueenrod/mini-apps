import { Link, useLocation } from 'react-router-dom';
import { trackClipSelect } from '../features/clips/analytics';
import { ClipItem } from '../features/clips/types';
import { CurrencyCode, formatDuration, formatPrice } from '../utils/format';
import { toClipPath } from '../utils/links';
import { usePagedCarousel } from './usePagedCarousel';

function toStaticThumbnail(url?: string) {
  if (!url) return url;
  return url.replace(/preview\.webp(\?.*)?$/i, 'thumbnail.jpg$1');
}

export function TopSellersCarousel({
  items,
  title = '⭐ Top Sellers',
  loading = false,
  listType = 'top_sellers',
  currency = 'GBP',
}: {
  items: ClipItem[];
  title?: string;
  loading?: boolean;
  listType?: 'new_clips' | 'top_sellers';
  currency?: CurrencyCode;
}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const pageCount = loading ? 3 : items.length;
  const { currentPage, scrollToPage, trackRef } = usePagedCarousel(pageCount);

  if (!items.length && !loading) {
    return null;
  }

  return (
    <section className="top-sellers">
      <div className="top-sellers__header">
        <p className="hero__eyebrow">{title}</p>
      </div>
      <div ref={trackRef} className="top-sellers__track">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="top-sellers__card top-sellers__card--skeleton" aria-hidden="true">
                <div className="top-sellers__media top-sellers__media--skeleton" />
                <div className="top-sellers__body">
                  <div className="top-sellers__eyebrow">
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
          : items.map((clip, index) => {
              const mediaUrl = toStaticThumbnail(clip.thumbnailUrl);
              return (
                <Link
                  key={clip.id}
                  className="top-sellers__card"
                  to={toClipPath(clip.id, location.search)}
                  onClick={() =>
                    trackClipSelect({
                      clip,
                      sourceList: listType,
                      position: index + 1,
                      query: searchParams.get('q') ?? '',
                      tags: (searchParams.get('tags') ?? '').split(',').filter(Boolean),
                    })
                  }
                >
                  <div className="top-sellers__media">
                    {mediaUrl ? (
                      <img src={mediaUrl} alt={clip.title} loading="lazy" />
                    ) : (
                      <div className="top-sellers__media-fallback">Preview coming soon</div>
                    )}
                  </div>
                  <div className="top-sellers__body">
                    <div className="top-sellers__eyebrow">
                      <span className="top-sellers__id">{clip.id}</span>
                      <span>{formatDuration(clip.durationLabel, clip.durationSeconds)}</span>
                    </div>
                    <h3>{clip.title}</h3>
                    <p>{clip.shortDescription || clip.description || 'Preview this clip in Telegram.'}</p>
                    <div className="top-sellers__prices">
                      <span>{`🎬 ${formatPrice(clip.streamPrice ?? clip.price, currency)}`}</span>
                      <span className="top-sellers__price-separator">•</span>
                      <span>{`📥 ${formatPrice(clip.downloadPrice ?? clip.price, currency)}`}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
      {pageCount > 1 ? (
        <div className="top-sellers__pagination" aria-label={`${title} pages`}>
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={`top-sellers__pagination-dot${index === currentPage ? ' is-active' : ''}`}
              onClick={() => scrollToPage(index)}
              aria-label={`Go to page ${index + 1}`}
              aria-current={index === currentPage ? 'true' : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
