export function FilterBar({
  items,
  value,
  onChange,
  variant = 'category',
  includeAll = true,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'category' | 'tag';
  includeAll?: boolean;
}) {
  return (
    <div className={`filter-bar filter-bar--${variant}`}>
      {includeAll && (
        <button className={!value ? 'is-active' : ''} onClick={() => onChange('')} type="button">
          All
        </button>
      )}
      {items.map((item) => (
        <button
          key={item}
          className={value === item ? 'is-active' : ''}
          onClick={() => onChange(value === item ? '' : item)}
          type="button"
        >
          {variant === 'tag' ? `#${item}` : item}
        </button>
      ))}
    </div>
  );
}
