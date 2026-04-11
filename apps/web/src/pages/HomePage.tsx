import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { CurrencyToggleBanner } from '../components/CurrencyToggleBanner';
import { setAnalyticsContext } from '../app/analytics';
import { trackInteraction } from '../app/analytics';
import { applyTelegramTheme } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { useEffect } from 'react';

export function resolveHomeRedirectTarget(search: string, startParam?: string | null): string | null {
  const params = new URLSearchParams(search);
  const queryStart = (params.get('startapp') || params.get('tgWebAppStartParam') || '').trim().toLowerCase();
  const startapp = (startParam || queryStart).trim().toLowerCase();
  const target = startapp === 'clips' || startapp === 'tasks' || startapp === 'keyholding' ? `/${startapp}` : null;
  return target ? `${target}${search}` : null;
}

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useTelegramSession();

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  useEffect(() => {
    const target = resolveHomeRedirectTarget(location.search, session.startParam);
    if (target) {
      navigate(target, { replace: true });
    }
  }, [location.search, navigate, session.startParam]);

  useEffect(() => {
    setAnalyticsContext({
      enabled: session.ready && !session.error,
      isTelegram: session.isTelegram,
      startParam: session.startParam,
    });
  }, [session.error, session.isTelegram, session.ready, session.startParam]);

  const handleCardClick = (actionKey: string) => () => {
    trackInteraction({ actionKey, screen: 'home' });
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0);
  };

  return (
    <AppShell>
      <CurrencyToggleBanner />
      <section className="hero">
        <img
          className="hero__banner"
          src="/header-telegram.jpeg?v=20260409a"
          alt="Mistress BJQueen Telegram Mini-app banner"
        />
      </section>

      <section className="chooser-panel">
        <div className="chooser-panel__header">
          <p className="hero__eyebrow">Choose your experience</p>
          <h1>Open the Mini App you want to explore.</h1>
          <p>
            Browse the clip store or shop custom obedience task packages, all inside the same Telegram-ready
            experience.
          </p>
        </div>
        <div className="chooser-grid">
          <Link
            to="/keyholding"
            className="chooser-card chooser-card--tasks"
            onClick={handleCardClick('chooser_keyholding')}
          >
            <span className="chooser-card__eyebrow">🔒 CHASTITY KEYHOLDING</span>
            <strong>Give up ownership of your cock.</strong>
            <p>
              Choose your tier, submit your application, and let me control access to your cock with check-ins, proof,
              obedience tasks, enforced rules, and clear consequences.
            </p>
            <p>A structured, hands-on keyholding service with clear expectations.</p>
            <span className="chooser-card__cta">View Keyholding Options</span>
          </Link>
          <Link
            to="/tasks"
            className="chooser-card chooser-card--tasks"
            onClick={handleCardClick('chooser_tasks')}
          >
            <span className="chooser-card__eyebrow">📝 CUSTOM OBEDIENCE TASKS</span>
            <strong>Be put to work for me.</strong>
            <p>
              Choose your package and intensity, then receive obedience tasks built around your selected fetish
              categories and available toys.
            </p>
            <p>
              You complete the tasks, submit proof, and I review it myself to decide if you followed my orders
              correctly.
            </p>
            <span className="chooser-card__cta">Start Your Tasks</span>
          </Link>
          <Link
            to="/clips"
            className="chooser-card chooser-card--clips"
            onClick={handleCardClick('chooser_clips')}
          >
            <span className="chooser-card__eyebrow">🎬 FEMDOM CLIP STORE</span>
            <strong>Browse. Preview. Unlock.</strong>
            <p>
              Search my femdom clip archive, watch previews, and unlock full clips in seconds. Stream instantly or
              download and keep them.
            </p>
            <p>
              Use hashtag search to find exactly what you want, preview before you buy, and unlock full access when
              you’re ready.
            </p>
            <span className="chooser-card__cta">Enter Clip Store</span>
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
