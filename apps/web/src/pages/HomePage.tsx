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
    const queryStart = (params.get('startapp') || params.get('tgWebAppStartParam') || '').trim().toLowerCase();
    const startapp = (session.startParam || queryStart).trim().toLowerCase();
    const target =
      startapp === 'clips' || startapp === 'tasks' || startapp === 'keyholding' ? `/${startapp}` : null;
    if (target) {
      navigate(target, { replace: true });
    }
  }, [navigate, session.startParam]);

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
        <img
          className="hero__banner"
          src="/header-telegram.jpeg?v=20260409a"
          alt="Mistress BJQueen Telegram Mini-app banner"
        />
      </section>

      <section className="chooser-panel">
        <div className="chooser-grid">
          <Link
            to="/keyholding"
            className="chooser-card chooser-card--tasks"
            onClick={() => trackInteraction({ actionKey: 'chooser_keyholding', screen: 'home' })}
          >
            <span className="chooser-card__eyebrow">🔒 KEYHOLDING</span>
            <strong>Give up control of your cock.</strong>
            <p>
              Structured chastity with real oversight. Proofed check-ins, enforced rules, and defined consequences.
              Apply, get reviewed, and enter controlled keyholding.
            </p>
            <span className="chooser-card__cta">Apply for Keyholding</span>
          </Link>
          <Link
            to="/tasks"
            className="chooser-card chooser-card--tasks"
            onClick={() => trackInteraction({ actionKey: 'chooser_tasks', screen: 'home' })}
          >
            <span className="chooser-card__eyebrow">📝 CUSTOM TASKS</span>
            <strong>Get tasks built for you.</strong>
            <p>
              Choose your level, set the intensity, and receive obedience tasks designed around your limits,
              weaknesses, and control level. Delivered privately. Enforced properly.
            </p>
            <span className="chooser-card__cta">View Task Packages</span>
          </Link>
          <Link
            to="/clips"
            className="chooser-card chooser-card--clips"
            onClick={() => trackInteraction({ actionKey: 'chooser_clips', screen: 'home' })}
          >
            <span className="chooser-card__eyebrow">🎬 CLIP STORE</span>
            <strong>Browse. Preview. Unlock.</strong>
            <p>
              Search the archive, watch previews, and unlock full clips instantly. Stream or download in seconds, no
              waiting, no friction.
            </p>
            <span className="chooser-card__cta">Enter Clip Store</span>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
