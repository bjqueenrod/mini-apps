import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { trackClipSelect } from '../features/clips/analytics';
import { ClipItem } from '../features/clips/types';
import { formatDuration, formatPrice } from '../utils/format';
import { pickPrimaryTags } from '../utils/tags';
import { safeBackground } from '../utils/theme';
import { toClipPath } from '../utils/links';

export function ClipCard({
  clip,
  position,
  sourceList,
}: {
  clip: ClipItem;
  position: number;
  sourceList: 'search_results' | 'new_clips' | 'top_sellers';
}) {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedTag = searchParams.get('tags')?.split(',')[0] ?? undefined;
  const [isHovering, setIsHovering] = useState(false);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const displayTags = useMemo(() => pickPrimaryTags(clip.tags, selectedTag), [clip.tags, selectedTag]);

  useEffect(() => {
    setFallbackTriggered(false);
  }, [clip.thumbnailUrl, clip.previewWebpUrl]);

  const stillUrl = clip.thumbnailUrl;
  const animatedUrl = clip.previewWebpUrl;
  const mediaUrl = fallbackTriggered ? undefined : (isHovering ? animatedUrl || stillUrl : stillUrl);

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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onFocus={() => setIsHovering(true)}
      onBlur={() => setIsHovering(false)}
    >
      <div className="clip-card__media" style={!mediaUrl ? { backgroundImage: safeBackground() } : undefined}>
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt={clip.title}
            loading="lazy"
            onError={() => {
              setFallbackTriggered(true);
            }}
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
            <span>{`🎬 ${formatPrice(clip.streamPrice ?? clip.price)}`}</span>
            <span className="clip-card__price-separator">•</span>
            <span>{`📥 ${formatPrice(clip.downloadPrice ?? clip.price)}`}</span>
          </div>
          <span className="clip-card__tags">{displayTags.map((tag) => `#${tag}`).join(' ')}</span>
        </div>
      </div>
    </Link>
  );
}
