export function ForYouSkeleton() {
  return (
    <div className="dsc-section">
      <div className="dsc-section-header">
        <div>
          <div className="dsc-section-title">For you</div>
        </div>
      </div>
      <div className="foryou-scroll">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="foryou-card skeleton-card">
            <div className="skeleton-avatar skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer" style={{ width: '70%' }} />
            <div className="skeleton-line skeleton-shimmer" style={{ width: '50%', height: 11 }} />
            <div className="skeleton-badge skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer" style={{ width: '40%', height: 11 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
