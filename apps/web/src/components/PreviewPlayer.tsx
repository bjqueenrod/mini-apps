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
  if (embedUrl) {
    return (
      <div className="preview-player">
        <iframe
          src={embedUrl}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  const backgroundUrl = thumbnailUrl || previewImageUrl;
  return (
    <div className="preview-player preview-player--fallback" style={{ backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined }}>
      <span>No public preview available yet.</span>
    </div>
  );
}
