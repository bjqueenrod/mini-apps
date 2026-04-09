import { useMemo, useState } from 'react';

export function PreviewPlayer({
  embedUrl,
  thumbnailUrl,
  previewImageUrl,
  title,
}: {
  embedUrl?: string;
  thumbnailUrl?: string;
  previewImageUrl?: string;
  title: string;
}) {
  const [active, setActive] = useState(false);
  const posterUrl = useMemo(() => thumbnailUrl || undefined, [thumbnailUrl]);
  const animatedPosterUrl = useMemo(() => previewImageUrl || thumbnailUrl, [previewImageUrl, thumbnailUrl]);

  if (embedUrl) {
    return (
      <div
        className="preview-player"
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
      >
        {active ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div
            className="preview-player__poster"
            style={{ backgroundImage: posterUrl ? `url(${posterUrl})` : undefined }}
            aria-label={title}
          >
            <span className="preview-player__hint">Hover to play</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="preview-player preview-player--fallback"
      style={{ backgroundImage: active ? (animatedPosterUrl ? `url(${animatedPosterUrl})` : undefined) : posterUrl ? `url(${posterUrl})` : undefined }}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <span>{active ? 'Loading preview...' : 'No public preview available yet.'}</span>
    </div>
  );
}
