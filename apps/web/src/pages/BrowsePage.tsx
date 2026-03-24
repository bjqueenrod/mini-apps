import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { ClipGrid } from '../components/ClipGrid';
import { ClipDetailSheet } from '../components/ClipDetailSheet';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { SkeletonCard } from '../components/SkeletonCard';
import { RecentSearches } from '../components/RecentSearches';
import { TopSellersCarousel } from '../components/TopSellersCarousel';
import { applyTelegramTheme } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { useClipDetail, useClipSearch, useTopSellers } from '../features/clips/hooks';
import { readQueryState, toSearchParams } from '../features/clips/queryState';
import { pushRecentSearch, readRecentSearches } from '../utils/storage';
import { FEATURED_TAGS } from '../utils/tags';

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { clipId } = useParams();
  const session = useTelegramSession();
  const [searchValue, setSearchValue] = useState(readQueryState(searchParams).q);
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches());
  const queryState = useMemo(() => readQueryState(searchParams), [searchParams]);
  const clipsQuery = useClipSearch(queryState);
  const topSellersQuery = useTopSellers();
  const clipDetailQuery = useClipDetail(clipId);
  const featuredTagSet = useMemo(() => new Set(FEATURED_TAGS.map((tag) => tag.toLowerCase())), []);
  const selectedFeaturedTag = useMemo(
    () => queryState.tags.find((tag) => featuredTagSet.has(tag.toLowerCase())) ?? '',
    [featuredTagSet, queryState.tags],
  );
  const selectedSecondaryTag = useMemo(
    () => queryState.tags.find((tag) => !featuredTagSet.has(tag.toLowerCase())) ?? '',
    [featuredTagSet, queryState.tags],
  );
  const remainingTagOptions = useMemo(() => {
    const excluded = new Set(['and', 'in', 'made', 'bar']);
    const tagCounts = new Map<string, { tag: string; count: number }>();

    for (const item of clipsQuery.data?.items ?? []) {
      const seenInClip = new Set<string>();
      for (const rawTag of item.tags) {
        const tag = rawTag.trim();
        const normalized = tag.toLowerCase();
        if (!tag || featuredTagSet.has(normalized) || excluded.has(normalized) || seenInClip.has(normalized)) {
          continue;
        }
        seenInClip.add(normalized);
        const current = tagCounts.get(normalized);
        if (current) {
          current.count += 1;
        } else {
          tagCounts.set(normalized, { tag, count: 1 });
        }
      }
    }

    return Array.from(tagCounts.values())
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
      .slice(0, 30)
      .map((entry) => entry.tag);
  }, [clipsQuery.data?.items, featuredTagSet]);

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = { ...queryState, q: searchValue, page: 1 };
      setSearchParams(toSearchParams(next));
      if (searchValue.trim()) {
        setRecent(pushRecentSearch(searchValue));
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const loadMore = () => setSearchParams(toSearchParams({ ...queryState, page: queryState.page + 1 }));
  const updateState = (patch: Partial<typeof queryState>) => setSearchParams(toSearchParams({ ...queryState, ...patch, page: 1 }));
  const updateFeaturedTag = (value: string) => {
    const tags = [value, selectedSecondaryTag].filter(Boolean);
    updateState({ tags, category: '' });
  };
  const updateSecondaryTag = (value: string) => {
    const tags = [selectedFeaturedTag, value].filter(Boolean);
    updateState({ tags, category: '' });
  };
  const loadedCount = clipsQuery.data?.items.length ?? 0;
  const totalCount = clipsQuery.data?.total ?? 0;
  const resultsLabel = clipsQuery.data
    ? clipsQuery.data.hasMore
      ? `Showing ${loadedCount} of ${totalCount} results`
      : `${totalCount} result${totalCount === 1 ? '' : 's'}`
    : null;

  return (
    <AppShell>
      {!session.isTelegram && <TelegramDevBanner />}
      <section className="hero">
        <div className="hero__brand">
          <img className="hero__avatar" src="/mistress.jpg" alt="Mistress BJQueen" />
          <h1>FEMDOM CLIP LIBRARY</h1>
        </div>
      </section>

      {topSellersQuery.data?.items?.length ? <TopSellersCarousel items={topSellersQuery.data.items} /> : null}

      <section className="toolbar">
        <div className="toolbar__search">
          <p className="toolbar__eyebrow">🔎 Search Clips</p>
          <SearchBar value={searchValue} onChange={setSearchValue} />
        </div>
      </section>

      <RecentSearches items={recent} onPick={setSearchValue} />
      <FilterBar
        items={FEATURED_TAGS}
        value={selectedFeaturedTag}
        onChange={updateFeaturedTag}
        variant="tag"
      />
      {remainingTagOptions.length > 0 && (
        <FilterBar
          items={remainingTagOptions}
          value={selectedSecondaryTag}
          onChange={updateSecondaryTag}
          variant="tag"
          includeAll={false}
        />
      )}
      {resultsLabel && <p className="results-summary">{resultsLabel}</p>}

      {session.error && <ErrorState message={session.error} />}
      {clipsQuery.isError && <ErrorState message={(clipsQuery.error as Error).message} />}
      {!clipsQuery.data && clipsQuery.isLoading && (
        <div className="clip-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {clipsQuery.data && clipsQuery.data.items.length > 0 && <ClipGrid items={clipsQuery.data.items} />}
      {clipsQuery.data && clipsQuery.data.items.length === 0 && <EmptyState />}

      {clipsQuery.data?.hasMore && (
        <button className="load-more" type="button" onClick={loadMore}>
          Load more
        </button>
      )}

      {clipId && (
        <ClipDetailSheet
          clip={clipDetailQuery.data}
          loading={clipDetailQuery.isLoading}
        />
      )}
    </AppShell>
  );
}
