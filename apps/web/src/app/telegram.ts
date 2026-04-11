import { miniApp, openLink, openTelegramLink, retrieveLaunchParams } from '@tma.js/sdk';

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
function coalesceStartParamCandidates(...candidates: (string | undefined)[]): string | undefined {
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

export function getTelegramContext(): TelegramContext {
  const webApp = window.Telegram?.WebApp;
  const queryParams = new URLSearchParams(window.location.search);
  try {
    const launch = retrieveLaunchParams() as {
      tgWebAppData?: { user?: { id: number; username?: string; firstName?: string } };
      tgWebAppStartParam?: string;
      initDataRaw?: string;
    };
    const user = launch.tgWebAppData?.user;
    const initDataStr = webApp?.initData || launch.initDataRaw;
    webApp?.ready?.();
    webApp?.expand?.();
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
      initData: webApp?.initData,
      startParam: coalesceStartParamCandidates(
        startParamFromInitDataQuery(webApp?.initData),
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

export function applyTelegramTheme(): void {
  const theme = window.Telegram?.WebApp?.themeParams ?? {};
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--tg-${key}`, value);
  });
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
