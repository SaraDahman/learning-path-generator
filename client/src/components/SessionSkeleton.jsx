export default function SessionSkeleton() {
  return (
    <div className="session-card" aria-busy="true" aria-live="polite">
      <div className="session-badge" />
      <p className="session-skeleton-line session-skeleton-eyebrow" />
      <p className="session-skeleton-line session-skeleton-title" />
      <p className="session-skeleton-line session-skeleton-body" />
      <p className="session-skeleton-line session-skeleton-button" />
      <span className="sr-only">Checking your session</span>
    </div>
  );
}
