import { useEffect, useRef } from 'react';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { TierCarousel } from '../components/TierCarousel';
import { TelegramDevBanner } from '../components/TelegramDevBanner';
import { CurrencyToggleBanner } from '../components/CurrencyToggleBanner';
import { setAnalyticsContext } from '../app/analytics';
import { applyTelegramTheme } from '../app/telegram';
import { useTelegramSession } from '../features/auth/hooks';
import { trackMiniAppOpenAttributed } from '../features/clips/analytics';
import { useTiers } from '../features/tiers/hooks';

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
  { label: 'Proof reviewed by Mistress BJQueen', icon: 'shield' },
  { label: 'Tailored to your selected preferences', icon: 'sliders' },
] as const;

const HERO_PRIVATE_POINTS = [
  'Packages define duration and max tasks per day',
  'Setup captures categories, sex toys/props, timezone, send times, and auto-send',
  'Delivery stays inside Telegram with proof reviewed by Mistress BJQueen',
] as const;

const WHY_CUSTOM_POINTS = [
  {
    title: 'Preferences drive selection',
    detail:
      'Tasks are selected from a curated collection to match what you submit: categories, sex toys/props, limits, send times, chastity status, and delivery preferences.',
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
    detail:
      'Pick the duration and task pace you want. Your package determines how long I can give you tasks for and the maximum number of tasks you can receive each day.',
    icon: 'package',
  },
  {
    title: 'Complete your setup',
    detail:
      'Select your fetish categories, intensity, available sex toys/props, timezone, send times, chastity status and whether to auto-send or request.',
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
      'Send proof you have completed the task. Proof is reviewed by Mistress BJQueen, and accepted/rejected. Once accepted you move to the next task within your package limits.',
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
    title: 'Respects the sex toys/props you own',
    body: 'Selections for sex toys/props like a dildo, gag, vibrator, or buttplug keep tasks realistic and immediate.',
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
    body:
      'A new task may be requested only after you abandon the active task or receive proof approval from Mistress BJQueen, and only if you still have unused tasks remaining for the current day.',
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
    detail:
      'Fetish categories, sex toys/props, limits, timezone, send times, and auto-send guide which tasks are chosen for you.',
    icon: 'sliders',
  },
  {
    title: 'Delivery and proof handled in Telegram',
    detail: 'Tasks arrive in the bot; proof submission is built in and reviewed by Mistress BJQueen.',
    icon: 'chat',
  },
  {
    title: 'One active task at a time',
    detail:
      'A new task may be requested only after you abandon the active task or receive proof approval from Mistress BJQueen, and only if you still have unused tasks remaining for the current day.',
    icon: 'shield',
  },
] as const;

const REASSURANCE_POINTS = [
  'Submissive men who want strict direction.',
  'You deliver proof for every order without excuses.',
  'You accept my approval or rejection as final.',
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
      'Yes. Tasks are selected from a large collection to fit the preferences you save, including categories, sex toys/props, limits, send times, chastity status, and delivery style.',
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

const CATEGORY_LIST = [
  'Anal Training',
  'Bondage and Restraint',
  'CBT (Light, Consensual)',
  'Chastity Control',
  'Cuckold Inferiority',
  'Dildo Training',
  'Discipline and Conditioning',
  'Dress Code and Underwear Control',
  'Edging',
  'Feminization (Non-verbal)',
  'Humiliation',
  'Inspection and Compliance',
  'Light Impact Play',
  'Light Wax Play',
  'Magnet Play',
  'Marking and Ownership',
  'Mild CBT',
  'Objectification',
  'Orgasm Denial',
  'Ruined Orgasm Training',
  'Sensory Deprivation',
  'Service Tasks',
  'Sissification (Non-verbal)',
  'SPH (Small Penis Humiliation)',
  'Tease and Denial',
  'Temperature Play',
  'Texture Play',
];

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
  const tiersQuery = useTiers();
  const didTrackOpenRef = useRef(false);

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
    if (didTrackOpenRef.current) {
      return;
    }
    didTrackOpenRef.current = true;
    trackMiniAppOpenAttributed({
      startParam: session.startParam,
      isTelegram: session.isTelegram,
      entryPath: '/tasks',
    });
  }, [session.isTelegram, session.startParam]);

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
          src="/header-obedience.jpeg?v=20260409a"
          alt="Mistress BJQueen Custom Obedience Tasks banner"
        />
      </section>

      <section className="tasks-hero">
        <div className="tasks-hero__grid">
          <div className="tasks-hero__main">
            <p className="hero__eyebrow">Custom Obedience Tasks</p>
            <h1>You are here to be given instructions and judged on how well you follow them.</h1>
            <p className="tasks-hero__lead">
              Over a set period of time, I assign tasks for my amusement and your obedience. You choose the categories.
              I decide the tasks. You complete them properly and submit the proof I require.
            </p>
            <p className="tasks-hero__supporting-copy">
              Every task requires photo, audio, or video proof. I judge every submission myself and decide whether it is
              accepted based on your effort and how closely you followed the task instructions.
            </p>
            <div className="tasks-hero__actions">
              <a className="tasks-button tasks-button--primary" href="#packages">
                Begin Obedience
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
                Buy access, finish setup, and receive tasks that match your categories, sex toys/props, limits, and
                chosen pace. One task stays active until you complete it, submit the required proof, and Mistress
                BJQueen accepts it.
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

      <section className="tasks-panel tasks-panel--light tasks-categories">
        <div className="tasks-panel__header">
          <p className="hero__eyebrow">Available Fetish Categories</p>
          <h2>Task categories you can choose from</h2>
        </div>
        <p className="tasks-panel__body-copy">
          Choose the categories that fit your kinks, limits, and interests. Your tasks are selected from your saved
          preferences, so what you pick here shapes what you receive.
        </p>
        <div className="tasks-category-grid" aria-label="Selectable task categories">
          {CATEGORY_LIST.map((category) => (
            <div key={category} className="tasks-category-chip">
              <span className="tasks-category-dot" aria-hidden="true" />
              <span>{category}</span>
            </div>
          ))}
        </div>
        <p className="tasks-panel__supporting-copy tasks-category-note">
          You stay in control of your selected categories, and your saved preferences shape every task that is chosen
          for you.
        </p>
      </section>

      <section className="tasks-section" id="packages">
        <div className="tasks-section__header tasks-section__header--stacked">
          <div className="tasks-section__copy">
            <p className="hero__eyebrow">Packages</p>
            <h2>Choose the package that fits your pace</h2>
            <p className="tasks-panel__body-copy">
              Each package determines how long I can give you tasks for and the maximum number of tasks you can receive
              each day. Setup, task delivery, and proof review all happen inside Telegram.
            </p>
          </div>
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
          <p className="hero__eyebrow">Who this is for</p>
          <h2>Who this is for</h2>
        </div>
        <div className="tasks-reassurance">
          <p className="tasks-panel__body-copy">
            This is for submissive men who want structure, direction, and to be judged on how well they follow
            instructions. If you can complete tasks properly and submit proof for approval, you will fit here.
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
        </div>
      </section>

      <div className="sticky-mobile-cta">
        <div className="sticky-mobile-cta__content" />
      </div>
    </AppShell>
  );
}
