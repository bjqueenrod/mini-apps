export function EmptyState({
  title = 'No clips match this search yet.',
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {message ? <div>{message}</div> : null}
    </div>
  );
}
