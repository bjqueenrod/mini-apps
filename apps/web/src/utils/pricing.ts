import { CurrencyCode, formatPrice } from './format';

export type PricingMoney = {
  amount_pence?: number | null;
  amountPence?: number | null;
  formatted?: string | null;
};

export type PricingFx = {
  rate?: number | null;
  fetched_at?: string | null;
  fetchedAt?: string | null;
};

export type PricingEnvelope = {
  gbp?: PricingMoney | null;
  usd?: PricingMoney | null;
  fx?: PricingFx | null;
};

type ResolvePriceLabelOptions = {
  currency?: CurrencyCode;
  pricings?: Array<PricingEnvelope | null | undefined>;
  fallbackAmountPence?: unknown;
  fallbackAmountPenceCandidates?: unknown[];
  fallbackAmount?: unknown;
  fallbackAmountCandidates?: unknown[];
  fallbackLabel?: unknown;
  fallbackLabelCandidates?: unknown[];
  defaultLabel?: string;
};

function pricingKey(currency: CurrencyCode): 'gbp' | 'usd' {
  return currency === 'USD' ? 'usd' : 'gbp';
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value;
}

function asPence(value: unknown): number | undefined {
  const amount = asNumber(value);
  if (amount == null) return undefined;
  return Math.round(amount);
}

function pricingFxRate(pricing: PricingEnvelope | null | undefined): number | undefined {
  const fx = pricing?.fx;
  if (!fx || typeof fx !== 'object') return undefined;
  const rate = asNumber(fx.rate);
  if (rate == null || rate <= 0) return undefined;
  return rate;
}

function pricingFormatted(
  pricing: PricingEnvelope | null | undefined,
  currency: CurrencyCode,
): string | undefined {
  const bucket = pricing?.[pricingKey(currency)];
  if (!bucket || typeof bucket !== 'object') return undefined;
  return asText(bucket.formatted);
}

function pricingAmountPence(
  pricing: PricingEnvelope | null | undefined,
  currency: CurrencyCode,
): number | undefined {
  const bucket = pricing?.[pricingKey(currency)];
  if (!bucket || typeof bucket !== 'object') return undefined;
  return asPence(bucket.amount_pence ?? bucket.amountPence);
}

function derivedPricingAmountPence(
  pricing: PricingEnvelope | null | undefined,
  currency: CurrencyCode,
): number | undefined {
  const directAmount = pricingAmountPence(pricing, currency);
  if (directAmount != null) return directAmount;

  const rate = pricingFxRate(pricing);
  if (rate == null) return undefined;

  const gbpAmount = pricingAmountPence(pricing, 'GBP');
  if (currency === 'USD' && gbpAmount != null) {
    return Math.round(gbpAmount * rate);
  }

  const usdAmount = pricingAmountPence(pricing, 'USD');
  if (currency === 'GBP' && usdAmount != null) {
    return Math.round(usdAmount / rate);
  }

  return undefined;
}

function firstFormatted(
  pricings: Array<PricingEnvelope | null | undefined> | undefined,
  currency: CurrencyCode,
): string | undefined {
  for (const pricing of pricings || []) {
    const value = pricingFormatted(pricing, currency);
    if (value) return value;
  }
  return undefined;
}

function firstPricingPence(
  pricings: Array<PricingEnvelope | null | undefined> | undefined,
  currency: CurrencyCode,
): number | undefined {
  for (const pricing of pricings || []) {
    const value = derivedPricingAmountPence(pricing, currency);
    if (value != null) return value;
  }
  return undefined;
}

function firstText(values: unknown[]): string | undefined {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return undefined;
}

function firstPence(values: unknown[]): number | undefined {
  for (const value of values) {
    const amount = asPence(value);
    if (amount != null) return amount;
  }
  return undefined;
}

function firstAmount(values: unknown[]): number | undefined {
  for (const value of values) {
    const amount = asNumber(value);
    if (amount != null) return amount;
  }
  return undefined;
}

export function resolvePriceLabel(options: ResolvePriceLabelOptions): string {
  const currency = options.currency || 'GBP';

  const formatted = firstFormatted(options.pricings, currency);
  if (formatted) return formatted;

  const pricingPence = firstPricingPence(options.pricings, currency);
  if (pricingPence != null) return formatPrice(pricingPence / 100, currency);

  const fallbackPence = firstPence([
    options.fallbackAmountPence,
    ...(options.fallbackAmountPenceCandidates || []),
  ]);
  if (fallbackPence != null) return formatPrice(fallbackPence / 100, currency);

  const fallbackAmount = firstAmount([options.fallbackAmount, ...(options.fallbackAmountCandidates || [])]);
  if (fallbackAmount != null) return formatPrice(fallbackAmount, currency);

  const fallbackLabel = firstText([options.fallbackLabel, ...(options.fallbackLabelCandidates || [])]);
  if (fallbackLabel) return fallbackLabel;

  return options.defaultLabel !== undefined ? options.defaultLabel : 'Price on request';
}

export function resolvePriceLabelOptional(options: ResolvePriceLabelOptions): string | undefined {
  const label = resolvePriceLabel({ ...options, defaultLabel: '' });
  return label || undefined;
}

type ResolvePriceAmountPenceOptions = {
  currency?: CurrencyCode;
  pricings?: Array<PricingEnvelope | null | undefined>;
};

export function resolvePriceAmountPenceOptional(options: ResolvePriceAmountPenceOptions): number | undefined {
  const currency = options.currency || 'GBP';
  return firstPricingPence(options.pricings, currency);
}
