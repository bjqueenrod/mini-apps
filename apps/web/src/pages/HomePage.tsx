import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { applyTelegramTheme } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { useEffect } from 'react';

function resolveStartParamTarget(startParam?: string): '/clips' | '/tasks' {
  const normalized = startParam?.trim().toLowerCase();
  if (!normalized) {
    return '/clips';
  }

  if (normalized === 'clips' || normalized.startsWith('stream_') || normalized.startsWith('download_')) {
    return '/clips';
  }

  if (
    normalized === 'tasks' ||
    normalized.startsWith('buy_') ||
    normalized.includes('__tier_') ||
    normalized.includes('__tierid_') ||
    normalized.includes('__tier-id_')
  ) {
    return '/tasks';
  }

  return '/clips';
}

export function HomePage() {
  const navigate = useNavigate();
  const session = useTelegramSession();
  const redirectTarget = resolveStartParamTarget(session.startParam);

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  useEffect(() => {
    navigate(redirectTarget, { replace: true });
  }, [navigate, redirectTarget]);

  return (
    <AppShell>
      {!session.isTelegram && <TelegramDevBanner />}
      <section className="hero">
        <img className="hero__banner" src="/header.png?v=20260401a" alt="Mistress BJQueen Mini Apps" />
      </section>

      <section className="chooser-panel">
        <div className="chooser-panel__header">
          <p className="hero__eyebrow">Choose your experience</p>
          <h1>Open the Mini App you want to explore.</h1>
          <p>
            Browse the clip store or shop custom obedience task packages, all inside the same Telegram-ready experience.
          </p>
        </div>
        <div className="chooser-grid">
          <Link to="/clips" className="chooser-card chooser-card--clips">
            <span className="chooser-card__eyebrow">🎬 Clip Store</span>
            <strong>Browse clips, previews, and bot purchase links.</strong>
            <p>Search the library, open previews, and hand off to the bot for stream or download purchase.</p>
            <span className="chooser-card__cta">Open Clip Store</span>
          </Link>
          <Link to="/tasks" className="chooser-card chooser-card--tasks">
            <span className="chooser-card__eyebrow">📝 Custom Tasks</span>
            <strong>Compare obedience packages and buy in bot.</strong>
            <p>See featured packages, compare duration and daily intensity, and continue checkout in Telegram.</p>
            <span className="chooser-card__cta">Open Task Packages</span>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
