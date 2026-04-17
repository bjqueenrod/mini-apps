import { EmptyState } from '../../components/EmptyState';
import { KeyholdingOption } from '../../features/keyholding/types';

type KeyholdingControlMethodsProps = {
  options: KeyholdingOption[];
  loading: boolean;
};

export function KeyholdingControlMethods({ options, loading }: KeyholdingControlMethodsProps) {
  if (loading && options.length === 0) {
    return (
      <section
        className="kh-section"
        aria-labelledby="kh-control-heading"
        aria-busy="true"
      >
        <p className="kh-section__eyebrow">Key control</p>
        <h2 className="kh-section__title" id="kh-control-heading">
          How your keys are controlled
        </h2>
        <div className="kh-control-shimmer" aria-hidden="true">
          <div className="kh-control-shimmer__lead">
            <div className="kh-control-shimmer__line kh-control-shimmer__line--lead-wide" />
            <div className="kh-control-shimmer__line kh-control-shimmer__line--lead-wide" />
            <div className="kh-control-shimmer__line kh-control-shimmer__line--lead-short" />
          </div>
          <div className="kh-options-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="kh-control-shimmer__card">
                <div className="kh-control-shimmer__line kh-control-shimmer__line--option-title" />
                <div className="kh-control-shimmer__line kh-control-shimmer__line--option-body" />
                <div className="kh-control-shimmer__line kh-control-shimmer__line--option-body kh-control-shimmer__line--option-body-short" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!loading && options.length === 0) {
    return (
      <section className="kh-section" id="control-methods" aria-labelledby="kh-control-heading">
        <p className="kh-section__eyebrow">Key control</p>
        <h2 className="kh-section__title" id="kh-control-heading">
          How your keys are controlled
        </h2>
        <EmptyState title="No lock methods listed" message="Keyholding options will appear when configured." />
      </section>
    );
  }

  const sorted = options.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <section className="kh-section" id="control-methods" aria-labelledby="kh-control-heading">
      <p className="kh-section__eyebrow">Key control</p>
      <h2 className="kh-section__title" id="kh-control-heading">
        How your keys are controlled
      </h2>
      <p className="kh-section__lead">
        Remote keyholding needs me, the keyholder, to have full control over the access to the key(s) that unlock your
        cock cage. Various ways of doing this are available.
      </p>
      <div className="kh-options-grid">
        {sorted.map((option) => (
          <div key={option.id} className="kh-option">
            <strong>{option.label}</strong>
            <p>{option.tooltip || 'Verification and rules apply once you’re accepted into a tier.'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
