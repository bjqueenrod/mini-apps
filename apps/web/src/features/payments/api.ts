import {
  CheckoutOptionsResponse,
  CheckoutResponse,
  InvoiceStatusResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const checkoutOptionsRequests = new Map<string, Promise<CheckoutOptionsResponse>>();

function looksLikeHtmlError(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.includes('cloudflare');
}

async function readFriendlyErrorMessage(response: Response, fallback: string): Promise<string> {
  if (response.status >= 500) {
    return fallback;
  }
  try {
    const text = await response.text();
    if (!text) {
      return fallback;
    }
    if (looksLikeHtmlError(text)) {
      return fallback;
    }
    try {
      const data = JSON.parse(text);
      const detail = data?.detail || data?.error;
      return detail ? `${fallback}: ${detail}` : `${fallback}: ${text}`;
    } catch {
      return `${fallback}: ${text}`;
    }
  } catch {
    return fallback;
  }
}

function buildCheckoutOptionsRequestKey(
  productId: string,
  quantity: number,
  mode?: string,
  extras?: Record<string, unknown>,
) {
  return JSON.stringify({
    productId,
    quantity,
    mode: mode || '',
    extras: extras || {},
  });
}

export async function fetchCheckoutOptions(
  productId: string,
  quantity = 1,
  mode?: string,
  extras?: Record<string, unknown>,
): Promise<CheckoutOptionsResponse> {
  const requestKey = buildCheckoutOptionsRequestKey(productId, quantity, mode, extras);
  const existingRequest = checkoutOptionsRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const response = await fetch(`${API_BASE}/payments/checkout-options`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, mode, ...extras }),
    });
    if (!response.ok) {
      throw new Error(await readFriendlyErrorMessage(response, 'Unable to load payment options'));
    }
    return response.json() as Promise<CheckoutOptionsResponse>;
  })();

  checkoutOptionsRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    checkoutOptionsRequests.delete(requestKey);
  }
}

export async function startCheckout(
  productId: string,
  paymentMethod: string,
  quantity = 1,
  mode?: string,
  extras?: Record<string, unknown>,
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE}/payments/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, paymentMethod, quantity, mode, ...extras }),
  });
  if (!response.ok) {
    throw new Error(await readFriendlyErrorMessage(response, 'Unable to start checkout. Try again or pay in bot.'));
  }
  return response.json();
}

export async function pollInvoice(invoiceId: string): Promise<InvoiceStatusResponse> {
  const response = await fetch(`${API_BASE}/payments/invoices/${encodeURIComponent(invoiceId)}?_=${Date.now()}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Unable to check payment status');
  return response.json();
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/payments/invoices/${encodeURIComponent(invoiceId)}/cancel`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(await readFriendlyErrorMessage(response, 'Unable to cancel payment'));
  }
}
