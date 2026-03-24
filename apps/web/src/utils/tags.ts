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

export function pickPrimaryTags(tags: string[], selectedTag?: string): string[] {
  const normalizedSelectedTag = selectedTag?.trim().toLowerCase() || '';
  const seen = new Set<string>();
  const ordered: string[] = [];

  const addTag = (tag?: string) => {
    const value = tag?.trim();
    if (!value) return;
    const normalized = value.toLowerCase();
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
