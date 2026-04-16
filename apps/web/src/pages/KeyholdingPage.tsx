import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { CurrencyToggleBanner } from '../components/CurrencyToggleBanner';
import { ErrorState } from '../components/ErrorState';
import { applyTelegramTheme } from '../app/telegram';
import { setAnalyticsContext, trackPremiumEvent } from '../app/analytics';
import { useTelegramSession } from '../features/auth/hooks';
import { useKeyholdingOptions, useKeyholdingTiers } from '../features/keyholding/hooks';
import { useCurrencyPreference } from '../hooks/useCurrencyPreference';
import { buildKeyholdingApplyUrl } from '../utils/ga4Attribution';
import './keyholding/keyholding.css';
import { KeyholdingHero } from './keyholding/KeyholdingHero';
import { KeyholdingWhatIs } from './keyholding/KeyholdingWhatIs';
import { KeyholdingWhyDifferent } from './keyholding/KeyholdingWhyDifferent';
import { KeyholdingHowItWorks } from './keyholding/KeyholdingHowItWorks';
import { KeyholdingTierFinder } from './keyholding/KeyholdingTierFinder';
import { KeyholdingWhoItsFor } from './keyholding/KeyholdingWhoItsFor';
import { KeyholdingTierGrid } from './keyholding/KeyholdingTierGrid';
import { KeyholdingSampleWeek } from './keyholding/KeyholdingSampleWeek';
import { KeyholdingControlMethods } from './keyholding/KeyholdingControlMethods';
import { KeyholdingFaq } from './keyholding/KeyholdingFaq';
import { KeyholdingFinalCta } from './keyholding/KeyholdingFinalCta';
import { KeyholdingStickyCta } from './keyholding/KeyholdingStickyCta';

export function KeyholdingPage() {
  const session = useTelegramSession();
  const navigate = useNavigate();
  const telegramUserId = session.user?.id ?? null;
  const [currency] = useCurrencyPreference(session.ready, telegramUserId);
  const tiersQuery = useKeyholdingTiers(currency);
  const optionsQuery = useKeyholdingOptions(currency);
  const keyholdingPageViewSentRef = useRef(false);
  const [stickyVisible, setStickyVisible] = useState(true);

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
    if (!session.ready || session.error || keyholdingPageViewSentRef.current) return;
    keyholdingPageViewSentRef.current = true;
    trackPremiumEvent({
      state: 'keyholding_page_viewed',
      screen: 'keyholding',
      flowId: 'keyholding',
    });
  }, [session.error, session.ready]);

  useEffect(() => {
    const el = document.getElementById('kh-final-cta');
    if (!el || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const mq = window.matchMedia('(min-width: 720px)');
    if (mq.matches) {
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        setStickyVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '0px 0px 80px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleApplyClick = useCallback(() => {
    const destination = buildKeyholdingApplyUrl();
    trackPremiumEvent({
      state: 'keyholding_apply_redirect',
      screen: 'keyholding',
      flowId: 'keyholding',
      properties: { destination },
    });
    window.location.href = destination;
  }, []);

  const scrollToTiers = useCallback(() => {
    document.getElementById('tiers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const tierItems = tiersQuery.data?.items ?? [];

  return (
    <AppShell>
      <CurrencyToggleBanner
        showBackButton
        syncWithServer={session.ready}
        telegramUserId={telegramUserId}
        isTelegramSession={session.isTelegram}
        onBackClick={() => navigate('/', { replace: true, state: { bypassHomeRedirect: true } })}
      />

      <main className="kh-page">
        <KeyholdingHero onApply={handleApplyClick} />
        <KeyholdingWhatIs />
        <KeyholdingWhyDifferent />
        <KeyholdingHowItWorks />
        <KeyholdingTierFinder onJumpToTiers={scrollToTiers} />
        <KeyholdingWhoItsFor />

        <KeyholdingTierGrid
          items={tierItems}
          loading={tiersQuery.isLoading}
          isError={tiersQuery.isError}
          errorMessage={tiersQuery.isError ? (tiersQuery.error as Error).message : undefined}
          currency={currency}
          onApply={handleApplyClick}
        />

        <KeyholdingSampleWeek />

        {optionsQuery.isError && <ErrorState message={(optionsQuery.error as Error).message} />}
        {!optionsQuery.isError && (
          <KeyholdingControlMethods
            options={optionsQuery.data?.items ?? []}
            loading={optionsQuery.isLoading}
          />
        )}

        <KeyholdingFaq />
        <KeyholdingFinalCta onApply={handleApplyClick} />
      </main>

      <KeyholdingStickyCta visible={stickyVisible} onApply={handleApplyClick} />
    </AppShell>
  );
}
