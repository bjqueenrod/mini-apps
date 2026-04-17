import { useState } from 'react';

const FAQ = [
  {
    q: 'Do I need a cage already?',
    a: 'You need a workable chastity setup I can trust at a distance: usually a cage plus a lock method we can verify (Chaster, lockbox, etc.). If you can’t lock safely and prove it, this isn’t the right fit.',
  },
  {
    q: 'How often will I hear from you?',
    a: 'That’s tier-dependent. Higher tiers tighten the leash: more check-ins, faster accountability, and clearer expectations around replies. Read the tier cards: they’re written to spell out intensity, not vague vibes.',
  },
  {
    q: 'Can I unlock for cleaning?',
    a: 'Only when the structure allows, and often with proof. “I want out” is not the same as “I’m following hygiene rules you set.”',
  },
  {
    q: 'What happens if I break rules?',
    a: 'Consequences are part of the dynamic: extra time, more tasks, monetary fines, loss of privileges, or contract termination.',
  },
  {
    q: 'What if I’m new to keyholding?',
    a: 'That’s fine if you’re honest about it. Choose a tier that matches your discipline. You can grow into heavier control once you prove you can handle the basics.',
  },
  {
    q: 'Is everyone accepted?',
    a: 'No. Applications exist so I can filter for compatibility, reliability, and respect for structure. If we’re not aligned, you’ll be declined. It’s not personal, it’s professional.',
  },
  {
    q: 'How quickly do you reply?',
    a: 'Reply cadence is framed by tier and workload, not on-demand 24/7 texting for every package. Expect clarity in the tier description, not improvisation.',
  },
] as const;

export function KeyholdingFaq() {
  const [showFaq, setShowFaq] = useState(false);
  const [openFaqQuestion, setOpenFaqQuestion] = useState<string | null>(null);

  return (
    <section
      className={`kh-section kh-faq tasks-panel tasks-panel--faq clips-faq${showFaq ? ' clips-faq--open' : ''}`}
      id="faq"
      aria-labelledby="kh-faq-heading"
    >
      <div className="tasks-panel__header">
        <p className="kh-section__eyebrow">FAQ</p>
        <h2 id="kh-faq-heading">Questions that decide “yes or no”</h2>
        <p className="kh-section__lead">Straight answers. Read before you apply.</p>
        <button
          type="button"
          className="clips-faq__toggle"
          aria-expanded={showFaq}
          onClick={() => {
            setShowFaq((current) => {
              const next = !current;
              if (!next) {
                setOpenFaqQuestion(null);
              }
              return next;
            });
          }}
        >
          {showFaq ? 'Hide FAQ' : 'Show FAQ'}
        </button>
      </div>
      <div className="clips-faq__body" aria-hidden={!showFaq}>
        <div className="clips-faq__body-inner">
          <div className="faq-list">
            {FAQ.map((item) => (
              <details key={item.q} className="faq-card" open={openFaqQuestion === item.q}>
                <summary
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenFaqQuestion((current) => (current === item.q ? null : item.q));
                  }}
                >
                  <span className="faq-card__summary">
                    <span className="faq-card__icon" aria-hidden="true">
                      ❔
                    </span>
                    <span className="faq-card__text">{item.q}</span>
                    <span className="faq-card__chevron" aria-hidden="true" />
                  </span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
