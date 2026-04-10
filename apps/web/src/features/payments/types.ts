export type PaymentMethod = {
  id?: number;
  paymentMethod: string;
  label: string;
  requiresCode?: boolean;
  pricePence?: number;
  instructions?: string | null;
  tributeCode?: string | null;
  details?: Record<string, unknown> | null;
};

export type CheckoutOptionsResponse = {
  flowId?: string | null;
  paymentMethods: PaymentMethod[];
  totals?: Record<string, unknown> | null;
};

export type CheckoutResponse = {
  orderId: number;
  invoiceId: string;
  paymentUrl?: string | null;
  providerInvoiceUrl?: string | null;
  paymentMethod: string;
  paymentCode?: string | null;
  instructions?: string | null;
  totals?: Record<string, unknown> | null;
};

export type InvoiceStatusResponse = {
  invoiceId: string;
  status: 'pending' | 'paid' | 'cancelled';
  paymentUrl?: string | null;
  providerInvoiceUrl?: string | null;
};
