import { getTierDurationLabel, getTierTasksLabel } from './presentation';
import { TierItem } from './types';

const PALETTES = [
  {
    backgroundStart: '#2f2142',
    backgroundEnd: '#17111f',
    accent: '#d896ff',
    accentSoft: '#8d63b3',
    glow: '#f3b2ff',
  },
  {
    backgroundStart: '#43274a',
    backgroundEnd: '#16111d',
    accent: '#ffbfdc',
    accentSoft: '#9d5d7d',
    glow: '#ffd6eb',
  },
  {
    backgroundStart: '#23283f',
    backgroundEnd: '#12111a',
    accent: '#9ab4ff',
    accentSoft: '#5567ab',
    glow: '#c7d4ff',
  },
  {
    backgroundStart: '#1f3640',
    backgroundEnd: '#101319',
    accent: '#8fe7df',
    accentSoft: '#4f8d89',
    glow: '#cbfffb',
  },
] as const;

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hashTier(tier: TierItem): number {
  const source = `${tier.id}:${tier.productId ?? ''}:${tier.name}`;
  let hash = 0;

  for (const character of source) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function buildSvg(tier: TierItem, badgeLabel?: string): string {
  const palette = PALETTES[hashTier(tier) % PALETTES.length];
  const title = escapeSvgText(tier.name);
  const duration = escapeSvgText(getTierDurationLabel(tier));
  const tasks = escapeSvgText(getTierTasksLabel(tier));
  const badge = badgeLabel ? escapeSvgText(badgeLabel) : '';
  const titleY = badge ? '150' : '112';
  const tasksY = badge ? '190' : '152';
  const durationY = badge ? '225' : '187';
  const badgeMarkup = badge
    ? `
      <rect x="42" y="42" width="220" height="44" rx="22" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.12)" />
      <text x="66" y="70" fill="${palette.glow}" font-size="20" font-family="Avenir Next, Segoe UI, sans-serif" letter-spacing="1.6">${badge}</text>
    `
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420" fill="none">
      <defs>
        <linearGradient id="bg" x1="60" y1="40" x2="590" y2="360" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.backgroundStart}" />
          <stop offset="1" stop-color="${palette.backgroundEnd}" />
        </linearGradient>
        <radialGradient id="glowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(180 108) rotate(45) scale(260 220)">
          <stop stop-color="${palette.glow}" stop-opacity=".44" />
          <stop offset="1" stop-color="${palette.glow}" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(530 320) rotate(140) scale(210 180)">
          <stop stop-color="${palette.accent}" stop-opacity=".22" />
          <stop offset="1" stop-color="${palette.accent}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="stroke" x1="140" y1="72" x2="510" y2="318" gradientUnits="userSpaceOnUse">
          <stop stop-color="${palette.accent}" stop-opacity=".7" />
          <stop offset="1" stop-color="${palette.accentSoft}" stop-opacity=".35" />
        </linearGradient>
      </defs>

      <rect width="640" height="420" rx="28" fill="url(#bg)" />
      <rect x="1.5" y="1.5" width="637" height="417" rx="26.5" stroke="rgba(255,255,255,.06)" />
      ${badgeMarkup}

      <circle cx="182" cy="114" r="158" fill="url(#glowA)" />
      <circle cx="532" cy="326" r="126" fill="url(#glowB)" />

      <path d="M84 280C162 214 222 176 292 168C381 159 438 195 542 144" stroke="url(#stroke)" stroke-width="3" stroke-linecap="round" opacity=".72"/>
      <path d="M84 314C158 258 236 229 302 227C376 225 459 256 550 220" stroke="rgba(255,255,255,.12)" stroke-width="2" stroke-linecap="round"/>
      <path d="M84 347C157 316 219 303 286 301C372 298 438 318 555 286" stroke="rgba(255,255,255,.08)" stroke-width="2" stroke-linecap="round"/>

      <g opacity=".95">
        <circle cx="470" cy="112" r="56" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.08)" />
        <circle cx="470" cy="112" r="32" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.14)" />
        <path d="M470 83V141" stroke="${palette.glow}" stroke-width="3" stroke-linecap="round" opacity=".85" />
        <path d="M441 112H499" stroke="${palette.glow}" stroke-width="3" stroke-linecap="round" opacity=".55" />
      </g>

      <text x="66" y="${titleY}" fill="white" font-size="50" font-weight="700" font-family="Avenir Next, Segoe UI, sans-serif">${title}</text>
      <text x="66" y="${tasksY}" fill="rgba(255,255,255,.74)" font-size="26" font-family="Avenir Next, Segoe UI, sans-serif">${tasks}</text>
      <text x="66" y="${durationY}" fill="rgba(255,255,255,.58)" font-size="24" font-family="Avenir Next, Segoe UI, sans-serif">${duration}</text>
    </svg>
  `;
}

export function getTierArtwork(tier: TierItem, badgeLabel?: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildSvg(tier, badgeLabel))}`;
}
