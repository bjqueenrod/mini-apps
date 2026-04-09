import { MouseEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { openBotDeepLink, sendBotWebAppData } from '../app/telegram';
import { trackClipBotCtaClick, trackClipDetailView, trackClipTagSelect } from '../features/clips/analytics';
import { ClipItem } from '../features/clips/types';
import { formatDuration, formatPrice } from '../utils/format';
import { PreviewPlayer } from './PreviewPlayer';
import { PaymentSheet } from './PaymentSheet';

export function ClipDetailSheet({ clip, loading }: { clip?: ClipItem; loading?: boolean }) {
  const location = useLocation();
  const lastTrackedClipIdRef = useRef('');
  const [showPayment, setShowPayment] = useState<null | 'stream' | 'download'>(null);
  const backTarget = `/clips${location.search}`;
  const tagHref = (tag: string) => {
    const params = new URLSearchParams();
    params.set('q', `#${tag}`);
    return `/clips?${params.toString()}`;
  };
  const handleBotAction = (url: string, ctaType: 'stream' | 'download') => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (clip) {
      trackClipBotCtaClick({ clip, ctaType });
    }
    const payload = ctaType === 'stream' ? `stream_${clip?.id}` : `download_${clip?.id}`;
    const isTelegramWebApp = Boolean(window.Telegram?.WebApp);
    const productId = ctaType === 'stream' ? clip?.watchProductId : clip?.downloadProductId;

    if (productId) {
      setShowPayment(ctaType);
      return;
    }

    if (clip && isTelegramWebApp && sendBotWebAppData(payload)) {
      return;
    }
    if (isTelegramWebApp) {
      return;
    }
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

  useEffect(() => {
    if (!clip || lastTrackedClipIdRef.current === clip.id) {
      return;
    }
    lastTrackedClipIdRef.current = clip.id;
    trackClipDetailView(clip);
  }, [clip]);

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
                    onClick={() => trackClipTagSelect({ tag, source: 'detail_sheet', clip })}
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
              onClick={handleBotAction(clip.botStreamUrl, 'stream')}
            >
                <strong>🎬 Stream Now</strong>
                <span>{formatPrice(clip.streamPrice ?? clip.price)}</span>
              </a>
              <a
                href={clip.botDownloadUrl}
                target="_blank"
              rel="noreferrer"
              className="detail-sheet__action detail-sheet__action--download"
              onClick={handleBotAction(clip.botDownloadUrl, 'download')}
            >
                <strong>📥 Download Now</strong>
                <span>{formatPrice(clip.downloadPrice ?? clip.price)}</span>
              </a>
            </div>
            {showPayment && clip ? (
              <PaymentSheet
                productId={showPayment === 'stream' ? String(clip.watchProductId) : String(clip.downloadProductId)}
                quantity={1}
                mode={showPayment === 'stream' ? 'watch' : 'download'}
                priceLabel={formatPrice(showPayment === 'stream' ? clip.streamPrice ?? clip.price : clip.downloadPrice ?? clip.price)}
                botFallbackUrl={showPayment === 'stream' ? clip.botStreamUrl : clip.botDownloadUrl}
                itemContext={{
                  unitPriceCents: Math.round(
                    100 * (showPayment === 'stream' ? clip.streamPrice ?? clip.price ?? 0 : clip.downloadPrice ?? clip.price ?? 0),
                  ),
                  clipId: clip.id,
                }}
                onClose={() => setShowPayment(null)}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
