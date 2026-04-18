import { describe, expect, it } from 'vitest';
import { resolveHomeRedirectTarget } from './HomePage';

describe('resolveHomeRedirectTarget', () => {
  it('redirects from query startapp like a normal browser URL', () => {
    expect(resolveHomeRedirectTarget('?startapp=tasks', null)).toBe('/tasks');
    expect(resolveHomeRedirectTarget('?startapp=keyholding', null)).toBe('/keyholding');
  });

  it('redirects to clip route from query clipId', () => {
    expect(resolveHomeRedirectTarget('?startapp=clips&clipId=BJQ0001', null)).toBe('/clips/BJQ0001');
  });
});
