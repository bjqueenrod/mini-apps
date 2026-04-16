const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';

const linkerDomains: string[] = (import.meta.env.VITE_GA_LINKER_DOMAINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let mounted = false;

export type MiniAppGa4MirrorEvent = {
  eventName: 'entry_started' | 'screen_viewed' | 'interaction_triggered' | 'order_event' | 'premium_event';
  screen?: string;
  flowId?: string;
  actionKey?: string;
  receivedStartParam?: string;
  properties?: Record<string, unknown>;
};

function initGtagShim() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
}

function flattenParams(
  params: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else {
      out[k] = JSON.stringify(v);
    }
  }
  return out;
}

/** Loads GA4 gtag and configures SPA-style page views (no automatic first hit). */
export function initGa4(): void {
  if (!MEASUREMENT_ID || mounted) {
    return;
  }
  mounted = true;

  initGtagShim();
  const gtag = window.gtag!;
  gtag('js', new Date());

  const config: Record<string, unknown> = { send_page_view: false };
  if (linkerDomains.length) {
    config.linker = { domains: linkerDomains };
  }
  gtag('config', MEASUREMENT_ID, config);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

export function ga4PageView(path: string): void {
  if (!MEASUREMENT_ID) {
    return;
  }
  initGa4();
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: document.title,
    page_location: window.location.href,
  });
}

export function mirrorMiniAppEventToGa4(event: MiniAppGa4MirrorEvent): void {
  if (!MEASUREMENT_ID) {
    return;
  }

  if (event.eventName === 'screen_viewed') {
    return;
  }

  initGa4();

  const base: Record<string, unknown> = {
    mini_app_event: event.eventName,
    screen: event.screen,
    flow_id: event.flowId,
    start_param: event.receivedStartParam,
  };

  if (event.actionKey) {
    base.action_key = event.actionKey;
  }

  const merged = { ...base, ...(event.properties || {}) };
  const flat = flattenParams(merged);

  switch (event.eventName) {
    case 'entry_started':
      window.gtag?.('event', 'mini_app_entry', flat);
      break;
    case 'interaction_triggered':
      window.gtag?.('event', 'mini_app_interaction', flat);
      break;
    case 'order_event':
      window.gtag?.('event', 'mini_app_order', flat);
      break;
    case 'premium_event':
      window.gtag?.('event', 'mini_app_premium', flat);
      break;
    default:
      break;
  }
}
