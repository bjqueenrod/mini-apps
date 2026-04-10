export const FEATURED_TAGS = [
  '#chastity',
  '#ruined_orgasm',
  '#edging',
  '#tease_denial',
  '#bondage',
  '#milking_table',
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

export function composeSearchText(text: string, tags: string[]): string {
  const baseText = text.trim();
  const tokenText = Array.from(new Set(tags.map((tag) => normalizeTag(tag)).filter(Boolean)))
    .map((tag) => `#${tag}`)
    .join(' ');
  return [baseText, tokenText].filter(Boolean).join(baseText && tokenText ? ' ' : '').trim();
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
    addTag(tags.find((tag) => normalizeTag(tag) === normalizedSelectedTag));
  }

  for (const featuredTag of FEATURED_TAGS) {
    const normalizedFeaturedTag = normalizeTag(featuredTag);
    addTag(tags.find((tag) => normalizeTag(tag) === normalizedFeaturedTag));
  }

  for (const tag of tags) {
    addTag(tag);
  }

  return ordered.slice(0, 2);
}
