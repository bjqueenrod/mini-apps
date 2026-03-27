import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { ClipGrid } from '../components/ClipGrid';
import { ClipDetailSheet } from '../components/ClipDetailSheet';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { TopSellersCarousel } from '../components/TopSellersCarousel';
import { applyTelegramTheme } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { useClipDetail, useClipSearch, useNewClips, useTopSellers } from '../features/clips/hooks';
import { readQueryState, toSearchParams } from '../features/clips/queryState';
import { ClipItem } from '../features/clips/types';
import { pushRecentSearch } from '../utils/storage';
import { composeSearchText, extractHashtagTokens, FEATURED_TAGS, setHashtagToken, stripHashtagTokens } from '../utils/tags';

export function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { clipId } = useParams();
  const session = useTelegramSession();
  const [searchValue, setSearchValue] = useState(() => {
    const initialQueryState = readQueryState(searchParams);
    return composeSearchText(initialQueryState.q, initialQueryState.tags);
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchPanelSentinelRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const [isSearchPinned, setIsSearchPinned] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [visibleClips, setVisibleClips] = useState<ClipItem[]>([]);
  const queryState = useMemo(() => readQueryState(searchParams), [searchParams]);
  const activeQueryState = useMemo(() => ({ ...queryState, page }), [page, queryState]);
  const clipsQuery = useClipSearch(activeQueryState);
  const newClipsQuery = useNewClips();
  const topSellersQuery = useTopSellers();
  const clipDetailQuery = useClipDetail(clipId);
  const featuredTagSet = useMemo(() => new Set(FEATURED_TAGS.map((tag) => tag.toLowerCase())), []);
  const searchTokens = useMemo(() => extractHashtagTokens(searchValue), [searchValue]);
  const lastSecondaryContextRef = useRef('');
  const [secondaryTagOptions, setSecondaryTagOptions] = useState<string[]>([]);
  const selectedFeaturedTag = useMemo(
    () => searchTokens.find((tag) => featuredTagSet.has(tag.toLowerCase())) ?? '',
    [featuredTagSet, searchTokens],
  );
  const selectedSecondaryTag = useMemo(
    () => searchTokens.find((tag) => !featuredTagSet.has(tag.toLowerCase())) ?? '',
    [featuredTagSet, searchTokens],
  );
  const computedSecondaryTagOptions = useMemo(() => {
    const excluded = new Set(['and', 'in', 'made', 'bar']);
    const tagCounts = new Map<string, { tag: string; count: number }>();

    for (const item of visibleClips) {
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
  }, [featuredTagSet, visibleClips]);
  const secondaryTagContextKey = useMemo(
    () => `${stripHashtagTokens(searchValue).toLowerCase()}::${selectedFeaturedTag.toLowerCase()}`,
    [searchValue, selectedFeaturedTag],
  );
  const queryIdentity = useMemo(
    () => `${queryState.q}::${queryState.category}::${queryState.sort}::${queryState.tags.join(',')}`,
    [queryState.category, queryState.q, queryState.sort, queryState.tags],
  );

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  useEffect(() => {
    setPage(1);
    setVisibleClips([]);
  }, [queryIdentity]);

  useEffect(() => {
    setSearchValue(composeSearchText(queryState.q, queryState.tags));
  }, [queryState.q, queryState.tags]);

  useEffect(() => {
    const normalize = (value: string) => value.trim().toLowerCase();
    const dedupe = (items: string[]) => {
      const deduped: string[] = [];
      const seen = new Set<string>();
      for (const value of items) {
        const tag = value.trim();
        const normalized = normalize(tag);
        if (!tag || seen.has(normalized) || featuredTagSet.has(normalized)) {
          continue;
        }
        seen.add(normalized);
        deduped.push(tag);
      }
      return deduped.slice(0, 30);
    };

    const contextChanged = lastSecondaryContextRef.current !== secondaryTagContextKey;
    lastSecondaryContextRef.current = secondaryTagContextKey;

    if (selectedSecondaryTag && computedSecondaryTagOptions.length === 0) {
      return;
    }

    if (contextChanged || !selectedSecondaryTag) {
      setSecondaryTagOptions(dedupe(computedSecondaryTagOptions));
      return;
    }

    setSecondaryTagOptions((current) => {
      const currentByTag = new Map(current.map((tag) => [normalize(tag), tag]));
      const nextByTag = new Map(computedSecondaryTagOptions.map((tag) => [normalize(tag), tag]));
      const stable = current
        .filter((tag) => nextByTag.has(normalize(tag)))
        .map((tag) => nextByTag.get(normalize(tag)) ?? currentByTag.get(normalize(tag)) ?? tag);
      const additions = computedSecondaryTagOptions.filter((tag) => !currentByTag.has(normalize(tag)));
      return dedupe([...stable, ...additions]);
    });
  }, [computedSecondaryTagOptions, featuredTagSet, secondaryTagContextKey, selectedSecondaryTag]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = {
        ...queryState,
        q: stripHashtagTokens(searchValue),
        tags: extractHashtagTokens(searchValue),
        page: 1,
      };
      setPage(1);
      setSearchParams(toSearchParams(next));
      if (searchValue.trim()) {
        pushRecentSearch(searchValue);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    if (!clipsQuery.data || clipsQuery.data.page !== page) {
      return;
    }

    setVisibleClips((current) => {
      if (page === 1) {
        return clipsQuery.data?.items ?? [];
      }
      const seen = new Set(current.map((item) => item.id));
      const nextItems = (clipsQuery.data?.items ?? []).filter((item) => !seen.has(item.id));
      return nextItems.length ? [...current, ...nextItems] : current;
    });
  }, [clipsQuery.data, page]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !clipsQuery.data?.hasMore || clipsQuery.isFetching) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setPage((current) => current + 1);
        }
      },
      { rootMargin: '220px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [clipsQuery.data?.hasMore, clipsQuery.isFetching]);

  useEffect(() => {
    const node = searchPanelSentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsSearchPinned(!entry?.isIntersecting);
      },
      { rootMargin: '-8px 0px 0px 0px', threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setFiltersExpanded(!isSearchPinned);
  }, [isSearchPinned]);

  const replaceRowTag = (current: string, selectedTag: string, nextTag: string) => {
    const withoutSelected = selectedTag ? setHashtagToken(current, selectedTag, false) : current;
    return nextTag ? setHashtagToken(withoutSelected, nextTag, true) : withoutSelected;
  };

  const updateFeaturedTag = (value: string) => {
    setSearchValue((current) => replaceRowTag(current, selectedFeaturedTag, value));
  };
  const updateSecondaryTag = (value: string) => {
    setSearchValue((current) => replaceRowTag(current, selectedSecondaryTag, value));
  };
  const showResultsLoading = visibleClips.length === 0 && (clipsQuery.isLoading || (clipsQuery.isFetching && page === 1));
  const resultsCountLabel = clipsQuery.data
    ? `${clipsQuery.data.total} result${clipsQuery.data.total === 1 ? '' : 's'}`
    : '';

  return (
    <AppShell>
      {!session.isTelegram && <TelegramDevBanner />}
      <section className="hero">
        <img className="hero__banner" src="/header.png?v=20260327a" alt="Mistress BJQueen Clip Store" />
      </section>

      {(newClipsQuery.isLoading || newClipsQuery.data?.items?.length) ? (
        <TopSellersCarousel items={newClipsQuery.data?.items ?? []} title="🆕 New Clips" loading={newClipsQuery.isLoading} />
      ) : null}
      {(topSellersQuery.isLoading || topSellersQuery.data?.items?.length) ? (
        <TopSellersCarousel items={topSellersQuery.data?.items ?? []} loading={topSellersQuery.isLoading} />
      ) : null}

      <div ref={searchPanelSentinelRef} className="search-panel__sentinel" aria-hidden="true" />
      <section className={`search-panel${isSearchPinned ? ' search-panel--pinned' : ''}`}>
        <section className="toolbar">
          <div className="toolbar__search">
            <p className="toolbar__eyebrow">🔎 Search Clips</p>
            <SearchBar value={searchValue} onChange={setSearchValue} />
            {isSearchPinned && (
              <button
                className="search-panel__toggle"
                type="button"
                onClick={() => setFiltersExpanded((current) => !current)}
                aria-expanded={filtersExpanded}
              >
                {filtersExpanded ? 'Hide hashtags' : 'Show hashtags'}
              </button>
            )}
          </div>
        </section>

        {filtersExpanded && (
          <>
            <FilterBar
              items={FEATURED_TAGS}
              value={selectedFeaturedTag}
              onChange={updateFeaturedTag}
              variant="tag"
            />
            {secondaryTagOptions.length > 0 && (
              <FilterBar
                items={secondaryTagOptions}
                value={selectedSecondaryTag}
                onChange={updateSecondaryTag}
                variant="tag"
                includeAll={false}
              />
            )}
          </>
        )}
      </section>

      {!showResultsLoading && clipsQuery.data && <p className="results-summary">{resultsCountLabel}</p>}
      {clipsQuery.isError && <ErrorState message={(clipsQuery.error as Error).message} />}
      {showResultsLoading && (
        <div className="results-loading" aria-live="polite" aria-busy="true">
          <span className="results-loading__spinner" aria-hidden="true" />
          <span>Loading clips...</span>
        </div>
      )}
      {!showResultsLoading && visibleClips.length > 0 && <ClipGrid items={visibleClips} />}
      {clipsQuery.data && !clipsQuery.isLoading && !clipsQuery.isFetching && visibleClips.length === 0 && <EmptyState />}

      {clipsQuery.data?.hasMore && visibleClips.length > 0 && page > 1 && (
        <div ref={loadMoreRef} className="load-more load-more--passive">
          {clipsQuery.isFetching ? 'Loading more...' : ''}
        </div>
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
