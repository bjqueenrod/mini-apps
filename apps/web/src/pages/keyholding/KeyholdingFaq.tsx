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
    a: 'Consequences are part of the dynamic: extra denial, task load, loss of privileges, or ended access if you’re wasting the container.',
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
  return (
    <section className="kh-section kh-faq" id="faq" aria-labelledby="kh-faq-heading">
      <p className="kh-section__eyebrow">FAQ</p>
      <h2 className="kh-section__title" id="kh-faq-heading">
        Questions that decide “yes or no”
      </h2>
      <p className="kh-section__lead">Straight answers. Read before you apply.</p>
      <div className="faq-list">
        {FAQ.map((item) => (
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
  );
}
