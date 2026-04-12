import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType, useParams, useSearchParams } from 'react-router-dom';
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
import { useClipDetail, useClipHashtags, useClipSearchInfinite, useNewClips, useTopSellers } from '../features/clips/hooks';
import { readQueryState, toSearchParams } from '../features/clips/queryState';
import { ClipItem } from '../features/clips/types';
import { pushRecentSearch } from '../utils/storage';
import { composeSearchText, extractHashtagTokens, FEATURED_TAGS, normalizeTag, setHashtagToken, stripHashtagTokens } from '../utils/tags';
import { useCurrencyPreference } from '../hooks/useCurrencyPreference';
import { resolveClipIdHint, stripStartRoutingParams } from '../utils/startRouting';

const CLIPS_FAQ = [
  {
    question: "What’s the difference between streaming and downloading here?",
    answer:
      'Streaming plays the video in the browser and requires an internet connection. Downloading redirects to a signed file download URL so you can watch the video whenever you want offline.',
  },
  {
    question: 'How long is a streaming (watch) link valid?',
    answer: 'A watch link is valid for 24 hours from when it’s created.',
  },
  {
    question: 'How many times can I play a streaming link?',
    answer: 'Each watch link allows up to 3 total playbacks.',
  },
  {
    question: 'How many networks/IPs can use the same watch link?',
    answer: 'A watch link can be used from up to 2 IP addresses total. A 3rd new IP will be blocked.',
  },
  {
    question: 'Can two people watch the same watch link at the same time?',
    answer: 'No, only one active viewer at a time is allowed on a watch link.',
  },
  {
    question: 'If I see “another viewer is currently watching”, what should I do?',
    answer: 'Wait a moment and try again. Sessions auto-release shortly after inactivity, about 45 seconds.',
  },
  {
    question: 'How long is a download link valid before anyone uses it?',
    answer: 'A download link must be opened (redeemed) within 24 hours of creation.',
  },
  {
    question: 'What happens after I open (redeem) a download link the first time?',
    answer:
      'The first successful redeem starts a 60-minute active window. After that window ends, the download link expires.',
  },
  {
    question: 'How many times can a download link be redeemed?',
    answer: 'A download link can be redeemed up to 3 times.',
  },
  {
    question: 'Do retries count against my 3 download redeems?',
    answer:
      'Not if you retry from the same IP within 5 minutes of the last redeem. Those same-IP retries don’t consume another attempt.',
  },
  {
    question: 'Does redeeming again extend the 60-minute download window?',
    answer:
      'No. The 60-minute window starts on the first successful redeem and doesn’t reset on later redeems.',
  },
] as const;

export function BrowsePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clipId } = useParams();
  const session = useTelegramSession();
  const telegramUserId = session.user?.id ?? null;
  const [currency] = useCurrencyPreference(session.ready, telegramUserId);
  const urlQueryState = useMemo(() => readQueryState(searchParams), [searchParams]);
  const [searchValue, setSearchValue] = useState(() => {
    return composeSearchText(urlQueryState.q, urlQueryState.tags);
  });
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchPanelSentinelRef = useRef<HTMLDivElement | null>(null);
  const searchPanelRef = useRef<HTMLElement | null>(null);
  const [isSearchPinned, setIsSearchPinned] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [showFaq, setShowFaq] = useState(false);
  const [openFaqQuestion, setOpenFaqQuestion] = useState<string | null>(null);
  const [clipPaymentResume, setClipPaymentResume] = useState<{
    invoiceId: string;
    payment: 'watch' | 'download';
  } | null>(null);
  const clipResumeHandledKeyRef = useRef<string>('');
  const prevClipIdForResumeRef = useRef<string | undefined>(undefined);
  const pinnedSearchText = (location.state as { searchText?: string } | null)?.searchText ?? '';
  const searchText = useMemo(() => stripHashtagTokens(searchValue), [searchValue]);
  const searchTags = useMemo(() => extractHashtagTokens(searchValue), [searchValue]);
  const clipSearchFilters = useMemo(
    () => ({
      q: searchText,
      category: urlQueryState.category,
      tags: searchTags,
      sort: urlQueryState.sort,
      currency,
    }),
    [currency, searchTags, searchText, urlQueryState.category, urlQueryState.sort],
  );
  useLayoutEffect(() => {
    if (!clipId) return;
    const inv = searchParams.get('invoice_id') || searchParams.get('invoiceId');
    const pay = searchParams.get('payment');
    if (!inv?.trim() || (pay !== 'watch' && pay !== 'download')) return;
    const handleKey = `${clipId}:${searchParams.toString()}`;
    if (clipResumeHandledKeyRef.current === handleKey) return;
    clipResumeHandledKeyRef.current = handleKey;
    setClipPaymentResume({ invoiceId: inv.trim(), payment: pay });
    const next = new URLSearchParams(searchParams);
    next.delete('invoice_id');
    next.delete('invoiceId');
    next.delete('payment');
    const qs = next.toString();
    navigate(`/clips/${encodeURIComponent(clipId)}${qs ? `?${qs}` : ''}`, { replace: true });
  }, [clipId, navigate, searchParams]);

  useEffect(() => {
    if (prevClipIdForResumeRef.current !== undefined && prevClipIdForResumeRef.current !== clipId) {
      setClipPaymentResume(null);
      clipResumeHandledKeyRef.current = '';
    }
    prevClipIdForResumeRef.current = clipId;
  }, [clipId]);

  const clipsQuery = useClipSearchInfinite(clipSearchFilters);
  const visibleClips = useMemo(() => {
    const pages = clipsQuery.data?.pages ?? [];
    const seen = new Set<string>();
    const out: ClipItem[] = [];
    for (const page of pages) {
      for (const item of page.items) {
        if (seen.has(item.id)) {
          continue;
        }
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  }, [clipsQuery.data?.pages]);
  const firstSearchPage = clipsQuery.data?.pages?.[0];
  const queryState = useMemo(
    () => ({
      ...clipSearchFilters,
      page: 1,
    }),
    [clipSearchFilters],
  );
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
  const didSeedClipHistoryRef = useRef(false);
  const pendingClipOpenRef = useRef<string>('');
  /** After we've shown the Telegram start_param clip once, do not auto-open it again when the user returns to /clips (start_param stays set for the whole session). */
  const startParamClipConsumedRef = useRef(false);
  const prevClipIdForStartParamRef = useRef<string | undefined>();
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
    () =>
      `${clipSearchFilters.q}::${clipSearchFilters.category}::${clipSearchFilters.sort}::${clipSearchFilters.tags.join(',')}`,
    [clipSearchFilters.category, clipSearchFilters.q, clipSearchFilters.sort, clipSearchFilters.tags],
  );
  const lastTrackedSearchPageRef = useRef(0);

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  useEffect(() => {
    const hint = resolveClipIdHint('', session.startParam);
    if (clipId && hint && clipId === hint) {
      startParamClipConsumedRef.current = true;
    }
  }, [clipId, session.startParam]);

  useEffect(() => {
    const prev = prevClipIdForStartParamRef.current;
    if (prev && !clipId && navigationType !== 'REPLACE') {
      const hint = resolveClipIdHint(location.search, session.startParam);
      if (hint && hint === prev) {
        startParamClipConsumedRef.current = true;
      }
    }
    prevClipIdForStartParamRef.current = clipId;
  }, [clipId, location.search, navigationType, session.startParam]);

  useEffect(() => {
    if (!clipId || didSeedClipHistoryRef.current) {
      return;
    }
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0 && window.history.length > 1) {
      return;
    }

    didSeedClipHistoryRef.current = true;
    pendingClipOpenRef.current = clipId;
    const cleanedSearch = stripStartRoutingParams(location.search);
    const listPath = `/clips${cleanedSearch ? `?${cleanedSearch}` : ''}`;
    navigate(listPath, { replace: true });
  }, [clipId, location.search, navigate, navigationType]);

  useEffect(() => {
    const pendingClipId = pendingClipOpenRef.current;
    if (!pendingClipId || clipId) {
      return;
    }
    if (!clipsQuery.isFetched || clipsQuery.isLoading) {
      return;
    }

    pendingClipOpenRef.current = '';
    const cleanedSearch = stripStartRoutingParams(location.search);
    const suffix = cleanedSearch ? `?${cleanedSearch}` : '';
    navigate(`/clips/${encodeURIComponent(pendingClipId)}${suffix}`, { replace: false });
  }, [clipId, clipsQuery.isFetched, clipsQuery.isLoading, location.search, navigate]);

  useEffect(() => {
    if (clipId) {
      return;
    }
    if (startParamClipConsumedRef.current) {
      return;
    }
    const hintedClipId = resolveClipIdHint(location.search, session.startParam);
    if (!hintedClipId) {
      return;
    }
    const cleanedSearch = stripStartRoutingParams(location.search);
    const suffix = cleanedSearch ? `?${cleanedSearch}` : '';
    navigate(`/clips/${encodeURIComponent(hintedClipId)}${suffix}`, { replace: true });
  }, [clipId, location.search, navigate, session.startParam]);

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
    lastTrackedSearchPageRef.current = 0;
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
      setSearchParams(toSearchParams(next));
      if (searchValue.trim()) {
        pushRecentSearch(searchValue);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchValue, setSearchParams, urlQueryState]);

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
    const pages = clipsQuery.data?.pages;
    if (!pages?.length || clipsQuery.isFetchingNextPage) {
      return;
    }

    const n = pages.length;
    if (n <= lastTrackedSearchPageRef.current) {
      return;
    }
    lastTrackedSearchPageRef.current = n;
    const last = pages[n - 1];
    const totalCount = pages[0].total;
    const listViewKey = `search_results:${queryIdentity}:${n}:${last.items.length}:${totalCount}`;
    if (!trackedListViewKeysRef.current.has(listViewKey)) {
      trackedListViewKeysRef.current.add(listViewKey);
      trackClipListView({
        listType: 'search_results',
        itemCount: last.items.length,
        totalCount,
        page: n,
        query: queryState.q,
        tags: queryState.tags,
      });
    }

    if (!queryState.q && queryState.tags.length === 0) {
      return;
    }

    if (n !== 1) {
      return;
    }

    const searchKey = `${queryIdentity}:${totalCount}`;
    if (trackedSearchKeysRef.current.has(searchKey)) {
      return;
    }
    trackedSearchKeysRef.current.add(searchKey);
    trackClipSearch({
      query: queryState.q,
      tags: queryState.tags,
      resultCount: totalCount,
    });
  }, [clipsQuery.data?.pages, clipsQuery.isFetchingNextPage, queryIdentity, queryState.q, queryState.tags]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !clipsQuery.hasNextPage || clipsQuery.isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          void clipsQuery.fetchNextPage();
        }
      },
      { rootMargin: '220px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [clipsQuery.fetchNextPage, clipsQuery.hasNextPage, clipsQuery.isFetchingNextPage]);

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
        searchPanelRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
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
  const showResultsLoading = visibleClips.length === 0 && clipsQuery.isLoading;
  const resultsTotal = firstSearchPage?.total ?? 0;
  const resultsCountLabel =
    firstSearchPage && resultsTotal > 0 ? `${resultsTotal} result${resultsTotal === 1 ? '' : 's'}` : '';

  return (
    <AppShell>
      <CurrencyToggleBanner
        showBackButton
        syncWithServer={session.ready}
        telegramUserId={telegramUserId}
        isTelegramSession={session.isTelegram}
        onBackClick={() => navigate('/', { replace: true, state: { bypassHomeRedirect: true } })}
      />
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

      <section className={`tasks-panel tasks-panel--faq clips-faq${showFaq ? ' clips-faq--open' : ''}`}>
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">FAQ</p>
          <h2>Questions before purchase?</h2>
          <button
            type="button"
            className="clips-faq__toggle"
            aria-expanded={showFaq}
            onClick={() => {
              setShowFaq((current) => {
                const next = !current;
                if (!next) {
                  setOpenFaqQuestion(null);
                }
                return next;
              });
            }}
          >
            {showFaq ? 'Hide FAQ' : 'Show FAQ'}
          </button>
        </div>
        <div className="clips-faq__body" aria-hidden={!showFaq}>
          <div className="clips-faq__body-inner">
            <div className="faq-list">
              {CLIPS_FAQ.map((item) => (
                <details key={item.question} className="faq-card" open={openFaqQuestion === item.question}>
                  <summary
                    onClick={(event) => {
                      event.preventDefault();
                      setOpenFaqQuestion((current) => (current === item.question ? null : item.question));
                    }}
                  >
                    <span className="faq-card__summary">
                      <span className="faq-card__icon" aria-hidden="true">
                        ❔
                      </span>
                      <span className="faq-card__text">{item.question}</span>
                      <span className="faq-card__chevron" aria-hidden="true" />
                    </span>
                  </summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

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

        {!showResultsLoading && firstSearchPage && resultsCountLabel && (
          <p className="results-summary results-summary--inside">{resultsCountLabel}</p>
        )}
      </section>

      {clipsQuery.isError && <ErrorState message={(clipsQuery.error as Error).message} />}
      {showResultsLoading && (
        <div className="results-loading" aria-live="polite" aria-busy="true">
          <span className="results-loading__spinner" aria-hidden="true" />
          <span>Loading clips...</span>
        </div>
      )}
      {!showResultsLoading && visibleClips.length > 0 && <ClipGrid items={visibleClips} currency={currency} />}
      {clipsQuery.isFetched && !clipsQuery.isLoading && !clipsQuery.isError && visibleClips.length === 0 && (
        <EmptyState />
      )}

      {clipsQuery.hasNextPage ? (
        <div ref={loadMoreRef} className="load-more load-more--passive">
          {visibleClips.length > 0 && clipsQuery.isFetchingNextPage ? (
            <>
              <span className="load-more__spinner" aria-hidden="true" />
              <span>Loading more...</span>
            </>
          ) : (
            ''
          )}
        </div>
      ) : null}

      {clipId && (
        <ClipDetailSheet
          clip={clipDetailQuery.data}
          loading={clipDetailQuery.isLoading}
          errorMessage={clipDetailQuery.isError ? (clipDetailQuery.error as Error).message : null}
          currency={currency}
          clipPaymentResume={clipPaymentResume}
          onClipPaymentResumeConsumed={() => setClipPaymentResume(null)}
        />
      )}
    </AppShell>
  );
}
