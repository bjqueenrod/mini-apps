const POINTS = [
  {
    icon: '◎',
    title: 'Expected reporting',
    body: 'Check-ins aren’t “when you feel like it.” They’re part of the control — missed windows mean something.',
  },
  {
    icon: '◇',
    title: 'Tasks with purpose',
    body: 'Obedience tasks aren’t filler — they keep you occupied, honest, and reminded who owns the timeline.',
  },
  {
    icon: '✦',
    title: 'Accountability you can feel',
    body: 'Proof, consistency, and tone of messaging are all part of the structure — not optional flavor text.',
  },
  {
    icon: '⬡',
    title: 'Consequences & privileges',
    body: 'Good behavior can earn relief; breaking the structure costs you. That trade is the point.',
  },
] as const;

export function KeyholdingWhyDifferent() {
  return (
    <section className="kh-section" aria-labelledby="kh-why-heading">
      <p className="kh-section__eyebrow">Why this feels different</p>
      <h2 className="kh-section__title" id="kh-why-heading">
        Not “messaging a Domme when you’re horny”
      </h2>
      <p className="kh-section__lead">
        Plenty of people want attention. This is for people who want a{' '}
        <em>live keyholding dynamic</em> with reporting, structure, and outcomes — even at a distance.
      </p>
      <div className="kh-manifesto">
        {POINTS.map((p) => (
          <div key={p.title} className="kh-manifesto__item">
            <span className="kh-manifesto__mark" aria-hidden="true">
              {p.icon}
            </span>
            <div>
              <strong>{p.title}</strong>
              <p>{p.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
