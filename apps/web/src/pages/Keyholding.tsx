import { useEffect, useRef } from 'react';
import { AppShell } from '../components/AppShell';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { applyTelegramTheme, openBotDeepLink, sendBotWebAppData } from '../app/telegram';
import { setAnalyticsContext } from '../app/analytics';
import { useTelegramSession } from '../features/auth/hooks';
import { useKeyholdingOptions, useKeyholdingTiers } from '../features/keyholding/hooks';
import { KeyholdingTierCarousel } from '../components/KeyholdingTierCarousel';

const FAQ_ITEMS = [
  {
    question: 'Do I need a cage?',
    answer: 'A cage is preferred but not required. We verify what you have and select control options that match it.',
  },
  {
    question: 'Can I quit early?',
    answer: 'You can request to end early, but acceptance and conditions are at Mistress BJQueen’s discretion.',
  },
  {
    question: 'How strict is this?',
    answer: 'Expect firm structure, scheduled check-ins, and proof requirements. Slackers are declined.',
  },
  {
    question: 'What happens if I break rules?',
    answer: 'Violations can reset progress, extend control, or end your access with no refund.',
  },
  {
    question: 'Is this anonymous?',
    answer: 'Telegram-only. Your details stay inside the intake and control flow; discretion is enforced.',
  },
];

function handleApplyClick() {
  const startParam = 'keyholding_apply';
  if (sendBotWebAppData(startParam)) {
    return;
  }
  openBotDeepLink(`https://t.me/mistressbjqueenbot?start=${startParam}`);
}

function SectionEyebrow({ children }: { children: string }) {
  return <p className="hero__eyebrow">{children}</p>;
}

export function Keyholding() {
  const session = useTelegramSession();
  const tiersQuery = useKeyholdingTiers();
  const optionsQuery = useKeyholdingOptions();
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
      {!session.isTelegram && <TelegramDevBanner />}

      <section className="hero hero--tasks">
        <div className="hero__banner-frame">
          <img className="hero__banner hero__banner--framed" src="/header.png?v=20260405b" alt="Keyholding" />
          <div className="hero__banner-mask" aria-hidden="true" />
          <div className="hero__banner-copy">
            <span className="hero__banner-kicker">Chastity Control</span>
            <strong>Premium Keyholding</strong>
            <span>Structured control, proof, and disciplined follow-through inside Telegram.</span>
          </div>
        </div>
      </section>

      <section className="tasks-hero">
        <div className="tasks-hero__grid">
          <div className="tasks-hero__main">
            <SectionEyebrow>Keyholding Service</SectionEyebrow>
            <h1>Apply for disciplined keyholding with real accountability</h1>
            <p className="tasks-hero__lead">
              Submit your application, get reviewed, and—if accepted—enter a controlled lock period with scheduled
              check-ins, proof, and consequences for slipping.
            </p>
            <p className="tasks-hero__supporting-copy">
              You are buying control, structure, and attentive enforcement, not casual chat. Limited spots to keep the
              standard high.
            </p>
            <div className="tasks-hero__actions">
              <button type="button" className="tasks-button tasks-button--primary" onClick={handleApplyClick}>
                Apply for Keyholding
              </button>
            </div>
          </div>

          <aside className="tasks-hero__aside">
            <article className="tasks-hero__private-card">
              <p className="tasks-hero__private-kicker">What is keyholding?</p>
              <strong>Control, structure, and accountability around your lock.</strong>
              <p>
                You lock. I hold control and enforce proof, messaging rules, and cadence. You stay obedient or lose the
                privilege.
              </p>
              <div className="tasks-hero__private-list" aria-label="Keyholding pillars">
                {['Proofed check-ins and verifications', 'Clear messaging rules and escalation', 'Consequences for slips and missed proof'].map(
                  (point) => (
                    <div key={point} className="tasks-hero__private-item">
                      <span className="tasks-hero__private-dot" aria-hidden="true" />
                      <span>{point}</span>
                    </div>
                  ),
                )}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="tasks-panel tasks-panel--steps">
        <div className="tasks-panel__header">
          <SectionEyebrow>How It Works</SectionEyebrow>
          <h2>The path to locking your cock in a cage for me</h2>
        </div>
        <div className="tasks-stepper">
          {["Apply", "Get reviewed", "Get accepted", "Begin your lock period"].map((title, index) => {
            const Icon = () => {
              switch (index) {
                case 0:
                  return (
                    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                      <rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M9 10V7a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="15" r="1" fill="currentColor" />
                      <path d="M12 16v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  );
                case 1:
                  return (
                    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                      <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  );
                case 2:
                  return (
                    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                      <path d="m5 13 4 4 10-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  );
                default:
                  return (
                    <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20">
                      <path d="M12 3l3 6.5 7 .9-5.2 4.7 1.4 7.4L12 18l-6.2 4.5 1.4-7.4L2 10.4l7-.9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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
              <p>
                {index === 0 && 'Submit your application with honest details about your lock, limits, and goals.'}
                {index === 1 && 'I screen seriousness, readiness, and fit. Only disciplined applicants move forward.'}
                {index === 2 && 'Accepted applicants receive onboarding steps, control rules, and first proof check.'}
                {index === 3 && 'Lock, follow cadence, submit proof on schedule, and stay compliant throughout.'}
              </p>
            </article>
            );
          })}
        </div>
      </section>

      <section className="tasks-section" id="packages">
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
          />
        )}
        {!tiersQuery.isLoading && tiersQuery.data && (tiersQuery.data.items?.length ?? 0) === 0 && (
          <EmptyState title="No tiers available" message="Tiers will appear here when configured." />
        )}
      </section>

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <SectionEyebrow>Keyholding Options</SectionEyebrow>
          <h2>How your lock is controlled</h2>
        </div>
        {optionsQuery.isError && <ErrorState message={(optionsQuery.error as Error).message} />}
        {optionsQuery.isLoading && <div className="skeleton-card" style={{ height: 140 }} aria-hidden="true" />}
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
                    <span className="tasks-style-card__icon">KH</span>
                    <p className="tasks-style-card__eyebrow">{option.availabilityType === 'include' ? 'Tier-specific' : 'Available'}</p>
                  </div>
                  <strong>{option.label}</strong>
                  <p>{option.tooltip || 'Controlled access with proof and verification.'}</p>
                  <p className="tasks-panel__supporting-copy">
                    {option.priceLabel ? `+ ${option.priceLabel}` : 'Priced per configuration'}
                  </p>
                </article>
              ))}
          </div>
        )}
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <SectionEyebrow>What to Expect</SectionEyebrow>
          <h2>Control with standards, not excuses</h2>
        </div>
        <div className="tasks-style-grid" aria-label="Expectations">
          {[
            'Regular proofed check-ins with photos/video when demanded.',
            'Messaging rules: concise, respectful, no spam. Breaking rules delays responses.',
            'Tasks and discipline aligned to your tier; missed proof extends control or ends access.',
            'Seriousness required: flakes are declined and may be blocked from reapplying.',
          ].map((item) => (
            <article key={item} className="tasks-style-card">
              <div className="tasks-style-card__header">
                <span className="tasks-style-card__icon">!</span>
                <p className="tasks-style-card__eyebrow">Expectation</p>
              </div>
              <strong>Stay compliant</strong>
              <p>{item}</p>
            </article>
          ))}
      </div>
      </section>

      <section className="tasks-panel tasks-panel--faq">
        <div className="tasks-panel__header">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2>Before you apply</h2>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="faq-card">
              <summary>
                <span className="faq-card__summary">
                  <span className="faq-card__icon">?</span>
                  <span className="faq-card__text">{item.question}</span>
                  <span className="faq-card__chevron" aria-hidden="true" />
                </span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <SectionEyebrow>Application Process</SectionEyebrow>
          <h2>Deliberate friction to keep it serious</h2>
        </div>
        <div className="tasks-benefits" aria-label="Application steps">
          {[
            'Submit full details about your lock, experience, limits, and proof readiness.',
            'I review fit and seriousness. Half-finished or fantasy submissions are rejected.',
            'Accepted applicants receive payment instructions and onboarding steps.',
            'Start date set. From there, follow proof cadence or lose the spot.',
          ].map((detail, index) => (
            <article key={detail} className="tasks-benefit">
              <span className="tasks-benefit__icon">{index + 1}</span>
              <div>
                <strong>Step {index + 1}</strong>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--cta">
        <div className="tasks-panel__header">
          <SectionEyebrow>Final Call</SectionEyebrow>
          <h2>Limited slots. Apply now.</h2>
        </div>
        <p className="tasks-panel__body-copy">
          If you want disciplined, attentive keyholding with real checks and consequences, apply now. Casual buyers are
          turned away.
        </p>
        <div className="tasks-hero__actions">
          <button type="button" className="tasks-button tasks-button--primary" onClick={handleApplyClick}>
            Apply Now
          </button>
        </div>
      </section>
    </AppShell>
  );
}
