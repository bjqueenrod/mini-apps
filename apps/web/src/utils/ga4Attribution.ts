const KEYHOLDING_APPLY_ORIGIN = 'https://keyholding.mistressbjqueen.com';

/**
 * Parses GA4 `_ga` cookie for a client id when present (GS1.1 / GA1.2 shapes).
 */
function parseGaClientIdFromDocumentCookie(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)_ga=([^;]+)/);
  if (!match) return undefined;
  const value = decodeURIComponent(match[1].trim());
  const parts = value.split('.');
  if (parts[0] === 'GS1' && parts.length >= 4) {
    return `${parts[2]}.${parts[3]}`;
  }
  if (parts[0] === 'GA1' && parts.length >= 4) {
    return `${parts[2]}.${parts[3]}`;
  }
  return value;
}

/** Value of the first `_ga_<measurementId>` cookie (session / state blob for GA4). */
function firstGaMeasurementCookieValue(): string | undefined {
  const segments = document.cookie.split(';');
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed.startsWith('_ga_') || trimmed.startsWith('_ga=')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    return decodeURIComponent(trimmed.slice(eq + 1).trim());
  }
  return undefined;
}

/**
 * Outbound URL for the keyholding apply flow with UTM + GA4-friendly query params.
 * The destination site can read these for cross-domain / campaign attribution.
 */
export function buildKeyholdingApplyUrl(): string {
  const url = new URL(`${KEYHOLDING_APPLY_ORIGIN}/`);

  url.searchParams.set('utm_source', 'telegram_mini_app');
  url.searchParams.set('utm_medium', 'mini_app');
  url.searchParams.set('utm_campaign', 'keyholding_apply');
  url.searchParams.set('utm_content', 'apply_cta');

  const gaClientId = parseGaClientIdFromDocumentCookie();
  if (gaClientId) {
    url.searchParams.set('ga_client_id', gaClientId);
    url.searchParams.set('client_id', gaClientId);
  }

  const gaSessionCookie = firstGaMeasurementCookieValue();
  if (gaSessionCookie) {
    url.searchParams.set('ga_session_cookie', gaSessionCookie);
  }

  url.searchParams.set('page_location', window.location.href);
  if (document.referrer) {
    url.searchParams.set('page_referrer', document.referrer);
  }

  return url.toString();
}
