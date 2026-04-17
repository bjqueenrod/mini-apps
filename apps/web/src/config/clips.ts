/**
 * Public Telegram channel for clip library updates (t.me/...).
 * Set VITE_CLIP_LIBRARY_CHANNEL_URL to override (e.g. invite links).
 */
const DEFAULT_CLIP_LIBRARY_CHANNEL_URL = 'https://t.me/mistressbjqueenclips';

export const CLIP_LIBRARY_CHANNEL_URL =
  (import.meta.env.VITE_CLIP_LIBRARY_CHANNEL_URL as string | undefined)?.trim() || DEFAULT_CLIP_LIBRARY_CHANNEL_URL;
