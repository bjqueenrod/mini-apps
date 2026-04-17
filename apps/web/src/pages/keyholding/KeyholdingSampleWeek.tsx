const ROWS = [
  { day: 'Mon', text: 'Morning check-in window: photo + short status. Denial continues unless I say otherwise.' },
  { day: 'Tue', text: 'Obedience task may drop: discrete, doable, proof required by the deadline I set.' },
  { day: 'Wed', text: 'Midweek pulse: consistency matters more than “perfect horny essays.”' },
  { day: 'Thu', text: 'Edge / denial framing if your tier includes tighter sexual control. Still on my clock.' },
  { day: 'Fri', text: 'Proof stack review: sloppy submissions get corrected, not rewarded.' },
  { day: 'Sat–Sun', text: 'Weekend rules vary by tier: lighter touch or heavier leash. Read your tier card honestly.' },
] as const;

export function KeyholdingSampleWeek() {
  return (
    <section className="kh-section" aria-labelledby="kh-week-heading">
      <p className="kh-section__eyebrow">Sample rhythm</p>
      <h2 className="kh-section__title" id="kh-week-heading">
        A week inside the container
      </h2>
      <p className="kh-section__lead">
        Exact timing and intensity depend on your tier. This is the <em>shape</em> of the dynamic, not a literal
        minute-by-minute script.
      </p>
      <figure className="kh-section-art" aria-hidden="true">
        <img
          src="/images/unsplash/padlock-chain-gate.jpg?v=20260417m"
          alt=""
          width={1600}
          height={500}
          loading="lazy"
          decoding="async"
        />
      </figure>
      <div className="kh-week">
        {ROWS.map((row) => (
          <div key={row.day} className="kh-week__row">
            <span className="kh-week__day">{row.day}</span>
            <p className="kh-week__text">{row.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
