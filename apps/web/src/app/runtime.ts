import {
  applyTelegramTheme,
  isTelegramWebView,
  openBotDeepLink,
  openTelegramExternalLink,
  sendBotWebAppData,
} from './telegram';

const CLASS_BROWSER = 'runtime--browser';
const CLASS_TELEGRAM = 'runtime--telegram';

export type RuntimeKind = 'telegram' | 'browser';

let runtimeInitialized = false;

/** Vitest only: allow re-running `initializeRuntime` after changing `window.Telegram`. */
export function resetRuntimeInitForTests(): void {
  runtimeInitialized = false;
}

/** Call once at startup: sets `runtime--browser` or `runtime--telegram` on `<html>`. */
export function initializeRuntime(): void {
  if (runtimeInitialized) {
    return;
  }
  runtimeInitialized = true;
  const root = document.documentElement;
  const telegram = isTelegramWebView();
  root.classList.remove(CLASS_BROWSER, CLASS_TELEGRAM);
  root.classList.add(telegram ? CLASS_TELEGRAM : CLASS_BROWSER);
}

export function getRuntimeKind(): RuntimeKind {
  return isTelegramWebView() ? 'telegram' : 'browser';
}

export function isTelegramRuntime(): boolean {
  return isTelegramWebView();
}

export function isBrowserRuntime(): boolean {
  return !isTelegramWebView();
}

export function applyRuntimeTheme(): void {
  if (!isTelegramWebView()) {
    return;
  }
  applyTelegramTheme();
}

export function closeMiniApp(): void {
  if (!isTelegramWebView()) {
    return;
  }
  try {
    window.Telegram?.WebApp?.close?.();
  } catch {
    /* ignore */
  }
}

/** Opens checkout / invoice URLs: popup first, then Telegram WebApp link APIs. */
export function openPaymentCheckoutUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const win = window.open(trimmed, '_blank', 'noopener,noreferrer');
    if (win) {
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    window.Telegram?.WebApp?.openLink?.(trimmed);
    return true;
  } catch {
    try {
      window.Telegram?.WebApp?.openTelegramLink?.(trimmed);
      return true;
    } catch {
      return false;
    }
  }
}

export { openBotDeepLink, openTelegramExternalLink, sendBotWebAppData };
