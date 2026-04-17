/**
 * Public Telegram channel for clip library updates (t.me/...).
 * Set VITE_CLIP_LIBRARY_CHANNEL_URL to override (e.g. invite links).
 * Note: Vite replaces import.meta.env at **build** time. The value must be present
 * when `vite build` runs (CI / Docker build-args / hosting “build env”), not only at runtime.
 */
const DEFAULT_CLIP_LIBRARY_CHANNEL_URL = 'https://t.me/+rfCDvk3JVmgyYTA0';

export const CLIP_LIBRARY_CHANNEL_URL =
  (import.meta.env.VITE_CLIP_LIBRARY_CHANNEL_URL as string | undefined)?.trim() || DEFAULT_CLIP_LIBRARY_CHANNEL_URL;
