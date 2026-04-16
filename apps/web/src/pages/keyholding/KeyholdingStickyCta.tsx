type KeyholdingStickyCtaProps = {
  visible: boolean;
  onApply: () => void;
};

export function KeyholdingStickyCta({ visible, onApply }: KeyholdingStickyCtaProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="kh-sticky-cta" role="region" aria-label="Keyholding quick actions">
      <a className="kh-sticky-cta__btn" href="#tiers">
        Tiers
      </a>
      <button className="kh-sticky-cta__btn kh-sticky-cta__btn--primary" type="button" onClick={onApply}>
        Apply
      </button>
    </div>
  );
}
