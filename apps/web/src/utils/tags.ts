export const FEATURED_TAGS = [
  'chastity',
  'ruinedorgasm',
  'milking',
  'bondage',
  'cuckold',
  'joi',
  'strapon',
  'blowjob',
  'magicwand',
  'compilation',
];

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#/, '').toLowerCase();
}

export function extractHashtagTokens(text: string): string[] {
  const matches = text.match(/(^|\s)#([a-z0-9_]+)/gi) ?? [];
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const match of matches) {
    const value = normalizeTag(match);
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    ordered.push(value);
  }

  return ordered;
}

export function stripHashtagTokens(text: string): string {
  return text
    .replace(/(^|\s)#[a-z0-9_]+(?=\s|$)/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function setHashtagToken(text: string, tag: string, enabled: boolean): string {
  const normalizedTag = normalizeTag(tag);
  const tokens = extractHashtagTokens(text).filter((token) => token !== normalizedTag);
  if (enabled) {
    tokens.push(normalizedTag);
  }

  const baseText = stripHashtagTokens(text);
  const tokenText = tokens.map((token) => `#${token}`).join(' ');
  return [baseText, tokenText].filter(Boolean).join(baseText && tokenText ? ' ' : '').trim();
}

export function pickPrimaryTags(tags: string[], selectedTag?: string): string[] {
  const normalizedSelectedTag = normalizeTag(selectedTag ?? '');
  const seen = new Set<string>();
  const ordered: string[] = [];

  const addTag = (tag?: string) => {
    const value = tag?.trim();
    if (!value) return;
    const normalized = normalizeTag(value);
    if (seen.has(normalized)) return;
    seen.add(normalized);
    ordered.push(value);
  };

  if (normalizedSelectedTag) {
    addTag(tags.find((tag) => tag.trim().toLowerCase() === normalizedSelectedTag));
  }

  for (const featuredTag of FEATURED_TAGS) {
    addTag(tags.find((tag) => tag.trim().toLowerCase() === featuredTag));
  }

  for (const tag of tags) {
    addTag(tag);
  }

  return ordered.slice(0, 2);
}
