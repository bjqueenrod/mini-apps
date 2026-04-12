import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pollInvoice } from '../features/payments/api';
import type { InvoiceStatusResponse } from '../features/payments/types';
import { isTelegramWebView } from '../app/telegram';

const POLL_TIMEOUT_MS = 5 * 60 * 1000;

function goToDelivery(url: string) {
  window.location.assign(url);
}

export function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const invoiceId = (searchParams.get('invoice_id') || searchParams.get('invoiceId') || '').trim();
  const [status, setStatus] = useState<'loading' | 'pending' | 'paid' | 'cancelled' | 'missing' | 'error'>('loading');
  const [result, setResult] = useState<InvoiceStatusResponse | null>(null);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (!invoiceId) {
      setStatus('missing');
      return undefined;
    }

    let timer: number | undefined;
    const startedAt = Date.now();

    const schedule = (delay: number, fn: () => void) => {
      timer = window.setTimeout(fn, delay);
    };

    const poll = async () => {
      try {
        const res = await pollInvoice(invoiceId);
        if (res.status === 'paid') {
          setResult(res);
          setStatus('paid');
          return;
        }
        if (res.status === 'cancelled') {
          setStatus('cancelled');
          return;
        }
        setResult(res);
        setStatus('pending');
      } catch {
        setErrorText('Unable to verify payment status.');
        setStatus('error');
        return;
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed > POLL_TIMEOUT_MS) {
        setStatus('error');
        setErrorText('Still waiting for confirmation. If you paid, it may take a minute—try again or continue in the bot.');
        return;
      }

      const interval = elapsed < 60_000 ? 2500 : 6000;
      schedule(interval, poll);
    };

    schedule(400, poll);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [invoiceId]);

  const handleClose = () => {
    if (isTelegramWebView()) {
      try {
        window.Telegram?.WebApp?.close?.();
        return;
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="payment-sheet__backdrop">
      <div className="payment-sheet">
        <div className="payment-sheet__header">
          <h3>Payment</h3>
        </div>
        <div className="payment-sheet__body payment-sheet__body--center">
          {status === 'missing' ? (
            <>
              <p className="payment-sheet__muted-text">Missing payment reference.</p>
              <Link to="/clips" className="payment-sheet__primary">
                Back to clips
              </Link>
            </>
          ) : null}

          {status === 'loading' ? (
            <div className="payment-sheet__spinner payment-sheet__spinner--center">
              <div className="payment-sheet__spinner-wheel" aria-hidden />
              <span>Checking payment…</span>
            </div>
          ) : null}

          {status === 'pending' ? (
            <>
              <div className="payment-sheet__spinner payment-sheet__spinner--center">
                <div className="payment-sheet__spinner-wheel" aria-hidden />
                <span>Confirming payment…</span>
              </div>
              <p className="payment-sheet__muted-text">This usually takes a few seconds after you finish on NOWPayments.</p>
              {result?.paymentUrl || result?.providerInvoiceUrl ? (
                <button
                  type="button"
                  className="payment-sheet__ghost"
                  onClick={() => goToDelivery(result.paymentUrl || result.providerInvoiceUrl || '')}
                >
                  Open payment page again
                </button>
              ) : null}
            </>
          ) : null}

          {status === 'paid' && result ? (
            <>
              <div className="payment-sheet__success">Payment received</div>
              {result.deliveryMode === 'stream' && result.deliveryUrl ? (
                <button type="button" className="payment-sheet__primary payment-sheet__primary--delivery" onClick={() => goToDelivery(result.deliveryUrl!)}>
                  Stream now
                </button>
              ) : null}
              {result.deliveryMode === 'download' && result.deliveryUrl ? (
                <button type="button" className="payment-sheet__primary payment-sheet__primary--delivery" onClick={() => goToDelivery(result.deliveryUrl!)}>
                  Download now
                </button>
              ) : null}
              {!result.deliveryUrl ? (
                <p className="payment-sheet__muted-text">You can close this window or continue in the bot.</p>
              ) : null}
              <button type="button" className="payment-sheet__ghost" onClick={handleClose}>
                Close
              </button>
              <Link to="/clips" className="payment-sheet__ghost">
                Back to clips
              </Link>
            </>
          ) : null}

          {status === 'cancelled' ? (
            <>
              <p className="payment-sheet__error">This payment was cancelled.</p>
              <Link to="/clips" className="payment-sheet__primary">
                Back to clips
              </Link>
            </>
          ) : null}

          {status === 'error' ? (
            <>
              <p className="payment-sheet__error">{errorText || 'Something went wrong.'}</p>
              <Link to="/clips" className="payment-sheet__primary">
                Back to clips
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
