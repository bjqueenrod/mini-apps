const STEPS = [
  {
    title: 'Apply & choose a tier',
    body: 'You tell me how long you want structure for and how intense contact should be. I review every application. Not everyone is accepted.',
  },
  {
    title: 'Lock & hand over the timeline',
    body: 'You stay caged. Check-in windows, proof, and messaging rules are set by the tier, not improvised day by day.',
  },
  {
    title: 'Report, task, obey',
    body: 'You show up when required. Tasks may land between check-ins to keep you sharp and compliant.',
  },
  {
    title: 'Denial & release on my terms',
    body: 'When, or if, you get relief is part of the dynamic. “I’m desperate” is not an automatic unlock.',
  },
  {
    title: 'Stay consistent or lose the spot',
    body: 'Ghosting, skipping proof, or negotiating every rule breaks the container. I protect the dynamic by enforcing it.',
  },
] as const;

export function KeyholdingHowItWorks() {
  return (
    <section className="kh-section" id="how-it-works" aria-labelledby="kh-how-heading">
      <p className="kh-section__eyebrow">How it works</p>
      <h2 className="kh-section__title" id="kh-how-heading">
        From application to owned calendar
      </h2>
      <p className="kh-section__lead">
        Five steps: quick to read when you’re deciding, binding once you’re in.
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
