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
  { label: 'Time-limited Telegram access', icon: 'package' },
  { label: 'One active task at a time', icon: 'clock' },
  { label: 'Proof submission & review by Mistress BJQueen', icon: 'shield' },
  { label: 'Selected from your setup', icon: 'sliders' },
] as const;

const HERO_PRIVATE_POINTS = [
  'Packages define duration and max tasks per day',
  'Setup captures categories, toys, timezone, send times, and auto-send',
  'Delivery stays inside Telegram with proof reviewed by Mistress BJQueen',
] as const;

const WHY_CUSTOM_POINTS = [
  {
    title: 'Preferences drive selection',
    detail:
      'Tasks are selected from a curated collection to match what you submit: categories, toys, limits, send times, chastity status, and delivery preferences.',
    icon: 'sliders',
  },
  {
    title: 'Structured pacing, one at a time',
    detail:
      'Only one task is active. Each package sets how long access lasts and how many tasks you can receive per day.',
    icon: 'clock',
  },
  {
    title: 'Proof keeps it accountable',
    detail:
      'Proof submission is built in. Submissions are reviewed by Mistress BJQueen so each task stays deliberate and accountable.',
    icon: 'shield',
  },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Choose your package',
    detail: 'Pick the duration and task pace that fits you. Purchase unlocks a time-limited window inside Telegram.',
    icon: 'package',
  },
  {
    title: 'Complete your setup',
    detail:
      'Fill in categories, toys, limits, timezone, send times, chastity status, and whether to auto-send or request.',
    icon: 'sliders',
  },
  {
    title: 'Receive tasks in Telegram',
    detail: 'Tasks are selected from a large collection to fit your saved setup and delivered in the bot. One task stays active at a time.',
    icon: 'scroll',
  },
  {
    title: 'Submit proof and continue',
    detail:
      'Send proof where required. Proof is reviewed by Mistress BJQueen, and you move to the next task within your package limits.',
    icon: 'chat',
  },
] as const;

const BENEFIT_POINTS = [
  {
    eyebrow: 'Tailored categories',
    title: 'Tasks follow the categories you allow',
    body: 'Your chosen categories and limits shape every task selected for you.',
    icon: 'wand',
  },
  {
    eyebrow: 'Built for your setup',
    title: 'Respects the toys and gear you own',
    body: 'Selections for toys and chastity status keep tasks realistic and immediate.',
    icon: 'toy',
  },
  {
    eyebrow: 'Delivered in Telegram',
    title: 'No extra apps needed',
    body: 'Tasks, proof (reviewed by Mistress BJQueen), and pacing live inside the Telegram bot during your access window.',
    icon: 'chat',
  },
  {
    eyebrow: 'Controlled pacing',
    title: 'Manual or scheduled delivery',
    body: 'Choose auto-send times or trigger tasks yourself, within your tier’s tasks-per-day cap.',
    icon: 'clock',
  },
  {
    eyebrow: 'Proof baked in',
    title: 'Submission and review included',
    body: 'Proof is requested where it matters and is manually reviewed by Mistress BJQueen before you continue.',
    icon: 'shield',
  },
  {
    eyebrow: 'One at a time',
    title: 'Stay focused on the current task',
    body: 'A new task appears only after you finish, abandon, or receive a review on the active one.',
    icon: 'signal',
  },
] as const;

const WHAT_YOURE_BUYING = [
  {
    title: 'A time-limited Custom Obedience package inside Telegram',
    detail: 'Access ends when the paid period finishes—no auto-renewals.',
    icon: 'package',
  },
  {
    title: 'Duration and pace set by the tier',
    detail: 'Each package defines how long you have and the maximum tasks per day.',
    icon: 'clock',
  },
  {
    title: 'Tasks selected from your saved setup',
    detail: 'Categories, toys, limits, timezone, send times, and auto-send guide which tasks are chosen for you.',
    icon: 'sliders',
  },
  {
    title: 'Delivery and proof handled in Telegram',
    detail: 'Tasks arrive in the bot; proof submission is built in and reviewed by Mistress BJQueen.',
    icon: 'chat',
  },
  {
    title: 'One active task at a time',
    detail: 'You progress task by task—finish, abandon, or get proof reviewed by Mistress BJQueen before the next one.',
    icon: 'shield',
  },
] as const;

const REASSURANCE_POINTS = [
  'Packages can start softer with fewer daily tasks.',
  'You do not need a big toy collection—tasks use what you have.',
  'Everything stays in Telegram with clear pacing and proof reviewed by Mistress BJQueen.',
] as const;

const FAQS = [
  {
    question: 'What am I buying?',
    answer:
      'A paid, time-limited Custom Obedience package inside the Telegram bot. Access ends automatically when the period you choose is over.',
    icon: 'package',
  },
  {
    question: 'Do I get one task or multiple?',
    answer:
      'You can receive multiple tasks during your access window, capped by your package’s tasks-per-day limit. Only one task is active at a time.',
    icon: 'clock',
  },
  {
    question: 'Is this a subscription?',
    answer: 'No. There is no auto-renew. You buy a package for a set duration and it expires when that time ends.',
    icon: 'shield',
  },
  {
    question: 'Are tasks based on my preferences?',
    answer:
      'Yes. Tasks are selected from a large collection to fit the preferences you save—categories, toys, limits, send times, chastity status, and delivery style.',
    icon: 'sliders',
  },
  {
    question: 'Is this live chat or sexting?',
    answer:
      'No. This is not live sexting or domme texting. Tasks are delivered by the Telegram bot with built-in proof submission that is manually reviewed by Mistress BJQueen.',
    icon: 'chat',
  },
  {
    question: 'How do I receive my tasks?',
    answer:
      'After buying, you finish setup in the bot. Tasks are then delivered in Telegram according to your chosen schedule or when you trigger them.',
    icon: 'help',
  },
  {
    question: 'What happens after payment?',
    answer:
      'You complete your setup, save preferences, and start receiving tasks selected to match you. Proof is manually reviewed by Mistress BJQueen before you move on, and access ends when your package expires.',
    icon: 'sparkles',
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
            src="/header.png?v=20260405b"
            alt="Mistress BJQueen Custom Obedience Tasks"
          />
          <div className="hero__banner-mask" aria-hidden="true" />
          <div className="hero__banner-copy">
            <span className="hero__banner-kicker">Mistress BJQueen&apos;s</span>
            <strong>Custom Obedience</strong>
            <span>Time-limited obedience packages in Telegram</span>
          </div>
        </div>
      </section>

      <section className="tasks-hero">
        <div className="tasks-hero__grid">
          <div className="tasks-hero__main">
            <p className="hero__eyebrow">Custom Obedience Tasks</p>
            <h1>Custom Obedience Tasks, delivered in Telegram</h1>
            <p className="tasks-hero__lead">
              Buy a time-limited package, set your categories, toys, schedule, limits, and auto-send preferences, then
              receive obedience tasks—hand-picked from a large collection to match your setup—one at a time with proof
              submission built in and reviewed by Mistress BJQueen.
            </p>
            <p className="tasks-hero__supporting-copy">
              Packages define how long you have and how many tasks you can receive per day. Everything runs inside the
              Telegram bot—no auto-renewals, no live sexting, just structured, custom tasks.
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
                Open in Telegram
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
          </div>

          <aside className="tasks-hero__aside">
            <article className="tasks-hero__private-card">
              <p className="tasks-hero__private-kicker">Private Offering</p>
              <strong>Structured, premium, and personal—inside Telegram.</strong>
              <p>
                Buy access, finish setup, and receive tasks that match your categories, toys, limits, and chosen pace.
                One task stays active until you complete, abandon, or have proof reviewed by Mistress BJQueen. No live
                chat, no auto-renew.
              </p>
              <div className="tasks-hero__private-list" aria-label="Private offering benefits">
                {HERO_PRIVATE_POINTS.map((point) => (
                  <div key={point} className="tasks-hero__private-item">
                    <span className="tasks-hero__private-dot" aria-hidden="true" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </div>
      </section>

      <section className="tasks-manifesto">
        <div className="tasks-manifesto__intro">
          <p className="hero__eyebrow">Why Custom Feels Different</p>
          <h2>Guided, accountable, and written around you</h2>
          <p className="tasks-panel__body-copy">
            You are not buying a generic chatbot or a fixed list of scripts. You are buying a time-limited, structured
            flow where tasks are selected to match your setup and kept accountable with proof reviewed by Mistress
            BJQueen.
          </p>
        </div>
        <div className="tasks-manifesto__quote">
          <strong>Personalised, paced, and worth paying for because it stays focused on you.</strong>
        </div>
        <div className="tasks-manifesto__grid" aria-label="Why custom feels different">
          {WHY_CUSTOM_POINTS.map((point) => (
            <article key={point.title} className="tasks-manifesto__item">
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
          <h2>Simple to start. Clear from the first task.</h2>
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
          <p className="hero__eyebrow">Benefits</p>
          <h2>Why this feels structured and custom</h2>
        </div>
        <p className="tasks-panel__body-copy">Everything here is designed to keep the flow personal, accountable, and inside Telegram.</p>
        <div className="tasks-style-grid" aria-label="Examples of custom task styles">
          {BENEFIT_POINTS.map((card) => (
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
            <h2>Choose the package that fits your pace</h2>
            <p className="tasks-panel__body-copy">
              Each package sets the access window and maximum tasks per day. Payment, setup, delivery, and proof
              (reviewed by Mistress BJQueen) all happen inside the Telegram bot.
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

      <section className="tasks-panel tasks-panel--light">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">What You&apos;re Buying</p>
          <h2>Plainly, here&apos;s what this product is</h2>
        </div>
        <p className="tasks-panel__body-copy">No surprises, no auto-renewal, and no generic scripts.</p>
        <div className="tasks-benefits" aria-label="Why custom packages feel different">
          {WHAT_YOURE_BUYING.map((point) => (
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

      <section className="tasks-panel">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Beginner Reassurance</p>
          <h2>Easy to start, even if this is your first time</h2>
        </div>
        <div className="tasks-reassurance">
          <p className="tasks-panel__body-copy">
            You do not need a huge toy collection or advanced experience. Packages can be shaped around a simpler setup
            and a lighter pace if that suits you better.
          </p>
          <div className="tasks-strip tasks-strip--soft" aria-label="Beginner reassurance">
            {REASSURANCE_POINTS.map((point) => (
              <div key={point} className="tasks-chip tasks-chip--soft">
                <span className="tasks-chip__icon">
                  <TaskIcon name="shield" />
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tasks-panel tasks-panel--faq">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">FAQ</p>
          <h2>Questions before you choose your package?</h2>
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
          <p className="hero__eyebrow">Ready When You Are</p>
          <h2>Choose your package and start in Telegram</h2>
        </div>
        <p className="tasks-panel__body-copy">
          Pick the duration and pace, complete setup in the bot, and start receiving tasks selected to fit you one at a
          time with built-in proof reviewed by Mistress BJQueen.
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
            Open in Telegram
          </a>
        </div>
      </section>

      <div className="sticky-mobile-cta">
        <div className="sticky-mobile-cta__content">
          <span>{tiersQuery.data ? `${tiersQuery.data.total} custom packages ready` : 'Custom Obedience Tasks'}</span>
          <a className="tasks-button tasks-button--primary sticky-mobile-cta__button" href="#packages">
            Choose Package
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
