import { MouseEvent, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { TierCarousel } from '../components/TierCarousel';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { TierDetailSheet } from '../components/TierDetailSheet';
import { applyTelegramTheme, openBotDeepLink } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { getTierArtworkVariant } from '../features/tiers/artwork';
import { useTierDetail, useTiers } from '../features/tiers/hooks';
import { getBotRootUrl } from '../features/tiers/presentation';

type TaskIconName =
  | 'wand'
  | 'heart'
  | 'clock'
  | 'sparkles'
  | 'package'
  | 'sliders'
  | 'scroll'
  | 'chat'
  | 'shield'
  | 'toy'
  | 'signal'
  | 'help';

const VALUE_POINTS = [
  { label: 'Tailored to you', icon: 'wand' },
  { label: 'Reviewed personally', icon: 'heart' },
  { label: 'One task at a time', icon: 'clock' },
  { label: 'Beginner to intense', icon: 'sparkles' },
] as const;

const WHAT_YOU_GET_POINTS = [
  {
    title: 'Tailored brief',
    detail: 'Your kinks, limits, toys, and preferred intensity shape the assignment.',
    icon: 'sliders',
  },
  {
    title: 'Personal review',
    detail: 'Every task is checked personally before it reaches you.',
    icon: 'heart',
  },
  {
    title: 'Step-by-step delivery',
    detail: 'You receive the next step, send proof, and continue in one guided flow.',
    icon: 'chat',
  },
  {
    title: 'Flexible intensity',
    detail: 'Beginner-friendly options and heavier intensity can exist in the same system.',
    icon: 'signal',
  },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Choose a package',
    detail: 'Pick the pace and structure that matches what you want right now.',
    icon: 'package',
  },
  {
    title: 'Submit your preferences',
    detail: 'Share your kinks, limits, toys, and how soft or intense you want it to feel.',
    icon: 'sliders',
  },
  {
    title: 'Receive your personalised task',
    detail: 'Your first assignment arrives with clear guidance instead of a generic list.',
    icon: 'scroll',
  },
  {
    title: 'Send proof and continue in the bot',
    detail: 'Reply in the bot, send the required proof, and continue one step at a time.',
    icon: 'chat',
  },
] as const;

const SAMPLE_TASK_CARDS = [
  {
    eyebrow: 'Real Example',
    title: 'Denial and control training',
    body: 'A structured assignment focused on restraint, frustration, post-task stillness, and discreet proof afterward.',
    icon: 'heart',
  },
  {
    eyebrow: 'Real Example',
    title: 'Temperature-play obedience',
    body: 'A toy-based assignment built around cold sensation, stillness, timed control, and a discreet proof photo afterward.',
    icon: 'toy',
  },
  {
    eyebrow: 'Real Example',
    title: 'Tethered kitchen humiliation',
    body: 'A controlled humiliation task built around restraint, posture, discomfort, cleanup, and full-body proof afterward.',
    icon: 'scroll',
  },
] as const;

const FAQS = [
  {
    question: 'Do I need lots of toys?',
    answer: 'No. Tasks can be tailored to what you actually own.',
    icon: 'toy',
  },
  {
    question: 'Can beginners buy?',
    answer: 'Yes. Packages can start softer, simpler, and more guided if that suits your experience level.',
    icon: 'signal',
  },
  {
    question: 'Are the tasks always custom?',
    answer: 'Yes. Each assignment is built around the preferences, limits, toys, and intensity you submit.',
    icon: 'wand',
  },
  {
    question: 'What kind of proof is required?',
    answer: 'It depends on the task. You will be told what proof is needed before you continue.',
    icon: 'shield',
  },
  {
    question: 'How do I pay?',
    answer: 'Choose your package here, then continue in the bot for payment and delivery.',
    icon: 'help',
  },
] as const;

function TaskIcon({ name }: { name: TaskIconName }) {
  const commonProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'wand':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M4 20L14.5 9.5" />
          <path {...commonProps} d="M13 4l.7 1.8L15.5 6.5l-1.8.7L13 9l-.7-1.8L10.5 6.5l1.8-.7L13 4z" />
          <path {...commonProps} d="M18 11l.5 1.2L19.7 13l-1.2.5L18 14.7l-.5-1.2L16.3 13l1.2-.8L18 11z" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M12 20s-6.5-4.1-8.3-8.1C2.5 9.1 3.5 6 7 6c2 0 3.2 1 5 3 1.8-2 3-3 5-3 3.5 0 4.5 3.1 3.3 5.9C18.5 15.9 12 20 12 20z" />
        </svg>
      );
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...commonProps} cx="12" cy="12" r="8" />
          <path {...commonProps} d="M12 8v4l2.5 2" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M12 3l1.1 3.1L16 7.2l-2.9 1.1L12 11.4l-1.1-3.1L8 7.2l2.9-1.1L12 3z" />
          <path {...commonProps} d="M18 12l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
          <path {...commonProps} d="M7 13l.9 2.6L10.5 17l-2.6.9L7 20.5l-.9-2.6L3.5 17l2.6-.9L7 13z" />
        </svg>
      );
    case 'package':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M4 8.5L12 4l8 4.5v7L12 20l-8-4.5v-7z" />
          <path {...commonProps} d="M4 8.5L12 13l8-4.5" />
          <path {...commonProps} d="M12 13v7" />
        </svg>
      );
    case 'sliders':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M6 5v14M18 5v14M12 5v14" />
          <circle {...commonProps} cx="6" cy="9" r="2" />
          <circle {...commonProps} cx="12" cy="15" r="2" />
          <circle {...commonProps} cx="18" cy="10" r="2" />
        </svg>
      );
    case 'scroll':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M8 5h8a3 3 0 010 6H9a3 3 0 100 6h7" />
          <path {...commonProps} d="M8 5a3 3 0 100 6" />
          <path {...commonProps} d="M9 11h7" />
          <path {...commonProps} d="M9 15h5" />
        </svg>
      );
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M6 7h12a2 2 0 012 2v6a2 2 0 01-2 2h-6l-4 3v-3H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
          <path {...commonProps} d="M8.5 11.5h7" />
          <path {...commonProps} d="M8.5 14.5h4.5" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M12 4l6 2.5V11c0 4.2-2.3 6.9-6 9-3.7-2.1-6-4.8-6-9V6.5L12 4z" />
          <path {...commonProps} d="M9.5 12l1.7 1.7 3.3-3.4" />
        </svg>
      );
    case 'toy':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...commonProps} cx="8" cy="8" r="2.5" />
          <circle {...commonProps} cx="16" cy="8" r="2.5" />
          <path {...commonProps} d="M10.5 8h3" />
          <path {...commonProps} d="M8 10.5V13a4 4 0 004 4 4 4 0 004-4v-2.5" />
        </svg>
      );
    case 'signal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...commonProps} d="M6 18V14" />
          <path {...commonProps} d="M10 18V11" />
          <path {...commonProps} d="M14 18V8" />
          <path {...commonProps} d="M18 18V5" />
        </svg>
      );
    case 'help':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...commonProps} cx="12" cy="12" r="8" />
          <path {...commonProps} d="M9.5 9.5a2.5 2.5 0 114.2 1.8c-.7.7-1.7 1.2-1.7 2.7" />
          <path {...commonProps} d="M12 16.5h0" />
        </svg>
      );
  }
}

export function TasksPage() {
  const session = useTelegramSession();
  const { tierId } = useParams();
  const tiersQuery = useTiers();
  const tierDetailQuery = useTierDetail(tierId);
  const botRootUrl = useMemo(() => getBotRootUrl(tiersQuery.data?.items ?? []), [tiersQuery.data?.items]);
  const tierArtworkVariants = useMemo(
    () =>
      Object.fromEntries((tiersQuery.data?.items ?? []).map((item, index) => [item.id, getTierArtworkVariant(index)])),
    [tiersQuery.data?.items],
  );

  useEffect(() => {
    applyTelegramTheme();
  }, []);

  const handleBotAction = (url?: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!url) {
      return;
    }
    event.preventDefault();
    openBotDeepLink(url);
  };

  return (
    <AppShell>
      {!session.isTelegram && <TelegramDevBanner />}
      <section className="hero hero--tasks">
        <div className="hero__banner-frame">
          <img
            className="hero__banner hero__banner--framed"
            src="/header.png?v=20260401a"
            alt="Mistress BJQueen Custom Obedience Tasks"
          />
          <div className="hero__banner-mask" aria-hidden="true" />
          <div className="hero__banner-copy">
            <span className="hero__banner-kicker">Mistress BJQueen&apos;s</span>
            <strong>Custom Obedience</strong>
            <span>Personalised obedience packages</span>
          </div>
        </div>
      </section>

      <section className="tasks-hero">
        <p className="hero__eyebrow">Custom Obedience Tasks</p>
        <h1>Custom obedience tasks built around your kinks, limits, and toys</h1>
        <p className="tasks-hero__lead">
          Personal, guided assignments reviewed by Mistress BJQueen. Beginner-friendly to intense.
        </p>
        <div className="tasks-hero__actions">
          <a className="tasks-button tasks-button--primary" href="#packages">
            Choose Your Package
          </a>
          <a
            className="tasks-button tasks-button--secondary"
            href={botRootUrl || '#packages'}
            onClick={handleBotAction(botRootUrl)}
          >
            Back to Bot
          </a>
        </div>
        <div className="tasks-strip tasks-strip--hero" aria-label="Why buyers choose custom obedience">
          {VALUE_POINTS.map((point) => (
            <div key={point.label} className="tasks-chip">
              <span className="tasks-chip__icon">
                <TaskIcon name={point.icon} />
              </span>
              <span>{point.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">What You Get</p>
          <h2>Clear benefits without the fluff.</h2>
        </div>
        <div className="tasks-benefits" aria-label="What you get">
          {WHAT_YOU_GET_POINTS.map((point) => (
            <article key={point.title} className="tasks-benefit">
              <span className="tasks-benefit__icon">
                <TaskIcon name={point.icon} />
              </span>
              <div>
                <strong>{point.title}</strong>
                <p>{point.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--steps">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">How It Works</p>
          <h2>A simple four-step flow.</h2>
        </div>
        <div className="tasks-stepper">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <article key={step.title} className="tasks-stepper__item">
              <div className="tasks-stepper__topline">
                <span className="tasks-stepper__number">0{index + 1}</span>
                <span className="tasks-stepper__icon">
                  <TaskIcon name={step.icon} />
                </span>
              </div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Example Task Styles</p>
          <h2>Examples only, so you can see the tone.</h2>
        </div>
        <p className="tasks-panel__body-copy">
          Your actual tasks are shaped around your submitted preferences, limits, toys, and intensity level.
        </p>
        <div className="tasks-style-grid" aria-label="Examples of custom task styles">
          {SAMPLE_TASK_CARDS.map((card) => (
            <article key={card.title} className="tasks-style-card">
              <div className="tasks-style-card__header">
                <span className="tasks-style-card__icon">
                  <TaskIcon name={card.icon} />
                </span>
                <p className="tasks-style-card__eyebrow">{card.eyebrow}</p>
              </div>
              <strong>{card.title}</strong>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tasks-section" id="packages">
        <div className="tasks-section__header tasks-section__header--stacked">
          <div className="tasks-section__copy">
            <p className="hero__eyebrow">Packages</p>
            <h2>Choose the package that fits the pace you want.</h2>
            <p className="tasks-panel__body-copy">
              Open a package to compare duration, pace, and price before you continue in the bot for payment and
              delivery.
            </p>
          </div>
          {tiersQuery.data && <span className="tasks-section__count">{tiersQuery.data.total} available</span>}
        </div>

        {tiersQuery.isError && <ErrorState message={(tiersQuery.error as Error).message} />}
        {(tiersQuery.isLoading || (tiersQuery.data && tiersQuery.data.items.length > 0)) && (
          <TierCarousel items={tiersQuery.data?.items ?? []} loading={tiersQuery.isLoading} />
        )}
        {!tiersQuery.isLoading && tiersQuery.data && tiersQuery.data.items.length === 0 && (
          <EmptyState
            title="No packages available"
            message="Active custom obedience packages will appear here when they are ready."
          />
        )}
      </section>

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">FAQ</p>
          <h2>Questions before you choose?</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((item) => (
            <details key={item.question} className="faq-card">
              <summary>
                <span className="faq-card__summary">
                  <span className="faq-card__icon">
                    <TaskIcon name={item.icon} />
                  </span>
                  <span className="faq-card__text">{item.question}</span>
                  <span className="faq-card__chevron" aria-hidden="true" />
                </span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="tasks-panel tasks-panel--cta">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Final Step</p>
          <h2>Ready for your first assignment?</h2>
        </div>
        <p className="tasks-panel__body-copy">
          Choose your package in the bot and get personalised tasks built around your kinks, limits, and toy list.
        </p>
        <div className="tasks-hero__actions">
          <a
            className="tasks-button tasks-button--primary"
            href={botRootUrl || '#packages'}
            onClick={handleBotAction(botRootUrl)}
          >
            Choose Package in Bot
          </a>
          <a
            className="tasks-button tasks-button--secondary"
            href={botRootUrl || '#packages'}
            onClick={handleBotAction(botRootUrl)}
          >
            Back to Bot
          </a>
        </div>
      </section>

      <div className="sticky-mobile-cta">
        <div className="sticky-mobile-cta__content">
          <span>{tiersQuery.data ? `${tiersQuery.data.total} packages ready` : 'Custom Obedience Tasks'}</span>
          <a
            className="tasks-button tasks-button--primary sticky-mobile-cta__button"
            href={botRootUrl || '#packages'}
            onClick={handleBotAction(botRootUrl)}
          >
            Choose Package in Bot
          </a>
        </div>
      </div>

      {tierId && (
        <TierDetailSheet
          tier={tierDetailQuery.data}
          loading={tierDetailQuery.isLoading}
          artworkVariant={tierArtworkVariants[tierId]}
        />
      )}
    </AppShell>
  );
}
