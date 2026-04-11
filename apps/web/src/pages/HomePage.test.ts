import { describe, expect, it } from 'vitest';
import { resolveHomeRedirectTarget } from './HomePage';

describe('resolveHomeRedirectTarget', () => {
  it('preserves query params when redirecting to a Telegram mini app route', () => {
    expect(resolveHomeRedirectTarget('?startapp=keyholding&currency=USD')).toBe('/keyholding?currency=USD');
  });

  it('uses the Telegram start param when present', () => {
    expect(resolveHomeRedirectTarget('', 'tasks')).toBe('/tasks');
  });

  it('strips tracking suffix from clips start params and opens clip detail', () => {
    expect(resolveHomeRedirectTarget('?currency=USD', 'clips_BJQ0169__l_e')).toBe('/clips/BJQ0169?currency=USD');
  });
});
