/// <reference lib="webworker" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Comma-separated hostnames for GA4 cross-domain linker (e.g. keyholding.mistressbjqueen.com) */
  readonly VITE_GA_LINKER_DOMAINS?: string;
  /** Public Telegram channel URL for clip library updates (https://t.me/... or invite link). */
  readonly VITE_CLIP_LIBRARY_CHANNEL_URL?: string;
}
