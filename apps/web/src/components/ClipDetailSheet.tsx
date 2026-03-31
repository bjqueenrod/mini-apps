import { MouseEvent, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { openBotDeepLink } from '../app/telegram';
import { ClipItem } from '../features/clips/types';
import { formatDuration, formatPrice } from '../utils/format';
import { PreviewPlayer } from './PreviewPlayer';

export function ClipDetailSheet({ clip, loading }: { clip?: ClipItem; loading?: boolean }) {
  const location = useLocation();
  const backTarget = `/clips${location.search}`;
  const tagHref = (tag: string) => {
    const params = new URLSearchParams();
    params.set('q', `#${tag}`);
    return `/clips?${params.toString()}`;
  };
  const handleBotAction = (url: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openBotDeepLink(url);
  };

  useEffect(() => {
    const scrollY = window.scrollY;
    const { body } = document;
    const root = document.documentElement;
    const previousBody = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const previousRootOverflow = root.style.overflow;

    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBody.overflow;
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.width = previousBody.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

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
                    state={{ pinSearchPanel: true }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
            <div className="detail-sheet__actions">
              <a
                href={clip.botStreamUrl}
                target="_blank"
                rel="noreferrer"
                className="detail-sheet__action detail-sheet__action--stream"
                onClick={handleBotAction(clip.botStreamUrl)}
              >
                <strong>🎬 Stream in Bot</strong>
                <span>{formatPrice(clip.streamPrice ?? clip.price)}</span>
              </a>
              <a
                href={clip.botDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="detail-sheet__action detail-sheet__action--download"
                onClick={handleBotAction(clip.botDownloadUrl)}
              >
                <strong>📥 Download in Bot</strong>
                <span>{formatPrice(clip.downloadPrice ?? clip.price)}</span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
