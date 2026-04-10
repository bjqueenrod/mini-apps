import { useEffect, useRef } from 'react';
import { AppShell } from '../components/AppShell';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { CurrencyToggleBanner } from '../components/CurrencyToggleBanner';
import { applyTelegramTheme, openBotDeepLink, sendBotWebAppData } from '../app/telegram';
import { setAnalyticsContext } from '../app/analytics';
import { useTelegramSession } from '../features/auth/hooks';
import { useKeyholdingOptions, useKeyholdingTiers } from '../features/keyholding/hooks';
import { KeyholdingTierCarousel } from '../components/KeyholdingTierCarousel';
import { useCurrencyPreference } from '../hooks/useCurrencyPreference';

function handleApplyClick() {
  window.location.href = 'https://apply.mistressbjqueen.com';
}

function SectionEyebrow({ children }: { children: string }) {
  return <p className="hero__eyebrow">{children}</p>;
}

export function KeyholdingPage() {
  const session = useTelegramSession();
  const [currency] = useCurrencyPreference();
  const tiersQuery = useKeyholdingTiers(currency);
  const optionsQuery = useKeyholdingOptions(currency);
  const didInitRef = useRef(false);

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
    if (didInitRef.current) return;
    didInitRef.current = true;
  }, []);

  return (
    <AppShell>
      {!session.isTelegram && (
        <>
          <TelegramDevBanner />
          <CurrencyToggleBanner />
        </>
      )}

      <section className="hero hero--tasks">
        <img
          className="hero__banner"
          src="/header-keyholding.jpeg?v=20260409a"
          alt="Mistress BJQueen Chastity Keyholding banner"
        />
      </section>

      <section className="tasks-hero">
        <div className="tasks-hero__grid">
          <div className="tasks-hero__main">
            <SectionEyebrow>Keyholding Control</SectionEyebrow>
            <h1>You lock your cock. You don’t control what happens next.</h1>
            <p className="tasks-hero__lead">
              This isn’t casual keyholding. This is structured control with enforced accountability.
            </p>
            <div className="tasks-strip tasks-strip--hero" aria-label="Keyholding promises">
              {['Your behaviour is monitored', 'Your check-ins are required', 'Your access is controlled'].map((item) => (
                <div key={item} className="tasks-chip">
                  <span className="tasks-chip__icon">
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                      <path d="m5 13 4 4 10-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="tasks-hero__actions">
              <button className="tasks-button tasks-button--primary" type="button" onClick={handleApplyClick}>
                Apply for Keyholding
              </button>
              <a className="tasks-button tasks-button--secondary" href="#tiers">
                View Tiers
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="tasks-panel tasks-panel--steps">
        <div className="tasks-panel__header">
          <SectionEyebrow>How It Works</SectionEyebrow>
          <h2>The path to locking your cock in a cage for me</h2>
        </div>
        <div className="tasks-stepper">
          {['Lock your cock', 'Follow assigned structure', 'Submit check-ins and proof', 'Stay locked under control'].map(
            (title, index) => {
              const Icon = () => {
                switch (index) {
                  case 0:
                    return (
                      <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                        <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M9 10V7a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    );
                  case 1:
                    return (
                      <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                        <path d="M4 6h16M6 12h12M8 18h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    );
                  case 2:
                    return (
                      <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                        <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    );
                  default:
                    return (
                      <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                        <path d="m5 13 4 4 10-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    );
                }
              };
              return (
                <article key={title} className="tasks-stepper__item">
                  <div className="tasks-stepper__topline">
                    <span className="tasks-stepper__number">0{index + 1}</span>
                    <span className="tasks-stepper__icon" aria-hidden="true">
                      <Icon />
                    </span>
                  </div>
                  <strong>{title}</strong>
                </article>
              );
            },
          )}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <SectionEyebrow>Control System</SectionEyebrow>
          <h2>This is not optional control</h2>
        </div>
        <div className="tasks-style-grid" aria-label="Control system blocks">
          {[
            { title: 'Rules', body: 'You follow defined rules. Not suggestions.' },
            { title: 'Proof', body: 'Check-ins and verification are required.' },
            { title: 'Enforcement', body: 'Missed compliance has consequences.' },
            { title: 'Continuity', body: 'You don’t drift in and out. You stay locked.' },
          ].map((item) => (
            <article key={item.title} className="tasks-style-card">
              <div className="tasks-style-card__header">
                <span className="tasks-style-card__icon">■</span>
                <p className="tasks-style-card__eyebrow">{item.title}</p>
              </div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-section" id="tiers">
        <div className="tasks-section__header tasks-section__header--stacked">
          <div className="tasks-section__copy">
            <SectionEyebrow>Tiers / Pricing</SectionEyebrow>
            <h2>Choose the level of control you can handle</h2>
          </div>
        </div>

        {tiersQuery.isError && <ErrorState message={(tiersQuery.error as Error).message} />}
        {(tiersQuery.isLoading || (tiersQuery.data?.items?.length ?? 0) > 0) && (
          <KeyholdingTierCarousel
            items={tiersQuery.data?.items ?? []}
            loading={tiersQuery.isLoading}
            onApply={handleApplyClick}
            currency={currency}
          />
        )}
        {!tiersQuery.isLoading && tiersQuery.data && (tiersQuery.data.items?.length ?? 0) === 0 && (
          <EmptyState title="No tiers available" message="Tiers will appear here when configured." />
        )}
      </section>

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <SectionEyebrow>What You Get</SectionEyebrow>
          <h2>Enforced control, not chatter</h2>
        </div>
        <div className="tasks-style-grid" aria-label="What you get list">
          {[
            'Structured check-ins',
            'Assigned tasks',
            'Controlled access to pleasure',
            'Messaging rules',
            'Defined consequences',
            'Ongoing control',
          ].map((item) => (
            <article key={item} className="tasks-style-card">
              <div className="tasks-style-card__header">
                <span className="tasks-style-card__icon">●</span>
                <p className="tasks-style-card__eyebrow">Included</p>
              </div>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <SectionEyebrow>Rules & Consequences</SectionEyebrow>
          <h2>Rules are enforced</h2>
        </div>
        <div className="tasks-benefits" aria-label="Rules and consequences">
          {[
            'Missed check-ins result in consequences',
            'Unlocking without permission ends access',
            'Instructions are expected to be followed',
            'Consistency determines privileges',
          ].map((point) => (
            <article key={point} className="tasks-benefit">
              <span className="tasks-benefit__icon">!</span>
              <div>
                <strong>{point}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <SectionEyebrow>Keyholding Options</SectionEyebrow>
          <h2>Control methods</h2>
        </div>
        {optionsQuery.isError && <ErrorState message={(optionsQuery.error as Error).message} />}
        {optionsQuery.isLoading && <div className="skeleton-card" style={{ height: 120 }} aria-hidden="true" />}
        {!optionsQuery.isLoading && optionsQuery.data && optionsQuery.data.items.length === 0 && (
          <EmptyState title="No options" message="Keyholding options will appear when configured." />
        )}
        {!optionsQuery.isLoading && optionsQuery.data && optionsQuery.data.items.length > 0 && (
          <div className="tasks-style-grid" aria-label="Keyholding options">
            {optionsQuery.data.items
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((option) => (
                <article key={option.id} className="tasks-style-card">
                  <div className="tasks-style-card__header">
                    <span className="tasks-style-card__icon">🔑</span>
                    <p className="tasks-style-card__eyebrow">Option</p>
                  </div>
                  <strong>{option.label}</strong>
                  <p>{option.tooltip || 'Controlled access with verification.'}</p>
                </article>
              ))}
          </div>
        )}
      </section>

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <SectionEyebrow>Application Process</SectionEyebrow>
          <h2>Deliberate, not casual</h2>
        </div>
        <div className="tasks-stepper">
          {['Submit application', 'Reviewed for suitability', 'Accepted and assigned tier', 'Control begins'].map(
            (step, index) => (
              <article key={step} className="tasks-stepper__item">
                <div className="tasks-stepper__topline">
                  <span className="tasks-stepper__number">0{index + 1}</span>
                  <span className="tasks-stepper__icon">⟶</span>
                </div>
                <strong>{step}</strong>
              </article>
            ),
          )}
        </div>
        <div className="tasks-hero__actions">
          <button className="tasks-button tasks-button--primary" type="button" onClick={handleApplyClick}>
            Apply Now
          </button>
        </div>
      </section>

      <section className="tasks-panel tasks-panel--faq">
        <div className="tasks-panel__header">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2>Read before you apply</h2>
        </div>
        <div className="faq-list">
          {[
            { q: 'Do I need a cage?', a: 'Yes, you should be able to lock. If not, you will be declined.' },
            { q: 'What happens if I fail?', a: 'Consequences are applied and access can be ended.' },
            { q: 'Can I leave early?', a: 'You can request, but approval is not guaranteed.' },
            { q: 'How strict is this?', a: 'Rules, proof, and consequences. Not casual.' },
          ].map((item) => (
            <details key={item.q} className="faq-card">
              <summary>
                <span className="faq-card__summary">
                  <span className="faq-card__icon">?</span>
                  <span className="faq-card__text">{item.q}</span>
                  <span className="faq-card__chevron" aria-hidden="true" />
                </span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--cta">
        <div className="tasks-panel__header">
          <SectionEyebrow>Final CTA</SectionEyebrow>
          <h2>Ready to give up control?</h2>
        </div>
        <p className="tasks-panel__body-copy">You lock. I control what happens next.</p>
        <div className="tasks-hero__actions">
          <button className="tasks-button tasks-button--primary" type="button" onClick={handleApplyClick}>
            Apply for Keyholding
          </button>
        </div>
      </section>
    </AppShell>
  );
}
