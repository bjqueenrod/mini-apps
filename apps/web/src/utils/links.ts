export function toClipPath(clipId: string, search: string): string {
  return `/clips/${encodeURIComponent(clipId)}${search}`;
}

export function toTierPath(tierId: string): string {
  return `/tasks/${encodeURIComponent(tierId)}`;
}
