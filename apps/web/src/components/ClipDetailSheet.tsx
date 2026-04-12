import { MouseEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isTelegramWebView, openBotDeepLink, sendBotWebAppData } from '../app/telegram';
import { trackClipBotCtaClick, trackClipDetailView, trackClipTagSelect } from '../features/clips/analytics';
import { ClipItem } from '../features/clips/types';
import { CurrencyCode, formatDuration } from '../utils/format';
import { resolvePriceAmountPenceOptional, resolvePriceLabel } from '../utils/pricing';
import { stripStartRoutingParams } from '../utils/startRouting';
import { PreviewPlayer } from './PreviewPlayer';
import { PaymentSheet } from './PaymentSheet';

export function ClipDetailSheet({
  clip,
  loading,
  currency = 'GBP',
  errorMessage,
}: {
  clip?: ClipItem;
  loading?: boolean;
  currency?: CurrencyCode;
  errorMessage?: string | null;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const lastTrackedClipIdRef = useRef('');
  const restoreScrollOnCloseRef = useRef(true);
  const [showPayment, setShowPayment] = useState<null | 'stream' | 'download'>(null);
  const cleanedSearch = stripStartRoutingParams(location.search);
  const backTarget = `/clips${cleanedSearch ? `?${cleanedSearch}` : ''}`;
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
    const isTelegramWebApp = isTelegramWebView();
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
      if (restoreScrollOnCloseRef.current) {
        window.scrollTo(0, scrollY);
      }
    };
  }, []);

  useEffect(() => {
    if (!clip || lastTrackedClipIdRef.current === clip.id) {
      return;
    }
    lastTrackedClipIdRef.current = clip.id;
    trackClipDetailView(clip);
  }, [clip]);

  const streamPriceLabel = clip
    ? resolvePriceLabel({
        currency,
        pricings: [clip.streamPricing, clip.watchPricing, clip.pricing],
        defaultLabel: 'Price on request',
      })
    : undefined;

  const downloadPriceLabel = clip
    ? resolvePriceLabel({
        currency,
        pricings: [clip.downloadPricing, clip.pricing],
        defaultLabel: 'Price on request',
      })
    : undefined;

  const streamUnitPence = resolvePriceAmountPenceOptional({
    currency: 'GBP',
    pricings: clip ? [clip.streamPricing, clip.watchPricing, clip.pricing] : [],
  });
  const downloadUnitPence = resolvePriceAmountPenceOptional({
    currency: 'GBP',
    pricings: clip ? [clip.downloadPricing, clip.pricing] : [],
  });
  const showStreamButton = Boolean(clip?.watchProductId || isTelegramWebView());
  const showDownloadButton = Boolean(clip?.downloadProductId || isTelegramWebView());

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
        {!loading && !clip && errorMessage && <div className="detail-sheet__loading">{errorMessage}</div>}
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
                    state={{ pinSearchPanel: true, searchText: `#${tag}` }}
                    onClick={() => {
                      restoreScrollOnCloseRef.current = false;
                      trackClipTagSelect({ tag, source: 'detail_sheet', clip });
                    }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
            <div className="detail-sheet__actions">
              {showStreamButton ? (
                <a
                  href={clip.watchProductId ? '#' : clip.botStreamUrl}
                  target={clip.watchProductId ? undefined : '_blank'}
                  rel={clip.watchProductId ? undefined : 'noreferrer'}
                  className="detail-sheet__action detail-sheet__action--stream"
                  onClick={handleBotAction(clip.botStreamUrl, 'stream')}
                >
                  <div className="detail-sheet__action-stack">
                    <span aria-hidden="true">🎬</span>
                    <strong>Stream Now</strong>
                    <span>{streamPriceLabel}</span>
                  </div>
                </a>
              ) : null}
              {showDownloadButton ? (
                <a
                  href={clip.downloadProductId ? '#' : clip.botDownloadUrl}
                  target={clip.downloadProductId ? undefined : '_blank'}
                  rel={clip.downloadProductId ? undefined : 'noreferrer'}
                  className="detail-sheet__action detail-sheet__action--download"
                  onClick={handleBotAction(clip.botDownloadUrl, 'download')}
                >
                  <div className="detail-sheet__action-stack">
                    <span aria-hidden="true">📥</span>
                    <strong>Download Now</strong>
                    <span>{downloadPriceLabel}</span>
                  </div>
                </a>
              ) : null}
            </div>
            {showPayment && clip ? (
              <PaymentSheet
                productId={showPayment === 'stream' ? String(clip.watchProductId) : String(clip.downloadProductId)}
                quantity={1}
                mode={showPayment === 'stream' ? 'watch' : 'download'}
                priceLabel={showPayment === 'stream' ? streamPriceLabel : downloadPriceLabel}
                deliveryMode={showPayment === 'stream' ? 'stream' : 'download'}
                clipTitle={clip.title}
                botFallbackUrl={showPayment === 'stream' ? clip.botStreamUrl : clip.botDownloadUrl}
                preferredCurrency={currency}
                itemContext={{
                  unitPriceCents: showPayment === 'stream' ? streamUnitPence : downloadUnitPence,
                  clipId: clip.id,
                }}
                onClose={() => setShowPayment(null)}
                onClosePreview={() => navigate(backTarget, { replace: true })}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
