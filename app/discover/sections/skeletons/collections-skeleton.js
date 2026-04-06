export function CollectionsSkeleton() {
  return (
    <>
      {[0, 1, 2].map(section => (
        <div key={section} className="collections-subsection">
          <div className="dsc-section-header">
            <div>
              <div className="skeleton-line skeleton-shimmer" style={{ width: 140, height: 20, marginBottom: 6 }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: 280, height: 13 }} />
            </div>
          </div>
          <div className="collections-grid">
            {[0, 1, 2].map(card => (
              <div key={card} className="collection-card">
                <div className="collection-card-header skeleton-shimmer" />
                <div className="collection-card-body">
                  <div className="skeleton-line skeleton-shimmer" style={{ width: 60, height: 18, marginBottom: 12 }} />
                  <div className="skeleton-line skeleton-shimmer" style={{ width: '80%', height: 18, marginBottom: 10 }} />
                  <div className="skeleton-line skeleton-shimmer" style={{ width: '100%', height: 12, marginBottom: 4 }} />
                  <div className="skeleton-line skeleton-shimmer" style={{ width: '90%', height: 12, marginBottom: 4 }} />
                  <div className="skeleton-line skeleton-shimmer" style={{ width: '70%', height: 12, marginBottom: 14 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
