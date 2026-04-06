export function CategorySkeleton() {
  return (
    <div className="dsc-section">
      <div className="dsc-section-header">
        <div>
          <div className="dsc-section-title">Browse by category</div>
        </div>
      </div>
      <div className="category-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="category-card skeleton-shimmer" style={{ minHeight: 180, background: undefined }} />
        ))}
      </div>
    </div>
  );
}
