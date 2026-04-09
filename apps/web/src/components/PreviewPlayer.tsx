import { useState } from 'react';

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
  const backgroundUrl = thumbnailUrl || previewImageUrl;

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
            style={{ backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined }}
            aria-label={title}
          >
            <span className="preview-player__hint">Hover to play</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="preview-player preview-player--fallback" style={{ backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined }}>
      <span>No public preview available yet.</span>
    </div>
  );
}
