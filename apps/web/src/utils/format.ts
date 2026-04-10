export type CurrencyCode = 'GBP' | 'USD';

export function formatPrice(value?: number, currency: CurrencyCode = 'GBP'): string {
  if (typeof value !== 'number') return 'Coming soon';
  const locale = currency === 'GBP' ? 'en-GB' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

function durationLabelToSeconds(durationLabel?: string): number | undefined {
  if (!durationLabel) return undefined;
  const value = durationLabel.trim();
  if (!value) return undefined;

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const parts = value.split(':').map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) {
    return undefined;
  }
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (minutes * 60) + seconds;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (hours * 3600) + (minutes * 60) + seconds;
  }
  return undefined;
}

export function formatDuration(durationLabel?: string, durationSeconds?: number): string {
  const totalSeconds = durationSeconds ?? durationLabelToSeconds(durationLabel);
  if (!totalSeconds) return 'Duration unavailable';
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} mins`;
}
