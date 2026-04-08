import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { setAnalyticsContext } from '../app/analytics';
import { trackInteraction } from '../app/analytics';
import { applyTelegramTheme } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { useEffect } from 'react';

export function HomePage() {
  const navigate = useNavigate();
  const session = useTelegramSession();

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startapp = (params.get('startapp') || '').trim().toLowerCase();
    const target =
      startapp === 'clips' || startapp === 'tasks' || startapp === 'keyholding' ? `/${startapp}` : null;
    if (target) {
      navigate(target, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    setAnalyticsContext({
      enabled: session.ready && !session.error,
      isTelegram: session.isTelegram,
      startParam: session.startParam,
    });
  }, [session.error, session.isTelegram, session.ready, session.startParam]);

  return (
    <AppShell>
      {!session.isTelegram && <TelegramDevBanner />}
      <section className="hero">
        <img className="hero__banner" src="/header.png?v=20260401a" alt="Mistress BJQueen Mini Apps" />
      </section>

      <section className="chooser-panel">
        <div className="chooser-grid">
          <Link
            to="/clips"
            className="chooser-card chooser-card--clips"
            onClick={() => trackInteraction({ actionKey: 'chooser_clips', screen: 'home' })}
          >
            <span className="chooser-card__eyebrow">🎬 Clip Store</span>
            <strong>Browse clips, previews, and bot purchase links.</strong>
            <p>Search the library, open previews, and hand off to the bot for stream or download purchase.</p>
            <span className="chooser-card__cta">Open Clip Store</span>
          </Link>
          <Link
            to="/tasks"
            className="chooser-card chooser-card--tasks"
            onClick={() => trackInteraction({ actionKey: 'chooser_tasks', screen: 'home' })}
          >
            <span className="chooser-card__eyebrow">📝 Custom Tasks</span>
            <strong>Compare obedience packages and buy in bot.</strong>
            <p>See featured packages, compare duration and daily intensity, and continue checkout in Telegram.</p>
            <span className="chooser-card__cta">Open Task Packages</span>
          </Link>
          <Link
            to="/keyholding"
            className="chooser-card chooser-card--tasks"
            onClick={() => trackInteraction({ actionKey: 'chooser_keyholding', screen: 'home' })}
          >
            <span className="chooser-card__eyebrow">🔒 Keyholding</span>
            <strong>Apply for premium chastity keyholding.</strong>
            <p>Learn the control process, view tiers, and apply for disciplined, proofed keyholding inside Telegram.</p>
            <span className="chooser-card__cta">Open Keyholding</span>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
