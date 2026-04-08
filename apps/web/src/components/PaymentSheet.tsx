import { useEffect, useMemo, useState } from 'react';
import { pollInvoice, fetchCheckoutOptions, startCheckout } from '../features/payments/api';
import { PaymentMethod } from '../features/payments/types';
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
}: {
  productId: string;
  quantity?: number;
  mode?: string;
  priceLabel?: string;
  botFallbackUrl?: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [state, setState] = useState<SheetState>('loading');
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [paymentUrl, setPaymentUrl] = useState<string | undefined>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCheckoutOptions(productId, quantity, mode);
        if (cancelled) return;
        setMethods(data.paymentMethods || []);
        setSelectedMethod((data.paymentMethods || [])[0]?.paymentMethod || '');
        setState('select');
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
  }, [productId, quantity, mode]);

  const selectedLabel = useMemo(
    () => methods.find((m) => m.paymentMethod === selectedMethod)?.label || 'Pay',
    [methods, selectedMethod],
  );

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

  const handleCheckout = async () => {
    if (!selectedMethod) return;
    setState('submitting');
    setError('');
    try {
      const res = await startCheckout(productId, selectedMethod, quantity, mode);
      setInvoiceId(res.invoiceId);
      setPaymentUrl(res.paymentUrl || res.providerInvoiceUrl || '');
      openPaymentUrl(res.paymentUrl || res.providerInvoiceUrl || '');
      setState('waiting');
    } catch (err) {
      setError('Unable to start checkout. Try again or pay in bot.');
      setState('error');
    }
  };

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

        {state === 'loading' || state === 'submitting' ? <div className="payment-sheet__spinner">Loading payment methods…</div> : null}

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
            <button type="button" className="payment-sheet__primary" onClick={handleCheckout} disabled={!selectedMethod}>
              {`Pay ${priceLabel || ''}`.trim() || `Pay with ${selectedLabel}`}
            </button>
            {botFallbackUrl ? (
              <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackUrl)}>
                Pay in bot instead
              </button>
            ) : null}
          </div>
        ) : null}

        {state === 'waiting' ? (
          <div className="payment-sheet__body">
            <div className="payment-sheet__spinner">Waiting for payment…</div>
            <p>Checkout opened in your browser. Complete payment and we’ll update here.</p>
            {paymentUrl ? (
              <button type="button" className="payment-sheet__primary" onClick={() => openPaymentUrl(paymentUrl)}>
                Open payment link again
              </button>
            ) : null}
            {botFallbackUrl ? (
              <button type="button" className="payment-sheet__ghost" onClick={() => openBotDeepLink(botFallbackUrl)}>
                Pay in bot instead
              </button>
            ) : null}
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
            <button type="button" className="payment-sheet__primary" onClick={handleCheckout} disabled={!selectedMethod}>
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
