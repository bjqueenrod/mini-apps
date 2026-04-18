const VALUE_PILLS = [
  'Stay locked',
  'Real check-ins',
  'Obedience tasks',
  'Denial & release by me',
  'Application only',
  'Tiered intensity',
] as const;

type KeyholdingHeroProps = {
  onApply: () => void;
};

export function KeyholdingHero({ onApply }: KeyholdingHeroProps) {
  return (
    <header className="kh-hero">
      <img
        className="kh-hero__banner"
        src="/header-keyholding.png?v=20260418g"
        alt="Mistress BJQueen, remote chastity keyholding"
        width={1024}
        height={642}
      />
      <div className="kh-hero__panel">
        <p className="kh-section__eyebrow">Remote chastity keyholding</p>
        <h1 className="kh-hero__title">Your cock stays locked. I control the keys.</h1>
        <p className="kh-hero__sub">
          A structured, remote keyholding relationship: you remain locked, you report in on my terms, and release is earned,
          never assumed. Tiers set how intense contact and accountability become; entry is by application only.
        </p>
        <ul className="kh-value-row" aria-label="What this service is">
          {VALUE_PILLS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
        <div className="kh-hero__actions">
          <div className="kh-hero__row">
            <a className="tasks-button tasks-button--primary kh-hero__btn kh-hero__btn--view" href="#tiers">
              View tiers
            </a>
            <a className="tasks-button tasks-button--secondary kh-hero__btn kh-hero__btn--how" href="#how-it-works">
              How it works
            </a>
          </div>
          <button className="kh-hero__apply kh-hero__btn kh-hero__btn--apply" type="button" onClick={onApply}>
            Apply now
          </button>
        </div>
      </div>
    </header>
  );
}
