const STEPS = [
  {
    title: 'Apply',
    body: 'You choose a tier and submit—how long you want structure for, how heavy contact should be, and why you’re serious.',
  },
  {
    title: 'Screening',
    body: 'I review every application. Fit matters; not everyone is accepted. If we’re not a match, you’ll hear that clearly.',
  },
  {
    title: 'Sign contract',
    body: 'Terms, consent, and boundaries go in writing. Nothing vague once we start—you know what you’re agreeing to.',
  },
  {
    title: 'Pay fees',
    body: 'Your tier price is settled up front before the dynamic opens—no “we’ll figure it out later” on money.',
  },
  {
    title: 'Lock the cock',
    body: 'Your cage goes on. That’s when check-ins, proof, and my rules actually start, not during apply, screening, contract, or payment.',
  },
] as const;

export function KeyholdingHowItWorks() {
  return (
    <section className="kh-section" id="how-it-works" aria-labelledby="kh-how-heading">
      <p className="kh-section__eyebrow">How it works</p>
      <h2 className="kh-section__title" id="kh-how-heading">
        From application to locked cock
      </h2>
      <p className="kh-section__lead">
        Apply, screening, sign contract, pay fees, lock the cock—in that order, no shortcuts.
      </p>
      <div className="kh-steps kh-plain">
        {STEPS.map((step) => (
          <div key={step.title} className="kh-step">
            <div className="kh-step__num" aria-hidden="true" />
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
