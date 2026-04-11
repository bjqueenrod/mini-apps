function parseStartPayload(payload?: string | null): URLSearchParams | null {
  const raw = payload?.trim();
  if (!raw) {
    return null;
  }

  const normalized = raw.startsWith('?') ? raw.slice(1) : raw;

  if (/^clips(?:[&?]|$)/i.test(normalized) && normalized.toLowerCase().includes('clipid=')) {
    const rest = normalized.replace(/^clips(?:[&?])?/i, '');
    return new URLSearchParams(`startapp=clips&${rest}`);
  }

  if (!normalized.includes('=') && !normalized.includes('&')) {
    return null;
  }

  return new URLSearchParams(normalized);
}

export function resolveStartappHint(search: string, startParam?: string | null): string | null {
  const searchParams = new URLSearchParams(search);
  const queryStartapp = (searchParams.get('startapp') || searchParams.get('tgWebAppStartParam') || '').trim();
  const startPayloadParams = parseStartPayload(startParam);
  const payloadStartapp = startPayloadParams?.get('startapp')?.trim();
  const startapp = (payloadStartapp || startParam || queryStartapp).trim().toLowerCase();
  return startapp === 'clips' || startapp === 'tasks' || startapp === 'keyholding' ? startapp : null;
}

export function resolveClipIdHint(search: string, startParam?: string | null): string | null {
  const searchParams = new URLSearchParams(search);
  const queryClipId = searchParams.get('clipId')?.trim();
  if (queryClipId) {
    return queryClipId;
  }

  const startPayloadParams = parseStartPayload(startParam);
  const startapp = (startPayloadParams?.get('startapp') || '').trim().toLowerCase();
  const clipId = startPayloadParams?.get('clipId')?.trim();
  return startapp === 'clips' && clipId ? clipId : null;
}

export function stripStartRoutingParams(search: string): string {
  const searchParams = new URLSearchParams(search);
  searchParams.delete('clipId');
  searchParams.delete('startapp');
  searchParams.delete('tgWebAppStartParam');
  return searchParams.toString();
}

