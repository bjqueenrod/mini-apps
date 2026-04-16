import { EmptyState } from '../../components/EmptyState';
import { KeyholdingOption } from '../../features/keyholding/types';

type KeyholdingControlMethodsProps = {
  options: KeyholdingOption[];
  loading: boolean;
};

export function KeyholdingControlMethods({ options, loading }: KeyholdingControlMethodsProps) {
  if (loading && options.length === 0) {
    return (
      <section className="kh-section" aria-labelledby="kh-control-heading">
        <p className="kh-section__eyebrow">Key control</p>
        <h2 className="kh-section__title" id="kh-control-heading">
          How your keys are controlled
        </h2>
        <div className="skeleton-card" style={{ height: 100 }} aria-hidden="true" />
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
        Remote keyholding needs a real lock story — Chaster, a lockbox, numbered tags, or another verifiable method.
        What’s available can vary; the list below reflects what’s configured for applications right now.
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
