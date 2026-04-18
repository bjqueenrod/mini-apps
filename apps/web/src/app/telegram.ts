import {
  init,
  miniApp,
  openLink,
  openTelegramLink,
  retrieveLaunchParams,
  retrieveRawInitData,
} from '@tma.js/sdk';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
        close?: () => void;
        openLink?: (url: string) => void;
        openTelegramLink?: (url: string) => void;
        sendData?: (data: string) => void;
        setBackgroundColor?: (color: string) => void;
        themeParams?: Record<string, string>;
        initData?: string;
        initDataUnsafe?: {
          user?: { id: number; username?: string; first_name?: string };
          start_param?: string;
        };
      };
    };
  }
}

export type TelegramContext = {
  isTelegram: boolean;
  initData?: string;
  startParam?: string;
  user?: { id: number; username?: string; firstName?: string };
  close?: () => void;
};

function normalizeStartParam(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

/** Telegram may surface the same launch param in several places; some parsers truncate. Prefer the longest non-empty candidate. */
function coalesceStartParamCandidates(...candidates: (string | null | undefined)[]): string | undefined {
  const seen = new Set<string>();
  let best: string | undefined;
  for (const raw of candidates) {
    const normalized = normalizeStartParam(raw);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    if (!best || normalized.length > best.length) {
      best = normalized;
    }
  }
  return best;
}

/** initData is an application/x-www-form-urlencoded payload; start_param may exist here when launch-param parsing fails. */
function startParamFromInitDataQuery(initData: string | undefined | null): string | undefined {
  const raw = initData?.trim();
  if (!raw) {
    return undefined;
  }
  try {
    return normalizeStartParam(new URLSearchParams(raw).get('start_param'));
  } catch {
    return undefined;
  }
}

/** Mini App launch data is usually in the URL fragment; location.search is often empty inside Telegram. */
function startParamFromLocationHash(): string | undefined {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return undefined;
  }
  try {
    const hashParams = new URLSearchParams(hash.slice(1));
    return normalizeStartParam(hashParams.get('tgWebAppStartParam') || hashParams.get('startapp'));
  } catch {
    return undefined;
  }
}

/** Same as @tma.js/bridge bootstrap: turn query or hash on the URL into an &-joined segment for URLSearchParams. */
function extractQueryLikeSegmentFromHref(href: string): string {
  return href.replace(/^[^?#]*[?#]/, '').replace(/[?#]/g, '&');
}

function tgWebAppDataFromLaunchSegment(segment: string | undefined | null): string | undefined {
  const raw = segment?.trim();
  if (!raw) {
    return undefined;
  }
  try {
    const value = new URLSearchParams(raw).get('tgWebAppData');
    return value?.trim() || undefined;
  } catch {
    return undefined;
  }
}

const TMA_LAUNCH_PARAMS_STORAGE_KEY = 'tapps/launchParams';

/** Matches the top of `styles.css` page gradient; must be explicit RGB so Telegram does not keep theme `bg_color`. */
/** Match `styles.css` :root gradient top so native chrome is not ink-black. */
const MINI_APP_BACKDROP_HEX = '#16131e';

let tmaSdkInitAttempted = false;

/**
 * Telegram Desktop sometimes passes launch data that fails @tma.js strict validation, so
 * retrieveRawInitData/retrieveLaunchParams throw or omit data — but tgWebAppData is still in the URL.
 */
function extractTgWebAppDataLoose(): string | undefined {
  const segments: string[] = [];
  try {
    segments.push(extractQueryLikeSegmentFromHref(window.location.href));
  } catch {
    /* ignore */
  }
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav?.name) {
      segments.push(extractQueryLikeSegmentFromHref(nav.name));
    }
  } catch {
    /* ignore */
  }
  try {
    const stored = sessionStorage.getItem(TMA_LAUNCH_PARAMS_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed === 'string') {
        segments.push(parsed);
      }
    }
  } catch {
    /* ignore */
  }
  for (const seg of segments) {
    const data = tgWebAppDataFromLaunchSegment(seg);
    if (data) {
      return data;
    }
  }
  return undefined;
}

/** Signed init string for POST /auth/telegram. WebApp.initData is sometimes empty; launch params still carry tgWebAppData in the URL. */
function resolveSignedInitData(webAppInitData: string | undefined | null): string | undefined {
  const fromWebApp = webAppInitData?.trim();
  if (fromWebApp) {
    return fromWebApp;
  }
  try {
    const raw = retrieveRawInitData();
    const trimmed = raw?.trim();
    if (trimmed) {
      return trimmed;
    }
  } catch {
    /* fall through — Desktop may fail strict launch-param parsing */
  }
  return extractTgWebAppDataLoose();
}

export function getTelegramContext(): TelegramContext {
  const webApp = window.Telegram?.WebApp;
  const queryParams = new URLSearchParams(window.location.search);
  if (!webApp) {
    return {
      isTelegram: false,
      initData: undefined,
      startParam: coalesceStartParamCandidates(
        queryParams.get('tgWebAppStartParam'),
        queryParams.get('startapp'),
        startParamFromLocationHash(),
      ),
      user: undefined,
      close: undefined,
    };
  }
  webApp.ready?.();
  webApp.expand?.();
  const initDataStr = resolveSignedInitData(webApp.initData);
  try {
    const launch = retrieveLaunchParams() as {
      tgWebAppData?: { user?: { id: number; username?: string; firstName?: string } };
      tgWebAppStartParam?: string;
    };
    const user = launch.tgWebAppData?.user;
    return {
      isTelegram: true,
      initData: initDataStr || undefined,
      startParam: coalesceStartParamCandidates(
        launch.tgWebAppStartParam,
        startParamFromInitDataQuery(initDataStr),
        queryParams.get('tgWebAppStartParam'),
        queryParams.get('startapp'),
        startParamFromLocationHash(),
        webApp?.initDataUnsafe?.start_param,
      ),
      user: user ? { id: user.id, username: user.username, firstName: user.firstName } : undefined,
      close: () => webApp?.close?.(),
    };
  } catch {
    const unsafe = webApp?.initDataUnsafe?.user;
    return {
      isTelegram: Boolean(webApp),
      initData: initDataStr,
      startParam: coalesceStartParamCandidates(
        startParamFromInitDataQuery(initDataStr),
        queryParams.get('tgWebAppStartParam'),
        queryParams.get('startapp'),
        startParamFromLocationHash(),
        webApp?.initDataUnsafe?.start_param,
      ),
      user: unsafe ? { id: unsafe.id, username: unsafe.username, firstName: unsafe.first_name } : undefined,
      close: () => webApp?.close?.(),
    };
  }
}

function ensureTmaSdkInitialized(): void {
  if (tmaSdkInitAttempted || !window.Telegram?.WebApp) {
    return;
  }
  tmaSdkInitAttempted = true;
  try {
    init();
  } catch {
    /* strict launch-param parsing can fail on some Telegram Desktop builds */
  }
}

/** Telegram / @tma.js miniApp defaults to theme `bg_color`, which replaces the native backdrop after mount — flashes then “eats” the CSS gradient. */
function syncMiniAppNativeBackdrop(): void {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    return;
  }
  ensureTmaSdkInitialized();
  try {
    miniApp.mount();
  } catch {
    /* unsupported or init failed */
  }
  try {
    miniApp.setBgColor(MINI_APP_BACKDROP_HEX);
  } catch {
    /* older clients */
  }
  try {
    webApp.setBackgroundColor?.(MINI_APP_BACKDROP_HEX);
  } catch {
    /* optional legacy API */
  }
}

export function applyTelegramTheme(): void {
  const theme = window.Telegram?.WebApp?.themeParams ?? {};
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--tg-${key}`, value);
  });
  syncMiniAppNativeBackdrop();
}

export function isTelegramWebView(): boolean {
  return Boolean(window.Telegram?.WebApp);
}

function scheduleMiniAppClose(): void {
  const webApp = window.Telegram?.WebApp;
  const closeMiniApp = () => {
    try {
      miniApp.close();
    } catch {
      webApp?.close?.();
    }
  };
  window.setTimeout(closeMiniApp, 180);
  window.setTimeout(closeMiniApp, 520);
}

export function sendBotWebAppData(data: string): boolean {
  const webApp = window.Telegram?.WebApp;
  if (!webApp?.sendData) {
    return false;
  }
  try {
    webApp.sendData(data);
    scheduleMiniAppClose();
    return true;
  } catch {
    return false;
  }
}

/** Opens a t.me link (channel, bot, etc.) without closing the mini app. */
export function openTelegramExternalLink(url: string): void {
  const trimmed = url.trim();
  if (!trimmed) {
    return;
  }
  const webApp = window.Telegram?.WebApp;
  try {
    openTelegramLink(trimmed);
    return;
  } catch {
    // fall through
  }
  try {
    webApp?.openTelegramLink?.(trimmed);
    return;
  } catch {
    // fall through
  }
  try {
    webApp?.openLink?.(trimmed);
    return;
  } catch {
    // fall through
  }
  try {
    openLink(trimmed);
  } catch {
    window.open(trimmed, '_blank', 'noopener,noreferrer');
  }
}

export function openBotDeepLink(url: string): void {
  const webApp = window.Telegram?.WebApp;

  try {
    openTelegramLink(url);
    scheduleMiniAppClose();
    return;
  } catch {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
      scheduleMiniAppClose();
      return;
    }

    if (webApp?.openLink) {
      webApp.openLink(url);
      scheduleMiniAppClose();
      return;
    }
  }

  try {
    openLink(url);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
