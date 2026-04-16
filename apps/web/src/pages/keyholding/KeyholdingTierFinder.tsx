type KeyholdingTierFinderProps = {
  onJumpToTiers: () => void;
};

const OPTIONS = [
  { label: 'Curious / first lock', hint: 'Start at the entry tier and feel it out.' },
  { label: 'I want daily structure', hint: 'Look for tiers with tighter check-ins.' },
  { label: 'Maximum control', hint: 'Sort by intensity — highest tiers pull the shortest leash.' },
] as const;

export function KeyholdingTierFinder({ onJumpToTiers }: KeyholdingTierFinderProps) {
  return (
    <section className="kh-section" aria-labelledby="kh-finder-heading">
      <p className="kh-section__eyebrow">Find your fit</p>
      <h2 className="kh-section__title" id="kh-finder-heading">
        Where should you start?
      </h2>
      <p className="kh-section__lead">
        Tap what sounds closest — then compare names, duration, and price in the tier strip below. Every tier spells out
        what you get; progression should feel obvious from lighter to heavier contact.
      </p>
      <div className="kh-finder">
        <p className="kh-finder__label">Self-select (nudges you to the tier list — you still choose in application).</p>
        <div className="kh-finder__chips" role="group" aria-label="Starting point">
          {OPTIONS.map((o) => (
            <button key={o.label} type="button" className="kh-finder__chip" title={o.hint} onClick={onJumpToTiers}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
