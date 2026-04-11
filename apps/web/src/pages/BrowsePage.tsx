import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { ClipGrid } from '../components/ClipGrid';
import { ClipDetailSheet } from '../components/ClipDetailSheet';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { CurrencyToggleBanner } from '../components/CurrencyToggleBanner';
import { TopSellersCarousel } from '../components/TopSellersCarousel';
import { setAnalyticsContext } from '../app/analytics';
import { applyTelegramTheme } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import {
  trackClipListView,
  trackClipSearch,
  trackClipTagSelect,
  trackMiniAppOpenAttributed,
} from '../features/clips/analytics';
import { useClipDetail, useClipHashtags, useClipSearch, useNewClips, useTopSellers } from '../features/clips/hooks';
import { readQueryState, toSearchParams } from '../features/clips/queryState';
import { ClipItem } from '../features/clips/types';
import { pushRecentSearch } from '../utils/storage';
import { composeSearchText, extractHashtagTokens, FEATURED_TAGS, normalizeTag, setHashtagToken, stripHashtagTokens } from '../utils/tags';
import { useCurrencyPreference } from '../hooks/useCurrencyPreference';

export function BrowsePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clipId } = useParams();
  const session = useTelegramSession();
  const [currency] = useCurrencyPreference();
  const urlQueryState = useMemo(() => readQueryState(searchParams), [searchParams]);
  const [searchValue, setSearchValue] = useState(() => {
    return composeSearchText(urlQueryState.q, urlQueryState.tags);
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchPanelSentinelRef = useRef<HTMLDivElement | null>(null);
  const searchPanelRef = useRef<HTMLElement | null>(null);
  const [page, setPage] = useState(1);
  const [isSearchPinned, setIsSearchPinned] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [visibleClips, setVisibleClips] = useState<ClipItem[]>([]);
  const pinnedSearchText = (location.state as { searchText?: string } | null)?.searchText ?? '';
  const searchText = useMemo(() => stripHashtagTokens(searchValue), [searchValue]);
  const searchTags = useMemo(() => extractHashtagTokens(searchValue), [searchValue]);
  const queryState = useMemo(
    () => ({
      q: searchText,
      category: urlQueryState.category,
      tags: searchTags,
      sort: urlQueryState.sort,
      page,
      currency,
    }),
    [currency, page, searchTags, searchText, urlQueryState.category, urlQueryState.sort],
  );
  const activeQueryState = queryState;
  const clipsQuery = useClipSearch(activeQueryState);
  const clipHashtagsQuery = useClipHashtags();
  const newClipsQuery = useNewClips(currency);
  const topSellersQuery = useTopSellers(currency);
  const clipDetailQuery = useClipDetail(clipId, currency);
  const featuredTagSet = useMemo(() => new Set(FEATURED_TAGS.map((tag) => normalizeTag(tag))), []);
  const searchTokens = useMemo(() => extractHashtagTokens(searchValue), [searchValue]);
  const lastSecondaryContextRef = useRef('');
  const [secondaryTagOptions, setSecondaryTagOptions] = useState<string[]>([]);
  const selectedFeaturedTag = useMemo(
    () => searchTokens.find((tag) => featuredTagSet.has(normalizeTag(tag))) ?? '',
    [featuredTagSet, searchTokens],
  );
  const selectedSecondaryTag = useMemo(
    () => searchTokens.find((tag) => !featuredTagSet.has(normalizeTag(tag))) ?? '',
    [featuredTagSet, searchTokens],
  );
  const trackedListViewKeysRef = useRef(new Set<string>());
  const trackedSearchKeysRef = useRef(new Set<string>());
  const didTrackOpenRef = useRef(false);
  const computedSecondaryTagOptions = useMemo(() => {
    const excluded = new Set(['and', 'in', 'made', 'bar']);
    const tagCounts = new Map<string, { tag: string; count: number }>();

    for (const item of visibleClips) {
      const seenInClip = new Set<string>();
      for (const rawTag of item.tags) {
        const tag = rawTag.trim();
        const normalized = normalizeTag(tag);
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
    () => `${stripHashtagTokens(searchValue).toLowerCase()}::${normalizeTag(selectedFeaturedTag)}`,
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
    setAnalyticsContext({
      enabled: session.ready && !session.error,
      isTelegram: session.isTelegram,
      startParam: session.startParam,
    });
  }, [session.error, session.isTelegram, session.ready, session.startParam]);

  useEffect(() => {
    if (didTrackOpenRef.current) {
      return;
    }
    didTrackOpenRef.current = true;
    trackMiniAppOpenAttributed({
      startParam: session.startParam,
      isTelegram: session.isTelegram,
      entryPath: `${location.pathname}${location.search}`,
    });
  }, [location.pathname, location.search, session.isTelegram, session.startParam]);

  useEffect(() => {
    setPage(1);
    setVisibleClips([]);
  }, [queryIdentity]);

  useEffect(() => {
    if (clipId || !pinnedSearchText || pinnedSearchText === searchValue) {
      return;
    }

    setSearchValue(pinnedSearchText);
  }, [clipId, pinnedSearchText, searchValue]);

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
        ...urlQueryState,
        q: stripHashtagTokens(searchValue),
        page: 1,
      };
      setPage(1);
      setSearchParams(toSearchParams(next));
      if (searchValue.trim()) {
        pushRecentSearch(searchValue);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchValue, setSearchParams, urlQueryState]);

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
    if (newClipsQuery.isFetching || !newClipsQuery.data?.items.length) {
      return;
    }

    const key = `new_clips:${newClipsQuery.data.items.length}`;
    if (trackedListViewKeysRef.current.has(key)) {
      return;
    }
    trackedListViewKeysRef.current.add(key);
    trackClipListView({
      listType: 'new_clips',
      itemCount: newClipsQuery.data.items.length,
    });
  }, [newClipsQuery.data, newClipsQuery.isFetching]);

  useEffect(() => {
    if (topSellersQuery.isFetching || !topSellersQuery.data?.items.length) {
      return;
    }

    const key = `top_sellers:${topSellersQuery.data.items.length}`;
    if (trackedListViewKeysRef.current.has(key)) {
      return;
    }
    trackedListViewKeysRef.current.add(key);
    trackClipListView({
      listType: 'top_sellers',
      itemCount: topSellersQuery.data.items.length,
    });
  }, [topSellersQuery.data, topSellersQuery.isFetching]);

  useEffect(() => {
    if (!clipsQuery.data || clipsQuery.isFetching || clipsQuery.data.page !== page) {
      return;
    }

    const listViewKey = `search_results:${queryIdentity}:${page}:${clipsQuery.data.items.length}:${clipsQuery.data.total}`;
    if (!trackedListViewKeysRef.current.has(listViewKey)) {
      trackedListViewKeysRef.current.add(listViewKey);
      trackClipListView({
        listType: 'search_results',
        itemCount: clipsQuery.data.items.length,
        totalCount: clipsQuery.data.total,
        page,
        query: queryState.q,
        tags: queryState.tags,
      });
    }

    if (!queryState.q && queryState.tags.length === 0) {
      return;
    }

    const searchKey = `${queryIdentity}:${clipsQuery.data.total}`;
    if (trackedSearchKeysRef.current.has(searchKey)) {
      return;
    }
    trackedSearchKeysRef.current.add(searchKey);
    trackClipSearch({
      query: queryState.q,
      tags: queryState.tags,
      resultCount: clipsQuery.data.total,
    });
  }, [clipsQuery.data, clipsQuery.isFetching, page, queryIdentity, queryState.q, queryState.tags]);

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

  useEffect(() => {
    const state = location.state as { pinSearchPanel?: boolean } | null;
    if (clipId || !state?.pinSearchPanel) {
      return;
    }

    let frameTwo = 0;
    const frameOne = window.requestAnimationFrame(() => {
      setIsSearchPinned(true);
      setFiltersExpanded(false);
      frameTwo = window.requestAnimationFrame(() => {
        searchPanelSentinelRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
        navigate(`${location.pathname}${location.search}`, { replace: true });
      });
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
    };
  }, [clipId, location.pathname, location.search, location.state, navigate]);

  const replaceRowTag = (current: string, selectedTag: string, nextTag: string) => {
    const withoutSelected = selectedTag ? setHashtagToken(current, selectedTag, false) : current;
    return nextTag ? setHashtagToken(withoutSelected, nextTag, true) : withoutSelected;
  };

  const updateFeaturedTag = (value: string) => {
    if (value) {
      trackClipTagSelect({ tag: value, source: 'featured_filter' });
    }
    setSearchValue((current) => replaceRowTag(current, selectedFeaturedTag, value));
  };
  const updateSecondaryTag = (value: string) => {
    if (value) {
      trackClipTagSelect({ tag: value, source: 'secondary_filter' });
    }
    setSearchValue((current) => replaceRowTag(current, selectedSecondaryTag, value));
  };
  const showResultsLoading = visibleClips.length === 0 && (clipsQuery.isLoading || (clipsQuery.isFetching && page === 1));
  const resultsCountLabel = clipsQuery.data
    ? `${clipsQuery.data.total} result${clipsQuery.data.total === 1 ? '' : 's'}`
    : '';

  return (
    <AppShell>
      <CurrencyToggleBanner />
      <section className="hero">
        <img
          className="hero__banner"
          src="/header-clipstore.jpeg?v=20260409a"
          alt="Mistress BJQueen Clip Store banner"
        />
      </section>

      {(newClipsQuery.isLoading || newClipsQuery.data?.items?.length) ? (
        <TopSellersCarousel
          items={newClipsQuery.data?.items ?? []}
          title="🆕 New Clips"
          loading={newClipsQuery.isLoading}
          listType="new_clips"
          currency={currency}
        />
      ) : null}
      {(topSellersQuery.isLoading || topSellersQuery.data?.items?.length) ? (
        <TopSellersCarousel
          items={topSellersQuery.data?.items ?? []}
          loading={topSellersQuery.isLoading}
          listType="top_sellers"
          currency={currency}
        />
      ) : null}

      <div ref={searchPanelSentinelRef} className="search-panel__sentinel" aria-hidden="true" />
      <section
        ref={searchPanelRef}
        className={`search-panel${isSearchPinned ? ' search-panel--pinned' : ''}${isSearchPinned && !filtersExpanded ? ' search-panel--collapsed' : ''}`}
      >
        <section className="toolbar">
          <div className="toolbar__search">
            <div className="toolbar__header">
              <p className="toolbar__eyebrow">🔎 Search Clips</p>
              {isSearchPinned && (
                <button
                  className="search-panel__toggle"
                  type="button"
                  onClick={() => setFiltersExpanded((current) => !current)}
                  aria-expanded={filtersExpanded}
                >
                  {filtersExpanded ? '▴ Hide hashtags' : '▾ Show hashtags'}
                </button>
              )}
            </div>
            <SearchBar value={searchValue} onChange={setSearchValue} hashtagOptions={clipHashtagsQuery.data?.items ?? []} />
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

        {!showResultsLoading && clipsQuery.data && <p className="results-summary results-summary--inside">{resultsCountLabel}</p>}
      </section>

      {clipsQuery.isError && <ErrorState message={(clipsQuery.error as Error).message} />}
      {showResultsLoading && (
        <div className="results-loading" aria-live="polite" aria-busy="true">
          <span className="results-loading__spinner" aria-hidden="true" />
          <span>Loading clips...</span>
        </div>
      )}
      {!showResultsLoading && visibleClips.length > 0 && <ClipGrid items={visibleClips} currency={currency} />}
      {clipsQuery.data && !clipsQuery.isLoading && !clipsQuery.isFetching && visibleClips.length === 0 && <EmptyState />}

      {clipsQuery.data?.hasMore && (
        <div ref={loadMoreRef} className="load-more load-more--passive">
          {visibleClips.length > 0 && page > 1 && clipsQuery.isFetching ? (
            <>
              <span className="load-more__spinner" aria-hidden="true" />
              <span>Loading more...</span>
            </>
          ) : (
            ''
          )}
        </div>
      )}

      {clipId && (
        <ClipDetailSheet
          clip={clipDetailQuery.data}
          loading={clipDetailQuery.isLoading}
          currency={currency}
        />
      )}
    </AppShell>
  );
}
