import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { TierCarousel } from '../components/TierCarousel';
import { TierDetailSheet } from '../components/TierDetailSheet';
import { TierGrid } from '../components/TierGrid';
import { applyTelegramTheme } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { useFeaturedTiers, useTierDetail, useTiers } from '../features/tiers/hooks';

export function TasksPage() {
  const session = useTelegramSession();
  const { tierId } = useParams();
  const tiersQuery = useTiers();
  const featuredQuery = useFeaturedTiers();
  const tierDetailQuery = useTierDetail(tierId);

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  return (
    <AppShell>
      {!session.isTelegram && <TelegramDevBanner />}
      <section className="hero">
        <img className="hero__banner" src="/header.png?v=20260401a" alt="Mistress BJQueen Custom Obedience Tasks" />
      </section>

      <section className="tasks-hero">
        <p className="hero__eyebrow">Custom Obedience Tasks</p>
        <h1>Choose the package that fits your pace, intensity, and level of control.</h1>
        <p>
          Each package is designed to give you a clear container for obedience, structure, and escalating control, with payment and fulfilment continuing safely in the bot.
        </p>
      </section>

      {(featuredQuery.isLoading || featuredQuery.data?.items.length) ? (
        <TierCarousel title="✨ Featured Packages" items={featuredQuery.data?.items ?? []} loading={featuredQuery.isLoading} />
      ) : null}

      <section className="tasks-section">
        <div className="tasks-section__header">
          <p className="hero__eyebrow">All Packages</p>
          {tiersQuery.data && <span className="tasks-section__count">{tiersQuery.data.total} available</span>}
        </div>

        {tiersQuery.isLoading && (
          <div className="tier-grid" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="tier-card tier-card--skeleton">
                <span className="top-sellers__line top-sellers__line--small" />
                <span className="top-sellers__line top-sellers__line--title" />
                <span className="top-sellers__line top-sellers__line--title top-sellers__line--short" />
                <span className="top-sellers__line top-sellers__line--body" />
                <span className="top-sellers__line top-sellers__line--body top-sellers__line--short" />
                <span className="top-sellers__line top-sellers__line--price" />
              </div>
            ))}
          </div>
        )}

        {tiersQuery.isError && <ErrorState message={(tiersQuery.error as Error).message} />}
        {!tiersQuery.isLoading && tiersQuery.data && tiersQuery.data.items.length > 0 && <TierGrid items={tiersQuery.data.items} />}
        {!tiersQuery.isLoading && tiersQuery.data && tiersQuery.data.items.length === 0 && (
          <EmptyState title="No packages available" message="Active custom obedience packages will appear here when they are ready." />
        )}
      </section>

      {tierId && <TierDetailSheet tier={tierDetailQuery.data} loading={tierDetailQuery.isLoading} />}
    </AppShell>
  );
}
