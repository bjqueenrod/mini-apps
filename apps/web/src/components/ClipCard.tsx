import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipItem } from '../features/clips/types';
import { formatDuration, formatPrice } from '../utils/format';
import { safeBackground } from '../utils/theme';

export function ClipCard({ clip }: { clip: ClipItem }) {
  const location = useLocation();
  const mediaCandidates = useMemo(
    () => [clip.thumbnailUrl, clip.previewWebpUrl].filter(Boolean) as string[],
    [clip.previewWebpUrl, clip.thumbnailUrl],
  );
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    setMediaIndex(0);
  }, [mediaCandidates]);

  const mediaUrl = mediaCandidates[mediaIndex];

  return (
    <Link className="clip-card" to={`/clips/${clip.id}${location.search}`}>
      <div className="clip-card__media" style={!mediaUrl ? { backgroundImage: safeBackground() } : undefined}>
        {mediaUrl ? (
          <img
            src={mediaUrl}
            alt={clip.title}
            loading="lazy"
            onError={() => {
              if (mediaIndex < mediaCandidates.length - 1) {
                setMediaIndex((current) => current + 1);
              } else {
                setMediaIndex(mediaCandidates.length);
              }
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
          <span>{formatDuration(clip.durationLabel, clip.durationSeconds)}</span>
        </div>
        <h3>{clip.title}</h3>
        <p>{clip.shortDescription || clip.description || 'Preview this clip in Telegram.'}</p>
        <div className="clip-card__footer">
          <div className="clip-card__prices">
            <span>{`🎬 ${formatPrice(clip.streamPrice ?? clip.price)}`}</span>
            <span className="clip-card__price-separator">•</span>
            <span>{`📥 ${formatPrice(clip.downloadPrice ?? clip.price)}`}</span>
          </div>
          <span className="clip-card__tags">{clip.tags.slice(0, 2).map((tag) => `#${tag}`).join(' ')}</span>
        </div>
      </div>
    </Link>
  );
}
