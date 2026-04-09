import { useMemo } from 'react';

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
  const posterUrl = useMemo(() => thumbnailUrl || undefined, [thumbnailUrl]);
  const animatedPosterUrl = useMemo(
    () => (previewImageUrl && previewImageUrl !== thumbnailUrl ? previewImageUrl : undefined),
    [previewImageUrl, thumbnailUrl],
  );

  if (embedUrl) {
    return (
      <div className="preview-player">
        <iframe
          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}mute=1&autoplay=1&playsinline=true&controls=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; accelerometer; gyroscope"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div
      className="preview-player preview-player--fallback"
      style={{ backgroundImage: posterUrl ? `url(${posterUrl})` : undefined }}
    >
      <span>{animatedPosterUrl ? 'Preview available on request.' : 'No public preview available yet.'}</span>
    </div>
  );
}
