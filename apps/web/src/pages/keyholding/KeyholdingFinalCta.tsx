type KeyholdingFinalCtaProps = {
  onApply: () => void;
};

export function KeyholdingFinalCta({ onApply }: KeyholdingFinalCtaProps) {
  return (
    <section className="kh-section kh-final tasks-panel tasks-panel--cta" id="kh-final-cta">
      <p className="kh-section__eyebrow">Application</p>
      <h2 className="kh-section__title">Serious control — limited patience for flakes</h2>
      <p className="tasks-panel__body-copy">
        Pick a tier that matches your hunger for structure. Submit a clean application. If we align, your calendar becomes
        mine to toy with — denial, tasks, and release on terms you don’t get to rewrite mid-stream.
      </p>
      <div className="tasks-hero__actions">
        <a className="tasks-button tasks-button--secondary" href="#tiers">
          Review tiers again
        </a>
        <button className="tasks-button tasks-button--primary" type="button" onClick={onApply}>
          Apply for keyholding
        </button>
      </div>
    </section>
  );
}
