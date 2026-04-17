const OPTIONS = [
  {
    label: 'Curious / first lock',
    hint: 'Jumps to the entry tier — lighter accountability.',
    tierIndex: 0,
  },
  {
    label: 'I want daily structure',
    hint: 'Jumps to the mid tier — tighter check-ins and pacing.',
    tierIndex: 1,
  },
  {
    label: 'Full enforcement',
    hint: 'Jumps to the heavier tier — more tasks, stricter proof.',
    tierIndex: 2,
  },
  {
    label: 'Maximum control',
    hint: 'Jumps to the most intense tier — shortest leash.',
    tierIndex: 3,
  },
] as const;

type KeyholdingTierFinderProps = {
  /** Number of tiers from the API (used to clamp index if fewer than four). */
  tierCount: number;
  onJumpToTier: (tierIndex: number) => void;
};

export function KeyholdingTierFinder({ tierCount, onJumpToTier }: KeyholdingTierFinderProps) {
  return (
    <section className="kh-section" aria-labelledby="kh-finder-heading">
      <p className="kh-section__eyebrow">Find your fit</p>
      <h2 className="kh-section__title" id="kh-finder-heading">
        Where should you start?
      </h2>
      <p className="kh-section__lead">
        Tap a lane — we scroll straight to that tier card below. Compare names, duration, and price; progression should
        read from lighter to heavier contact. You still pick the exact tier in application.
      </p>
      <div className="kh-finder">
        <div className="kh-finder__chips" role="group" aria-label="Jump to tier">
          {OPTIONS.map((o) => {
            const title =
              tierCount === 0
                ? `${o.hint} (tiers loading — opens tier section)`
                : `${o.hint} Opens tier ${Math.min(o.tierIndex, Math.max(0, tierCount - 1)) + 1} of ${tierCount}.`;
            return (
              <button
                key={o.label}
                type="button"
                className="kh-finder__chip"
                title={title}
                onClick={() => onJumpToTier(o.tierIndex)}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
