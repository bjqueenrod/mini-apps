import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  closeMock: vi.fn(),
  openLinkMock: vi.fn(),
  openTelegramLinkMock: vi.fn(),
  retrieveLaunchParamsMock: vi.fn(),
  retrieveRawInitDataMock: vi.fn(),
  sendDataMock: vi.fn(),
}));

vi.mock('@tma.js/sdk', () => ({
  miniApp: { close: sdk.closeMock },
  openLink: sdk.openLinkMock,
  openTelegramLink: sdk.openTelegramLinkMock,
  retrieveLaunchParams: sdk.retrieveLaunchParamsMock,
  retrieveRawInitData: sdk.retrieveRawInitDataMock,
}));

import { getTelegramContext, sendBotWebAppData } from './telegram';

describe('getTelegramContext', () => {
  beforeEach(() => {
    sdk.retrieveLaunchParamsMock.mockClear();
    sdk.retrieveRawInitDataMock.mockClear();
    sdk.retrieveRawInitDataMock.mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads tgWebAppStartParam from the URL hash when the SDK cannot parse launch params', () => {
    sdk.retrieveLaunchParamsMock.mockImplementation(() => {
      throw new Error('simulated launch parse failure');
    });
    vi.stubGlobal('window', {
      location: {
        href: 'https://app.test/#tgWebAppStartParam=clips_BJQ0169__l_e&tgWebAppPlatform=ios',
        search: '',
        hash: '#tgWebAppStartParam=clips_BJQ0169__l_e&tgWebAppPlatform=ios',
      },
      performance: { getEntriesByType: () => [] },
      sessionStorage: { getItem: () => null },
      Telegram: {
        WebApp: {
          initData: '',
          initDataUnsafe: {},
        },
      },
    });
    const ctx = getTelegramContext();
    expect(ctx.startParam).toBe('clips_BJQ0169__l_e');
    expect(ctx.isTelegram).toBe(true);
  });

  it('uses retrieveRawInitData when WebApp.initData is empty but launch params include tgWebAppData', () => {
    sdk.retrieveLaunchParamsMock.mockReturnValue({
      tgWebAppData: { user: { id: 1, firstName: 'x', username: 'u' } },
      tgWebAppStartParam: 'clips_BJQ0169__l_e',
      tgWebAppPlatform: 'ios',
      tgWebAppThemeParams: {},
      tgWebAppVersion: '8.0',
    });
    sdk.retrieveRawInitDataMock.mockReturnValue('user=%7B%22id%22%3A1%7D&hash=abc');
    vi.stubGlobal('window', {
      location: {
        href: 'https://app.test/',
        search: '',
        hash: '',
      },
      performance: { getEntriesByType: () => [] },
      sessionStorage: { getItem: () => null },
      Telegram: {
        WebApp: {
          initData: '',
          initDataUnsafe: {},
        },
      },
    });
    const ctx = getTelegramContext();
    expect(ctx.initData).toBe('user=%7B%22id%22%3A1%7D&hash=abc');
    expect(ctx.startParam).toBe('clips_BJQ0169__l_e');
  });

  it('reads tgWebAppData from the URL when strict SDK retrieval fails (e.g. Telegram Desktop)', () => {
    sdk.retrieveLaunchParamsMock.mockImplementation(() => {
      throw new Error('simulated strict parse failure');
    });
    sdk.retrieveRawInitDataMock.mockImplementation(() => {
      throw new Error('simulated raw retrieve failure');
    });
    const initPayload = 'user=test&hash=abc';
    const encoded = encodeURIComponent(initPayload);
    vi.stubGlobal('window', {
      location: {
        href: `https://app.test/page#tgWebAppData=${encoded}&tgWebAppVersion=7.0&tgWebAppPlatform=tdesktop`,
        search: '',
        hash: `#tgWebAppData=${encoded}&tgWebAppVersion=7.0&tgWebAppPlatform=tdesktop`,
      },
      performance: { getEntriesByType: () => [] as PerformanceEntryList },
      sessionStorage: { getItem: () => null },
      Telegram: {
        WebApp: {
          initData: '',
          initDataUnsafe: { start_param: 'clips_x' },
        },
      },
    });
    const ctx = getTelegramContext();
    expect(ctx.initData).toBe(initPayload);
    expect(ctx.isTelegram).toBe(true);
  });

  it('prefers the longest start param when Telegram exposes both a short and a full value', () => {
    sdk.retrieveLaunchParamsMock.mockReturnValue({
      tgWebAppData: { user: { id: 1, firstName: 'x', username: 'u' } },
      tgWebAppStartParam: 'clips',
      tgWebAppPlatform: 'ios',
      tgWebAppThemeParams: {},
      tgWebAppVersion: '8.0',
    });
    vi.stubGlobal('window', {
      location: {
        href: 'https://app.test/',
        search: '',
        hash: '',
      },
      performance: { getEntriesByType: () => [] },
      sessionStorage: { getItem: () => null },
      Telegram: {
        WebApp: {
          initData: 'start_param=clips_BJQ0169__l_e',
          initDataUnsafe: {},
        },
      },
    });
    const ctx = getTelegramContext();
    expect(ctx.startParam).toBe('clips_BJQ0169__l_e');
  });

  it('returns browser context when Telegram WebApp is absent (does not call retrieveLaunchParams)', () => {
    sdk.retrieveLaunchParamsMock.mockClear();
    vi.stubGlobal('window', {
      location: {
        href: 'https://app.test/?startapp=clips&clipId=BJQ0001',
        search: '?startapp=clips&clipId=BJQ0001',
        hash: '',
      },
      performance: { getEntriesByType: () => [] },
      sessionStorage: { getItem: () => null },
    });
    const ctx = getTelegramContext();
    expect(ctx.isTelegram).toBe(false);
    expect(ctx.initData).toBeUndefined();
    expect(ctx.startParam).toBe('clips');
    expect(sdk.retrieveLaunchParamsMock).not.toHaveBeenCalled();
  });
});

describe('sendBotWebAppData', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sdk.closeMock.mockClear();
    sdk.openLinkMock.mockClear();
    sdk.openTelegramLinkMock.mockClear();
    sdk.retrieveLaunchParamsMock.mockClear();
    sdk.sendDataMock.mockClear();
    vi.stubGlobal('window', {
      Telegram: {
        WebApp: {
          sendData: sdk.sendDataMock,
          close: vi.fn(),
        },
      },
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sends web app data and closes the mini app', () => {
    const result = sendBotWebAppData('stream_BJQ0001');

    expect(result).toBe(true);
    expect(sdk.sendDataMock).toHaveBeenCalledWith('stream_BJQ0001');
    vi.runAllTimers();
    expect(sdk.closeMock).toHaveBeenCalled();
  });
});
