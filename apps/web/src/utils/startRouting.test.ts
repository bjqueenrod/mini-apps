import { describe, expect, it } from 'vitest';
import { resolveClipIdHint, resolveStartappHint, stripStartRoutingParams } from './startRouting';

describe('startRouting (browser-friendly query params)', () => {
  it('resolves startapp from search without Telegram start_param', () => {
    expect(resolveStartappHint('?startapp=clips', null)).toBe('clips');
    expect(resolveStartappHint('?startapp=tasks', undefined)).toBe('tasks');
    expect(resolveStartappHint('?startapp=keyholding', null)).toBe('keyholding');
  });

  it('resolves clip id from query for plain browser navigation', () => {
    expect(resolveClipIdHint('?startapp=clips&clipId=BJQ0001', null)).toBe('BJQ0001');
  });

  it('strips routing params from search', () => {
    expect(stripStartRoutingParams('?startapp=clips&clipId=BJQ0001&foo=bar')).toBe('foo=bar');
    expect(stripStartRoutingParams('?startapp=clips&clipId=BJQ0001')).toBe('');
  });
});
