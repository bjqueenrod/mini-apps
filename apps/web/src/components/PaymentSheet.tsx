import { useCallback, useEffect, useMemo, useState } from 'react';
import { cancelInvoice, pollInvoice, fetchCheckoutOptions, startCheckout } from '../features/payments/api';
import type { InvoiceStatusResponse } from '../features/payments/types';
import { PaymentMethod } from '../features/payments/types';
import { resolvePriceLabelOptional } from '../utils/pricing';
import { isTelegramWebView, openBotDeepLink } from '../app/telegram';
import { useCurrencyPreference } from '../hooks/useCurrencyPreference';

type SheetState = 'loading' | 'select' | 'confirm' | 'submitting' | 'waiting' | 'success' | 'error';
const WAITING_TIMEOUT_MS = 5 * 60 * 1000;

function openPaymentUrl(url?: string | null) {
  if (!url) return false;
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) return true;
  } catch (error) {
    // ignore and try fallbacks
  }
  try {
    window.Telegram?.WebApp?.openLink?.(url);
    return true;
  } catch (error) {
    try {
      window.Telegram?.WebApp?.openTelegramLink?.(url);
      return true;
    } catch (err) {
      return false;
    }
  }
}

export function PaymentSheet({
  productId,
  quantity = 1,
  mode,
  priceLabel,
  deliveryMode,
  botFallbackUrl,
  onClose,
  onSuccess,
  itemContext,
}: {
  productId: string;
  quantity?: number;
  mode?: string;
  priceLabel?: string;
  deliveryMode?: 'stream' | 'download';
  botFallbackUrl?: string;
  onClose: () => void;
  onSuccess?: (result?: InvoiceStatusResponse) => void;
  itemContext?: Record<string, unknown>;
}) {
  const [state, setState] = useState<SheetState>('loading');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string | undefined>('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [savedPaymentCode, setSavedPaymentCode] = useState<string>('');
  const [copiedTributeCode, setCopiedTributeCode] = useState(false);
  const [waitingStartedAt, setWaitingStartedAt] = useState<number | null>(null);
  const [waitingRemainingSeconds, setWaitingRemainingSeconds] = useState<number>(WAITING_TIMEOUT_MS / 1000);
  const [successResult, setSuccessResult] = useState<InvoiceStatusResponse | null>(null);
  const [currency] = useCurrencyPreference(false);
  const storageKey = useMemo(
    () => `paymentSheet:${productId}:${mode || 'default'}`,
    [productId, mode],
  );

  const saveProgress = useCallback(
    (
      payload: {
        invoiceId?: string;
        paymentUrl?: string;
        paymentCode?: string;
        selectedMethod?: string;
        orderId?: number | null;
        waitingStartedAt?: number | null;
      },
    ) => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            invoiceId: payload.invoiceId || '',
            paymentUrl: payload.paymentUrl || '',
            paymentCode: payload.paymentCode || '',
            selectedMethod: payload.selectedMethod || '',
            orderId: payload.orderId ?? null,
            waitingStartedAt: payload.waitingStartedAt ?? null,
          }),
        );
      } catch {
        // ignore storage errors
      }
    },
    [storageKey],
  );

  const clearProgress = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        invoiceId?: string;
        paymentUrl?: string;
        paymentCode?: string;
        selectedMethod?: string;
        orderId?: number;
        waitingStartedAt?: number;
      };
      if (parsed?.orderId) {
        setOrderId(parsed.orderId);
      }
      if (parsed?.invoiceId) {
        setInvoiceId(parsed.invoiceId);
        setPaymentUrl(parsed.paymentUrl || '');
        setSavedPaymentCode(parsed.paymentCode || '');
        setWaitingStartedAt(parsed.waitingStartedAt || Date.now());
        if (parsed.selectedMethod) setSelectedMethod(parsed.selectedMethod);
        setState('waiting');
      }
    } catch {
      // ignore parse errors
    }
  }, [storageKey]);

  const selectedMethodInfo = useMemo(
    () => methods.find((m) => m.paymentMethod === selectedMethod),
    [methods, selectedMethod],
  );
  const itemContextKey = useMemo(() => JSON.stringify(itemContext || {}), [itemContext]);
  const selectedMethodPriceLabel = useMemo(
    () =>
      selectedMethodInfo
        ? resolvePriceLabelOptional({
            currency,
            pricings: [selectedMethodInfo.pricing],
          })
        : undefined,
    [selectedMethodInfo, currency],
  );
  const selectedPriceLabel = selectedMethodPriceLabel || priceLabel;
  const selectedInstructionsTemplate =
    selectedMethodInfo?.instruction_templates?.checkout_default?.trim() ||
    selectedMethodInfo?.instructionTemplates?.checkoutDefault?.trim() ||
    selectedMethodInfo?.instructions?.trim();
  const selectedInstructions =
    selectedInstructionsTemplate?.replace(/\{price\}/g, () => selectedPriceLabel || '') || undefined;
  const selectedTributeCode = savedPaymentCode?.trim() || selectedMethodInfo?.tributeCode?.trim();
  const botFallbackLink = botFallbackUrl || '';
  const showBotFallbackActions = Boolean(botFallbackLink && isTelegramWebView());
  const showPaymentDetails = state !== 'select';
  const requiresCode = Boolean(selectedMethodInfo?.requiresCode);
  const hasInstructions = Boolean(selectedInstructions || selectedTributeCode || requiresCode);
  const isInitialLoading = state === 'loading';
  const isSubmittingCheckout = state === 'submitting';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let persistedOrderId: number | undefined;
        let persistedSelectedMethod = '';
        try {
          const raw = sessionStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw) as {
              orderId?: number;
              selectedMethod?: string;
            };
            persistedOrderId = parsed?.orderId;
            persistedSelectedMethod = (parsed?.selectedMethod || '').trim();
          }
        } catch {
          // ignore storage parse errors
        }
        const data = await fetchCheckoutOptions(productId, quantity, mode, {
          ...itemContext,
          ...(persistedOrderId ? { orderId: persistedOrderId } : {}),
        });
        if (cancelled) return;
        setMethods(data.paymentMethods || []);
        if (!selectedMethod && !persistedSelectedMethod) {
          setSelectedMethod((data.paymentMethods || [])[0]?.paymentMethod || '');
        }
        setState((prev) => (prev === 'loading' ? 'select' : prev));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Payment options unavailable.';
        setError(message);
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, quantity, mode, itemContextKey, storageKey]);

  const selectedLabel = useMemo(
    () => selectedMethodInfo?.label || 'Pay',
    [selectedMethodInfo],
  );
  const resolvedDeliveryMode = useMemo(() => {
    if (deliveryMode === 'stream' || deliveryMode === 'download') {
      return deliveryMode;
    }
    if (successResult?.deliveryMode === 'stream' || successResult?.deliveryMode === 'download') {
      return successResult.deliveryMode;
    }
    if (mode === 'watch') return 'stream';
    if (mode === 'download') return 'download';
    return undefined;
  }, [deliveryMode, successResult?.deliveryMode, mode]);
  const isPaypalSelected = selectedMethodInfo?.paymentMethod === 'paypal';
  const isThroneSelected = selectedMethodInfo?.paymentMethod === 'throne';
  const isBrandPayButton = isPaypalSelected || isThroneSelected;
  const checkoutMessage = useMemo(() => {
    if (isPaypalSelected) {
      return "Opening PayPal website in a new window. Come back here when you're done paying.";
    }
    if (isThroneSelected) {
      return "Opening Throne website in a new window. Come back here when you're done paying.";
    }
    return 'Opening your payment link now.';
  }, [isPaypalSelected, isThroneSelected]);

  const payButtonLabel = useMemo(() => {
    const methodPriceLabel = selectedMethodPriceLabel || selectedMethodInfo?.label || '';
    const paypalPayLabel = methodPriceLabel ? `Pay - ${methodPriceLabel}` : 'Pay';
    const thronePayLabel = methodPriceLabel ? `Pay - ${methodPriceLabel}` : 'Pay';
    if (state === 'confirm') {
      if (isPaypalSelected) return paypalPayLabel;
      if (isThroneSelected) return thronePayLabel;
      return methodPriceLabel ? `Pay ${methodPriceLabel}` : `Pay with ${selectedLabel}`;
    }
    if (state === 'select') {
      if (hasInstructions) return 'Confirm';
      if (isPaypalSelected) return paypalPayLabel;
      if (isThroneSelected) return thronePayLabel;
      return methodPriceLabel ? `Pay ${methodPriceLabel}` : `Pay with ${selectedLabel}`;
    }
    return 'Confirm';
  }, [state, hasInstructions, selectedMethodPriceLabel, selectedMethodInfo?.label, selectedLabel, isPaypalSelected, isThroneSelected]);

  const primaryButtonContent = useMemo(() => {
    if (!isBrandPayButton || !payButtonLabel.toLowerCase().startsWith('pay')) {
      return payButtonLabel;
    }
    return (
      <>
        <img
          src={isPaypalSelected ? '/paypal-logo.png' : '/throne-logo.png'}
          alt=""
          aria-hidden="true"
          className={`payment-sheet__primary-logo${isThroneSelected ? ' payment-sheet__primary-logo--throne' : ''}`}
        />
        <span>{payButtonLabel}</span>
      </>
    );
  }, [isBrandPayButton, isPaypalSelected, isThroneSelected, payButtonLabel]);
  const isWhitePayButton = isBrandPayButton && payButtonLabel.toLowerCase().startsWith('pay');

  const handleCopyTributeCode = useCallback(async () => {
    if (!selectedTributeCode) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(selectedTributeCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = selectedTributeCode;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedTributeCode(true);
    } catch {
      // ignore copy failures
    }
  }, [selectedTributeCode]);

  useEffect(() => {
    if (!copiedTributeCode) return undefined;
    const timer = window.setTimeout(() => setCopiedTributeCode(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copiedTributeCode, selectedTributeCode]);

  useEffect(() => {
    if (state !== 'waiting' || !waitingStartedAt) {
      setWaitingRemainingSeconds(WAITING_TIMEOUT_MS / 1000);
      return undefined;
    }

    const updateRemaining = () => {
      const elapsed = Date.now() - waitingStartedAt;
      const remaining = Math.max(0, Math.ceil((WAITING_TIMEOUT_MS - elapsed) / 1000));
      setWaitingRemainingSeconds(remaining);
    };

    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [state, waitingStartedAt]);

  const clearTimedOutCheckout = useCallback(() => {
    setInvoiceId('');
    setPaymentUrl('');
    setSavedPaymentCode('');
    setWaitingStartedAt(null);
    saveProgress({ orderId, selectedMethod, paymentCode: '', waitingStartedAt: null });
  }, [orderId, saveProgress, selectedMethod]);

  const waitingCountdownLabel = useMemo(() => {
    const minutes = Math.floor(waitingRemainingSeconds / 60);
    const seconds = waitingRemainingSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [waitingRemainingSeconds]);

  const renderInstructionText = useCallback((text: string) => {
    const lines = text.split(/\r?\n/);
    return lines.map((line, index) => (
      <span key={`${index}:${line}`} className="payment-sheet__instruction-line">
        {line}
      </span>
    ));
  }, []);

  const paymentNotes = showPaymentDetails && (selectedInstructions || selectedTributeCode) ? (
    <div className="payment-sheet__note" role="note">
      {selectedInstructions ? (
        <div className="payment-sheet__note-block">
          <div className="payment-sheet__note-label">Payment instructions</div>
          <div className="payment-sheet__note-text">{renderInstructionText(selectedInstructions)}</div>
        </div>
      ) : null}
      {selectedTributeCode ? (
        <div className="payment-sheet__note-block">
          <div className="payment-sheet__note-label">Tribute code</div>
          <button
            type="button"
            className="payment-sheet__note-code"
            onClick={handleCopyTributeCode}
            title="Tap to copy tribute code"
            aria-label="Copy tribute code"
          >
            {copiedTributeCode ? 'COPIED' : selectedTributeCode}
          </button>
        </div>
      ) : null}
    </div>
  ) : null;

  const primaryButtonDisabled = state === 'loading' || state === 'submitting' || !selectedMethod;

  const retryButtonDisabled = !selectedMethod;

  useEffect(() => {
    if (state !== 'waiting' || !invoiceId) return undefined;
    const startedAt = Date.now();
    let timer: number | undefined;

    const poll = async () => {
      try {
        const res = await pollInvoice(invoiceId);
        if (res.status === 'paid') {
          setSuccessResult(res);
          setState('success');
          onSuccess?.(res);
          return;
        }
        if (res.status === 'cancelled') {
          setError('Payment was cancelled.');
          setState('error');
          return;
        }
      } catch (err) {
        // keep polling on transient errors
      }
      const elapsed = Date.now() - startedAt;
      if (elapsed > 5 * 60 * 1000) {
        try {
          await cancelInvoice(invoiceId);
        } catch {
          // best-effort cancellation; still surface the timeout
        }
        clearTimedOutCheckout();
        setError('Timed out waiting for payment.');
        setState('error');
        return;
      }
      const interval = elapsed < 60_000 ? 3000 : 7000;
      timer = window.setTimeout(poll, interval);
    };

    timer = window.setTimeout(poll, 500);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [clearTimedOutCheckout, invoiceId, onSuccess, state]);

  const handleCheckout = useCallback(async (options?: { freshCheckout?: boolean }) => {
    if (!selectedMethod) return;
    const freshCheckout = Boolean(options?.freshCheckout);
    setState('submitting');
    setError('');
    try {
      let effectiveOrderId = orderId;
      let effectivePaymentCode = selectedTributeCode;
      if (freshCheckout) {
        clearTimedOutCheckout();
        effectivePaymentCode = '';
      }
      const waitingStartedAt = Date.now();
      const res = await startCheckout(productId, selectedMethod, quantity, mode, {
        ...itemContext,
        currency,
        ...(effectivePaymentCode ? { paymentCode: effectivePaymentCode } : {}),
        ...(effectiveOrderId ? { orderId: effectiveOrderId } : {}),
      });
      setOrderId(res.orderId);
      setInvoiceId(res.invoiceId);
      setSavedPaymentCode(res.paymentCode || '');
      setWaitingStartedAt(waitingStartedAt);
      const url = res.paymentUrl || res.providerInvoiceUrl || '';
      setPaymentUrl(url);
      saveProgress({
        invoiceId: res.invoiceId,
        paymentUrl: url,
        paymentCode: res.paymentCode || '',
        selectedMethod,
        orderId: res.orderId,
        waitingStartedAt,
      });
      openPaymentUrl(url);
      setState('waiting');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Unable to start checkout. Try again or pay in bot.');
      setState('error');
    }
  }, [clearTimedOutCheckout, itemContext, mode, orderId, productId, quantity, saveProgress, selectedMethod, selectedTributeCode]);

  const handlePrimaryClick = useCallback(() => {
    if (state === 'select') {
      setState(hasInstructions ? 'confirm' : 'submitting');
      if (!hasInstructions) void handleCheckout();
      return;
    }
    void handleCheckout();
  }, [state, hasInstructions, handleCheckout]);

  const paymentButton = (
    <button
      type="button"
      className={`payment-sheet__primary${isWhitePayButton ? ' payment-sheet__primary--white' : ''}`}
      onClick={handlePrimaryClick}
      disabled={primaryButtonDisabled}
    >
      <span className="payment-sheet__primary-content">{primaryButtonContent}</span>
    </button>
  );

  const handleChangeMethod = useCallback(() => {
    if (state === 'waiting' && invoiceId) {
      void cancelInvoice(invoiceId).catch(() => {
        // best-effort cancellation; proceed to selection either way
      });
    }
    setInvoiceId('');
    setPaymentUrl('');
    setSavedPaymentCode('');
    setWaitingStartedAt(null);
    setState('select');
    setError('');
    saveProgress({ orderId, selectedMethod, paymentCode: '', waitingStartedAt: null });
  }, [invoiceId, orderId, saveProgress, selectedMethod, state]);

  useEffect(() => {
    if (state === 'success') {
      setOrderId(null);
      clearProgress();
    }
  }, [state, clearProgress]);

  useEffect(() => {
    if (state !== 'success') {
      setSuccessResult(null);
    }
  }, [state]);

  const showRetry = state === 'error' && showBotFallbackActions;

  return (
    <div className="payment-sheet__backdrop">
      <div className="payment-sheet">
        <div className="payment-sheet__header">
          <h3>Complete Payment</h3>
          <button type="button" className="payment-sheet__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {isInitialLoading ? (
          <div className="payment-sheet__body payment-sheet__body--shimmer">
            <div className="payment-sheet__spinner">
              <div className="payment-sheet__shimmer-dot" />
              <span>Loading payment methods…</span>
            </div>
            <div className="payment-sheet__shimmer">
              <div className="payment-sheet__shimmer-line wide" />
              <div className="payment-sheet__shimmer-line" />
              <div className="payment-sheet__shimmer-line short" />
            </div>
            <div className="payment-sheet__shimmer-cards">
              <div className="payment-sheet__shimmer-card" />
              <div className="payment-sheet__shimmer-card" />
            </div>
            <div className="payment-sheet__shimmer-button" />
          </div>
        ) : null}

        {state === 'select' ? (
          <div className="payment-sheet__body">
            <p>Select a payment method to open checkout in your browser.</p>
            <div className="payment-sheet__methods">
              {methods.map((method) => (
                <label
                  key={`${method.paymentMethod}-${method.id ?? 'default'}`}
                  className={`payment-sheet__method${selectedMethod === method.paymentMethod ? ' is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.paymentMethod}
                    checked={selectedMethod === method.paymentMethod}
                    onChange={() => {
                      setSelectedMethod(method.paymentMethod);
                      setSavedPaymentCode('');
                    }}
                  />
                  <span>
                    {(() => {
                      const methodPriceLabel = resolvePriceLabelOptional({
                        currency,
                        pricings: [method.pricing],
                      });
                      return methodPriceLabel ? `${method.label} · ${methodPriceLabel}` : method.label;
                    })()}
                  </span>
                </label>
              ))}
            </div>
            {paymentNotes}
            {paymentButton}
            {showBotFallbackActions ? (
              <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackLink)}>
                Pay in bot instead
              </button>
            ) : null}
          </div>
        ) : null}

        {state === 'confirm' ? (
          <div className="payment-sheet__body">
            {paymentNotes}
            <div className="payment-sheet__actions payment-sheet__actions--confirm">
              <button
                type="button"
                className={`payment-sheet__primary${isWhitePayButton ? ' payment-sheet__primary--white' : ''}`}
                onClick={() => void handleCheckout()}
                disabled={primaryButtonDisabled}
              >
                <span className="payment-sheet__primary-content">{primaryButtonContent}</span>
              </button>
              <button type="button" className="payment-sheet__ghost" onClick={() => setState('select')}>
                Choose a different method
              </button>
            </div>
          </div>
        ) : null}

        {isSubmittingCheckout ? (
          <div className="payment-sheet__body payment-sheet__body--center">
            <div className="payment-sheet__spinner payment-sheet__spinner--center">
              <div className="payment-sheet__spinner-wheel" aria-hidden />
              <span>Checking out…</span>
            </div>
            <p className="payment-sheet__muted-text">{checkoutMessage}</p>
          </div>
        ) : null}

        {state === 'waiting' ? (
          <div className="payment-sheet__body payment-sheet__body--center">
            <div className="payment-sheet__spinner payment-sheet__spinner--center">
              <div className="payment-sheet__spinner-wheel" aria-hidden />
              <span>Waiting for payment…</span>
              <span className="payment-sheet__spinner-countdown" aria-label={`Time remaining ${waitingCountdownLabel}`}>
                {waitingCountdownLabel}
              </span>
            </div>
            <p className="payment-sheet__muted-text">Checkout opened in your browser. Complete payment and we’ll update here.</p>
            <div className="payment-sheet__actions payment-sheet__actions--inline">
              {paymentUrl ? (
                <button
                  type="button"
                  className="payment-sheet__primary payment-sheet__primary--compact"
                  onClick={() => openPaymentUrl(paymentUrl)}
                >
                  Open again
                </button>
              ) : null}
              <button
                type="button"
                className="payment-sheet__ghost payment-sheet__ghost--compact"
                onClick={handleChangeMethod}
              >
                Change method
              </button>
              {paymentNotes}
              {showBotFallbackActions ? (
                <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackLink)}>
                  Pay in bot instead
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {state === 'success' ? (
          <div className="payment-sheet__body">
            {resolvedDeliveryMode === 'stream' ? (
              <>
                <div className="payment-sheet__success">Stream Ready</div>
                <p>You can now watch the stream below. I’ve also sent the link to you in DM so you can watch later.</p>
                {successResult?.deliveryUrl ? (
                  <button
                    type="button"
                    className="payment-sheet__primary"
                    onClick={() => openPaymentUrl(successResult.deliveryUrl || undefined)}
                  >
                    🎬 Stream Now
                  </button>
                ) : null}
              </>
            ) : resolvedDeliveryMode === 'download' ? (
              <>
                <div className="payment-sheet__success">Download Ready</div>
                <p>You can now download the clip below. I’ve also sent the link to you in DM so you can download later.</p>
                {successResult?.deliveryUrl ? (
                  <button
                    type="button"
                    className="payment-sheet__primary"
                    onClick={() => openPaymentUrl(successResult.deliveryUrl || undefined)}
                  >
                    📥 Download Now
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <div className="payment-sheet__success">Payment received!</div>
                <p>You can close this window. If needed, continue in the bot.</p>
                <button type="button" className="payment-sheet__primary" onClick={onClose}>
                  Close
                </button>
                {showBotFallbackActions ? (
                  <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackLink)}>
                    Open bot
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {state === 'error' ? (
          <div className="payment-sheet__body">
            <div className="payment-sheet__error">{error || 'Payment unavailable right now.'}</div>
            <button
              type="button"
              className="payment-sheet__primary"
              onClick={() => void handleCheckout({ freshCheckout: true })}
              disabled={retryButtonDisabled}
            >
              Retry checkout
            </button>
            {showRetry ? (
              <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackUrl!)}>
                Pay in bot instead
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
