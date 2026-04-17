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
        src="/header-keyholding.jpeg?v=20260409a"
        alt="Mistress BJQueen, remote chastity keyholding"
      />
      <div className="kh-hero__panel">
        <p className="kh-section__eyebrow">Remote chastity keyholding</p>
        <h1 className="kh-hero__title">Your cage stays on. Your keys don’t stay with you.</h1>
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
            <a className="tasks-button tasks-button--primary" href="#tiers">
              View tiers
            </a>
            <a className="tasks-button tasks-button--secondary" href="#how-it-works">
              How it works
            </a>
          </div>
          <button className="kh-hero__apply" type="button" onClick={onApply}>
            Apply now
          </button>
        </div>
      </div>
    </header>
  );
}
