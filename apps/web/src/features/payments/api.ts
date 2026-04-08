import {
  CheckoutOptionsResponse,
  CheckoutResponse,
  InvoiceStatusResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function fetchCheckoutOptions(productId: string, quantity = 1, mode?: string): Promise<CheckoutOptionsResponse> {
  const response = await fetch(`${API_BASE}/payments/checkout-options`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, mode }),
  });
  if (!response.ok) throw new Error('Unable to load payment options');
  return response.json();
}

export async function startCheckout(
  productId: string,
  paymentMethod: string,
  quantity = 1,
  mode?: string,
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE}/payments/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, paymentMethod, quantity, mode }),
  });
  if (!response.ok) throw new Error('Unable to start checkout');
  return response.json();
}

export async function pollInvoice(invoiceId: string): Promise<InvoiceStatusResponse> {
  const response = await fetch(`${API_BASE}/payments/invoices/${encodeURIComponent(invoiceId)}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Unable to check payment status');
  return response.json();
}

