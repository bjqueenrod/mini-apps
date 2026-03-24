import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { SortSelect } from '../components/SortSelect';
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
import { DEFAULT_SORT, readQueryState, toSearchParams } from '../features/clips/queryState';
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
  const remainingTagOptions = useMemo(() => {
    const featured = new Set(FEATURED_TAGS.map((tag) => tag.toLowerCase()));
    const tagCounts = new Map<string, { tag: string; count: number }>();

    for (const item of clipsQuery.data?.items ?? []) {
      const seenInClip = new Set<string>();
      for (const rawTag of item.tags) {
        const tag = rawTag.trim();
        const normalized = tag.toLowerCase();
        if (!tag || featured.has(normalized) || seenInClip.has(normalized)) {
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
      .slice(0, 24)
      .map((entry) => entry.tag);
  }, [clipsQuery.data?.items]);

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
        <p className="toolbar__eyebrow">🔎 Search Clips</p>
        <SearchBar value={searchValue} onChange={setSearchValue} />
        <SortSelect value={queryState.sort || DEFAULT_SORT} onChange={(value) => updateState({ sort: value })} />
      </section>

      <RecentSearches items={recent} onPick={setSearchValue} />
      <FilterBar
        items={FEATURED_TAGS}
        value={queryState.tags[0] ?? ''}
        onChange={(value) => updateState({ tags: value ? [value] : [], category: '' })}
        variant="tag"
      />
      {remainingTagOptions.length > 0 && (
        <FilterBar
          items={remainingTagOptions}
          value={queryState.tags[0] ?? ''}
          onChange={(value) => updateState({ tags: value ? [value] : [], category: '' })}
          variant="tag"
          includeAll={false}
        />
      )}
      {resultsLabel && <p className="results-summary">{resultsLabel}</p>}

      {session.error && <ErrorState message={session.error} />}
      {clipsQuery.isError && <ErrorState message={(clipsQuery.error as Error).message} />}
      {clipsQuery.isLoading && (
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
