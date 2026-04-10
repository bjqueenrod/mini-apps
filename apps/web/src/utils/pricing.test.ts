import { describe, expect, it } from 'vitest';
import { resolvePriceAmountPenceOptional, resolvePriceLabel, resolvePriceLabelOptional } from './pricing';

describe('resolvePriceLabel', () => {
  it('prefers formatted pricing for selected currency', () => {
    const label = resolvePriceLabel({
      currency: 'USD',
      pricings: [
        {
          usd: { formatted: '$24.50', amount_pence: 2450 },
          gbp: { formatted: '£19.00', amount_pence: 1900 },
        },
      ],
    });
    expect(label).toBe('$24.50');
  });

  it('uses pricing amount_pence when formatted is missing', () => {
    const label = resolvePriceLabel({
      currency: 'GBP',
      pricings: [{ gbp: { amount_pence: 1299 } }],
    });
    expect(label).toBe('£12.99');
  });

  it('derives usd pricing from gbp amount and fx rate when usd is missing', () => {
    const label = resolvePriceLabel({
      currency: 'USD',
      pricings: [{ gbp: { amount_pence: 1299 }, fx: { rate: 1.25 } }],
    });
    expect(label).toBe('$16.24');
  });

  it('falls back to the provided numeric amount when pricing is absent', () => {
    const label = resolvePriceLabel({
      currency: 'USD',
      fallbackAmountPence: 1299,
    });
    expect(label).toBe('$12.99');
  });

  it('returns default label when pricing object is absent', () => {
    const label = resolvePriceLabel({
      currency: 'GBP',
      defaultLabel: 'Price on request',
    });
    expect(label).toBe('Price on request');
  });

  it('returns optional undefined when no values are present', () => {
    const label = resolvePriceLabelOptional({ currency: 'GBP' });
    expect(label).toBeUndefined();
  });

  it('resolves pricing amount pence for selected currency', () => {
    const amount = resolvePriceAmountPenceOptional({
      currency: 'USD',
      pricings: [{ usd: { amount_pence: 1525 }, gbp: { amount_pence: 1200 } }],
    });
    expect(amount).toBe(1525);
  });

  it('derives pricing amount pence for usd from gbp fx snapshot', () => {
    const amount = resolvePriceAmountPenceOptional({
      currency: 'USD',
      pricings: [{ gbp: { amount_pence: 1200 }, fx: { rate: 1.25 } }],
    });
    expect(amount).toBe(1500);
  });
});
