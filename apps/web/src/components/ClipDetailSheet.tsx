import { Link, useLocation } from 'react-router-dom';
import { ClipItem } from '../features/clips/types';
import { formatDuration, formatPrice } from '../utils/format';
import { PreviewPlayer } from './PreviewPlayer';

export function ClipDetailSheet({ clip, loading }: { clip?: ClipItem; loading?: boolean }) {
  const location = useLocation();
  const backTarget = `/${location.search}`;
  const tagHref = (tag: string) => {
    const params = new URLSearchParams();
    params.set('q', `#${tag}`);
    return `/?${params.toString()}`;
  };

  return (
    <div className="detail-sheet__backdrop">
      <div className="detail-sheet">
        <div className="detail-sheet__header">
          <Link to={backTarget} className="detail-sheet__back">
            Back
          </Link>
          <span>Clip Preview</span>
        </div>
        {loading && <div className="detail-sheet__loading">Loading clip...</div>}
        {!loading && clip && (
          <>
            <PreviewPlayer
              embedUrl={clip.previewEmbedUrl}
              thumbnailUrl={clip.thumbnailUrl}
              previewImageUrl={clip.previewWebpUrl}
              title={clip.title}
            />
            <div className="detail-sheet__body">
              <div className="detail-sheet__eyebrow">
                <span>{clip.category || 'Library'}</span>
                <span>{formatDuration(clip.durationLabel, clip.durationSeconds)}</span>
              </div>
              <h2>{clip.title}</h2>
              <p>{clip.description || clip.shortDescription}</p>
              <div className="detail-sheet__tags">
                {clip.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={tagHref(tag)}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
            <div className="detail-sheet__actions">
              <a href={clip.botStreamUrl} target="_blank" rel="noreferrer" className="detail-sheet__action detail-sheet__action--stream">
                <strong>Stream in Bot</strong>
                <span>{formatPrice(clip.streamPrice ?? clip.price)}</span>
              </a>
              <a href={clip.botDownloadUrl} target="_blank" rel="noreferrer" className="detail-sheet__action detail-sheet__action--download">
                <strong>Download in Bot</strong>
                <span>{formatPrice(clip.downloadPrice ?? clip.price)}</span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
