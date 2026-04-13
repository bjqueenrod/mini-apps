const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

type MiniAppAnalyticsEventName =
  | 'entry_started'
  | 'screen_viewed'
  | 'interaction_triggered'
  | 'order_event'
  | 'premium_event';

type MiniAppAnalyticsEvent = {
  eventName: MiniAppAnalyticsEventName;
  screen?: string;
  flowId?: string;
  actionKey?: string;
  occurredAt?: string;
  dedupeKey?: string;
  receivedStartParam?: string;
  properties?: Record<string, unknown>;
};

type AnalyticsContext = {
  enabled: boolean;
  isTelegram: boolean;
  startParam?: string;
};

let lastTrackedPath = '';
let initialized = false;
let context: AnalyticsContext = {
  enabled: false,
  isTelegram: false,
  startParam: undefined,
};
const pendingEvents: MiniAppAnalyticsEvent[] = [];
let flushPromise: Promise<void> | null = null;

function buildDedupeKey(eventName: MiniAppAnalyticsEventName) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `miniapp:${eventName}:${crypto.randomUUID()}`;
  }
  return `miniapp:${eventName}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

function screenFromPath(path: string) {
  const pathname = path.split('?')[0] || '/';

  if (pathname === '/') {
    return 'home';
  }
  if (pathname === '/clips') {
    return 'clips_home';
  }
  if (pathname === '/tasks') {
    return 'tasks_home';
  }
  if (/^\/clips\/[^/]+$/.test(pathname)) {
    return 'clip_detail';
  }
  if (/^\/tasks\/[^/]+$/.test(pathname)) {
    return 'tier_detail';
  }

  return pathname.replace(/^\//, '').replace(/\//g, '_') || 'home';
}

function buildEventPayload(event: MiniAppAnalyticsEvent) {
  return {
    eventName: event.eventName,
    screen: event.screen,
    flowId: event.flowId,
    actionKey: event.actionKey,
    occurredAt: event.occurredAt || new Date().toISOString(),
    dedupeKey: event.dedupeKey || buildDedupeKey(event.eventName),
    receivedStartParam: event.receivedStartParam ?? context.startParam,
    properties: {
      ...(event.properties || {}),
      is_telegram: context.isTelegram,
    },
  };
}

async function postEvent(event: MiniAppAnalyticsEvent) {
  try {
    await fetch(`${API_BASE}/analytics/events`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEventPayload(event)),
    });
  } catch {
    // Analytics should never block the mini-app experience.
  }
}

function flushPendingEvents() {
  if (!context.enabled || flushPromise) {
    return;
  }

  flushPromise = (async () => {
    while (context.enabled && pendingEvents.length) {
      const next = pendingEvents.shift();
      if (!next) {
        continue;
      }
      await postEvent(next);
    }
  })().finally(() => {
    flushPromise = null;
    if (context.enabled && pendingEvents.length) {
      flushPendingEvents();
    }
  });
}

function queueOrSend(event: MiniAppAnalyticsEvent) {
  if (!context.enabled) {
    pendingEvents.push(event);
    return;
  }

  void postEvent(event);
}

export function initializeAnalytics() {
  if (initialized) {
    return;
  }

  initialized = true;
  trackPageView(`${window.location.pathname}${window.location.search}`);
}

export function setAnalyticsContext(next: AnalyticsContext) {
  context = {
    ...next,
    enabled: next.enabled && next.isTelegram,
  };
  if (context.enabled) {
    flushPendingEvents();
  }
}

export function trackEntryStarted(params: {
  screen: string;
  flowId?: string;
  receivedStartParam?: string;
  properties?: Record<string, unknown>;
}) {
  queueOrSend({
    eventName: 'entry_started',
    screen: params.screen,
    flowId: params.flowId,
    receivedStartParam: params.receivedStartParam,
    properties: params.properties,
  });
}

export function trackScreenView(params: {
  screen: string;
  flowId?: string;
  receivedStartParam?: string;
  properties?: Record<string, unknown>;
}) {
  queueOrSend({
    eventName: 'screen_viewed',
    screen: params.screen,
    flowId: params.flowId,
    receivedStartParam: params.receivedStartParam,
    properties: params.properties,
  });
}

export function trackInteraction(params: {
  actionKey: string;
  screen?: string;
  flowId?: string;
  receivedStartParam?: string;
  properties?: Record<string, unknown>;
}) {
  queueOrSend({
    eventName: 'interaction_triggered',
    screen: params.screen,
    flowId: params.flowId,
    actionKey: params.actionKey,
    receivedStartParam: params.receivedStartParam,
    properties: params.properties,
  });
}

/** CMS analytics: funnel states should use payment_method_prompted | paid | delivered | fulfilled */
export function trackOrderEvent(params: {
  state: string;
  screen?: string;
  flowId?: string;
  receivedStartParam?: string;
  properties?: Record<string, unknown>;
}) {
  queueOrSend({
    eventName: 'order_event',
    screen: params.screen,
    flowId: params.flowId,
    receivedStartParam: params.receivedStartParam,
    properties: { state: params.state, ...(params.properties || {}) },
  });
}

export function trackPremiumEvent(params: {
  state: string;
  screen?: string;
  flowId?: string;
  receivedStartParam?: string;
  properties?: Record<string, unknown>;
}) {
  queueOrSend({
    eventName: 'premium_event',
    screen: params.screen,
    flowId: params.flowId,
    receivedStartParam: params.receivedStartParam,
    properties: { state: params.state, ...(params.properties || {}) },
  });
}

export function trackPageView(path: string) {
  if (path === lastTrackedPath) {
    return;
  }

  lastTrackedPath = path;
  trackScreenView({
    screen: screenFromPath(path),
    properties: {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
    },
  });
}
