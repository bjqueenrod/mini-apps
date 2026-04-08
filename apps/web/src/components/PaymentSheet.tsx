import { useCallback, useEffect, useMemo, useState } from 'react';
import { pollInvoice, fetchCheckoutOptions, startCheckout } from '../features/payments/api';
import { PaymentMethod } from '../features/payments/types';
import { formatPrice } from '../utils/format';
import { openBotDeepLink } from '../app/telegram';

type SheetState = 'loading' | 'select' | 'submitting' | 'waiting' | 'success' | 'error';

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
  const storageKey = useMemo(
    () => `paymentSheet:${productId}:${mode || 'default'}`,
    [productId, mode],
  );

  const saveProgress = useCallback(
    (payload: { invoiceId: string; paymentUrl?: string; selectedMethod?: string }) => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            invoiceId: payload.invoiceId,
            paymentUrl: payload.paymentUrl || '',
            selectedMethod: payload.selectedMethod || '',
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
      const parsed = JSON.parse(raw) as { invoiceId?: string; paymentUrl?: string; selectedMethod?: string };
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
  const isLoading = state === 'loading' || state === 'submitting';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCheckoutOptions(productId, quantity, mode, itemContext);
        if (cancelled) return;
        setMethods(data.paymentMethods || []);
        if (!selectedMethod) {
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
  }, [productId, quantity, mode, itemContext, selectedMethod]);

  const selectedLabel = useMemo(
    () => selectedMethodInfo?.label || 'Pay',
    [selectedMethodInfo],
  );

  const selectedPriceLabel = useMemo(() => {
    if (selectedMethodInfo) {
      const details = (selectedMethodInfo.details || {}) as Record<string, unknown>;
      const cents =
        selectedMethodInfo.priceCents ??
        (typeof details.fansly_price_usd_cents === 'number' ? (details.fansly_price_usd_cents as number) : undefined) ??
        (typeof details.price_cents === 'number' ? (details.price_cents as number) : undefined);
      if (cents != null) {
        return formatPrice(cents / 100);
      }
    }
    return priceLabel;
  }, [selectedMethodInfo, priceLabel]);

  const payButtonLabel = useMemo(() => {
    if (selectedPriceLabel) {
      return `Pay ${selectedPriceLabel}`;
    }
    return `Pay with ${selectedLabel}`;
  }, [selectedPriceLabel, selectedLabel]);

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
      const res = await startCheckout(productId, selectedMethod, quantity, mode, itemContext);
      setInvoiceId(res.invoiceId);
      const url = res.paymentUrl || res.providerInvoiceUrl || '';
      setPaymentUrl(url);
      saveProgress({ invoiceId: res.invoiceId, paymentUrl: url, selectedMethod });
      openPaymentUrl(url);
      setState('waiting');
    } catch (err) {
      setError('Unable to start checkout. Try again or pay in bot.');
      setState('error');
    }
  }, [itemContext, mode, productId, quantity, selectedMethod, saveProgress]);

  const paymentButton = (
    <button type="button" className="payment-sheet__primary" onClick={handleCheckout} disabled={primaryButtonDisabled}>
      {payButtonLabel}
    </button>
  );

  const handleChangeMethod = useCallback(() => {
    clearProgress();
    setInvoiceId('');
    setPaymentUrl('');
    setState('select');
    setError('');
  }, [clearProgress]);

  useEffect(() => {
    if (state === 'success' || state === 'error') {
      clearProgress();
    }
  }, [state, clearProgress]);

  const showRetry = state === 'error' && !!botFallbackUrl;

  return (
    <div className="payment-sheet__backdrop">
      <div className="payment-sheet">
        <div className="payment-sheet__header">
          <h3>Complete Payment</h3>
          <button type="button" className="payment-sheet__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {isLoading ? (
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
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
            {paymentButton}
            {botFallbackUrl ? (
              <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackUrl)}>
                Pay in bot instead
              </button>
            ) : null}
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
              {botFallbackUrl ? (
                <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackUrl)}>
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
            {botFallbackUrl ? (
              <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackUrl)}>
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
