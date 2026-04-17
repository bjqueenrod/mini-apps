import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { trackClipSelect } from '../features/clips/analytics';
import { ClipItem } from '../features/clips/types';
import { CurrencyCode, formatDuration } from '../utils/format';
import { resolvePriceLabel } from '../utils/pricing';
import { pickPrimaryTags } from '../utils/tags';
import { safeBackground } from '../utils/theme';
import { toClipPath } from '../utils/links';

function toStaticThumbnail(url?: string) {
  if (!url) return url;
  return url.replace(/preview\.webp(\?.*)?$/i, 'thumbnail.jpg$1');
}

export function ClipCard({
  clip,
  position,
  sourceList,
  currency = 'GBP',
}: {
  clip: ClipItem;
  position: number;
  sourceList: 'search_results' | 'new_clips' | 'top_sellers' | 'featured_clips';
  currency?: CurrencyCode;
}) {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedTag = searchParams.get('tags')?.split(',')[0] ?? undefined;
  const displayTags = useMemo(() => pickPrimaryTags(clip.tags, selectedTag), [clip.tags, selectedTag]);
  const streamPriceLabel = resolvePriceLabel({
    currency,
    pricings: [clip.streamPricing, clip.watchPricing, clip.pricing],
    defaultLabel: 'Price on request',
  });
  const downloadPriceLabel = resolvePriceLabel({
    currency,
    pricings: [clip.downloadPricing, clip.pricing],
    defaultLabel: 'Price on request',
  });

  const mediaUrl = toStaticThumbnail(clip.thumbnailUrl);

  return (
    <Link
      className="clip-card"
      to={toClipPath(clip.id, location.search)}
      onClick={() =>
        trackClipSelect({
          clip,
          sourceList,
          position,
          query: searchParams.get('q') ?? '',
          tags: (searchParams.get('tags') ?? '').split(',').filter(Boolean),
        })
      }
    >
      <div className="clip-card__media" style={!mediaUrl ? { backgroundImage: safeBackground() } : undefined}>
        {clip.featured ? (
          <span className="clip-badge clip-badge--featured" aria-label="Featured clip">
            Featured
          </span>
        ) : null}
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt={clip.title}
            loading="lazy"
          />
        ) : (
          <div className="clip-card__media-placeholder">
            <span>Preview coming soon</span>
          </div>
        )}
      </div>
      <div className="clip-card__body">
        <div className="clip-card__eyebrow">
          <span className="clip-card__id">{clip.id}</span>
          <span>{formatDuration(clip.durationLabel, clip.durationSeconds)}</span>
        </div>
        <h3>{clip.title}</h3>
        <p>{clip.description || clip.shortDescription || 'Preview this clip in Telegram.'}</p>
        <div className="clip-card__footer">
          <div className="clip-card__prices">
            <span>{`🎬 ${streamPriceLabel}`}</span>
            <span className="clip-card__price-separator">•</span>
            <span>{`📥 ${downloadPriceLabel}`}</span>
          </div>
          <span className="clip-card__tags">{displayTags.map((tag) => `#${tag}`).join(' ')}</span>
        </div>
      </div>
    </Link>
  );
}
