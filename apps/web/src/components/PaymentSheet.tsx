import { useCallback, useEffect, useMemo, useState } from 'react';
import { pollInvoice, fetchCheckoutOptions, startCheckout } from '../features/payments/api';
import { PaymentMethod } from '../features/payments/types';
import { resolvePriceLabelOptional } from '../utils/pricing';
import { isTelegramWebView, openBotDeepLink } from '../app/telegram';
import { useCurrencyPreference } from '../hooks/useCurrencyPreference';

type SheetState = 'loading' | 'select' | 'confirm' | 'submitting' | 'waiting' | 'success' | 'error';

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
  botFallbackUrl,
  onClose,
  onSuccess,
  itemContext,
}: {
  productId: string;
  quantity?: number;
  mode?: string;
  priceLabel?: string;
  botFallbackUrl?: string;
  onClose: () => void;
  onSuccess?: () => void;
  itemContext?: Record<string, unknown>;
}) {
  const [state, setState] = useState<SheetState>('loading');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string | undefined>('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [copiedTributeCode, setCopiedTributeCode] = useState(false);
  const [currency] = useCurrencyPreference();
  const storageKey = useMemo(
    () => `paymentSheet:${productId}:${mode || 'default'}`,
    [productId, mode],
  );

  const saveProgress = useCallback(
    (payload: { invoiceId?: string; paymentUrl?: string; selectedMethod?: string; orderId?: number | null }) => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            invoiceId: payload.invoiceId || '',
            paymentUrl: payload.paymentUrl || '',
            selectedMethod: payload.selectedMethod || '',
            orderId: payload.orderId ?? null,
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
      const parsed = JSON.parse(raw) as { invoiceId?: string; paymentUrl?: string; selectedMethod?: string; orderId?: number };
      if (parsed?.orderId) {
        setOrderId(parsed.orderId);
      }
      if (parsed?.invoiceId) {
        setInvoiceId(parsed.invoiceId);
        setPaymentUrl(parsed.paymentUrl || '');
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
  const selectedPriceLabel = useMemo(() => {
    if (selectedMethodInfo) {
      const methodPriceLabel = resolvePriceLabelOptional({
        currency,
        pricings: [selectedMethodInfo.pricing],
      });
      if (methodPriceLabel) return methodPriceLabel;
    }
    return priceLabel;
  }, [selectedMethodInfo, priceLabel, currency]);
  const selectedInstructionsTemplate =
    selectedMethodInfo?.instruction_templates?.checkout_default?.trim() ||
    selectedMethodInfo?.instructionTemplates?.checkoutDefault?.trim() ||
    selectedMethodInfo?.instructions?.trim();
  const selectedInstructions =
    selectedInstructionsTemplate?.replace(/\{price\}/g, () => selectedPriceLabel || '') || undefined;
  const selectedTributeCode = selectedMethodInfo?.tributeCode?.trim();
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

  const payButtonLabel = useMemo(() => {
    if (state === 'confirm') {
      return selectedPriceLabel ? `Pay ${selectedPriceLabel}` : `Pay with ${selectedLabel}`;
    }
    if (state === 'select') {
      if (hasInstructions) return 'Confirm';
      return selectedPriceLabel ? `Pay ${selectedPriceLabel}` : `Pay with ${selectedLabel}`;
    }
    return 'Confirm';
  }, [state, hasInstructions, selectedPriceLabel, selectedLabel]);

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
          setState('success');
          onSuccess?.();
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
  }, [state, invoiceId, onSuccess]);

  const handleCheckout = useCallback(async () => {
    if (!selectedMethod) return;
    setState('submitting');
    setError('');
    try {
      const res = await startCheckout(productId, selectedMethod, quantity, mode, {
        ...itemContext,
        ...(orderId ? { orderId } : {}),
      });
      setOrderId(res.orderId);
      setInvoiceId(res.invoiceId);
      const url = res.paymentUrl || res.providerInvoiceUrl || '';
      setPaymentUrl(url);
      saveProgress({ invoiceId: res.invoiceId, paymentUrl: url, selectedMethod, orderId: res.orderId });
      openPaymentUrl(url);
      setState('waiting');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Unable to start checkout. Try again or pay in bot.');
      setState('error');
    }
  }, [itemContext, mode, orderId, productId, quantity, selectedMethod, saveProgress]);

  const handlePrimaryClick = useCallback(() => {
    if (state === 'select') {
      setState(hasInstructions ? 'confirm' : 'submitting');
      if (!hasInstructions) void handleCheckout();
      return;
    }
    void handleCheckout();
  }, [state, hasInstructions, handleCheckout]);

  const paymentButton = (
    <button type="button" className="payment-sheet__primary" onClick={handlePrimaryClick} disabled={primaryButtonDisabled}>
      {payButtonLabel}
    </button>
  );

  const handleChangeMethod = useCallback(() => {
    setInvoiceId('');
    setPaymentUrl('');
    setState('select');
    setError('');
    saveProgress({ orderId, selectedMethod });
  }, [orderId, saveProgress]);

  useEffect(() => {
    if (state === 'success' || state === 'error') {
      setOrderId(null);
      clearProgress();
    }
  }, [state, clearProgress]);

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
                <label key={`${method.paymentMethod}-${method.id ?? 'default'}`} className="payment-sheet__method">
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.paymentMethod}
                    checked={selectedMethod === method.paymentMethod}
                    onChange={() => setSelectedMethod(method.paymentMethod)}
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
              <button type="button" className="payment-sheet__primary" onClick={handleCheckout} disabled={primaryButtonDisabled}>
                {payButtonLabel}
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
            <p className="payment-sheet__muted-text">Opening your payment link now.</p>
          </div>
        ) : null}

        {state === 'waiting' ? (
          <div className="payment-sheet__body payment-sheet__body--center">
            <div className="payment-sheet__spinner payment-sheet__spinner--center">
              <div className="payment-sheet__spinner-wheel" aria-hidden />
              <span>Waiting for payment…</span>
            </div>
            <p className="payment-sheet__muted-text">Checkout opened in your browser. Complete payment and we’ll update here.</p>
            <div className="payment-sheet__actions">
              {paymentUrl ? (
                <button type="button" className="payment-sheet__primary" onClick={() => openPaymentUrl(paymentUrl)}>
                  Open payment link again
                </button>
              ) : null}
              <button type="button" className="payment-sheet__ghost" onClick={handleChangeMethod}>
                Choose a different method
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
          </div>
        ) : null}

        {state === 'error' ? (
          <div className="payment-sheet__body">
            <div className="payment-sheet__error">{error || 'Payment unavailable right now.'}</div>
            <button type="button" className="payment-sheet__primary" onClick={handleCheckout} disabled={retryButtonDisabled}>
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
