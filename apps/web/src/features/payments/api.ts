import {
  CheckoutOptionsResponse,
  CheckoutResponse,
  InvoiceStatusResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const checkoutOptionsRequests = new Map<string, Promise<CheckoutOptionsResponse>>();

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
      let message = 'Unable to load payment options';
      try {
        const text = await response.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (data?.detail) {
              message = `${message}: ${data.detail}`;
            } else {
              message = `${message}: ${text}`;
            }
          } catch {
            message = `${message}: ${text}`;
          }
        }
      } catch {
        // fall back to the generic message
      }
      throw new Error(message);
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
    let message = 'Unable to start checkout';
    try {
      const text = await response.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          const detail = data?.detail || data?.error;
          if (detail) {
            message = `${message}: ${detail}`;
          } else {
            message = `${message}: ${text}`;
          }
        } catch {
          message = `${message}: ${text}`;
        }
      }
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  return response.json();
}

export async function pollInvoice(invoiceId: string): Promise<InvoiceStatusResponse> {
  const response = await fetch(`${API_BASE}/payments/invoices/${encodeURIComponent(invoiceId)}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Unable to check payment status');
  return response.json();
}
