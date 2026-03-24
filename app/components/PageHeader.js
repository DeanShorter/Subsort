'use client';

/**
 * Universal page header component.
 *
 * Classes: .page-header, .ph-title-bar, .ph-left, .ph-title,
 *          .ph-count, .ph-subtitle, .ph-right, .ph-filters
 *
 * Props:
 *   title     — Page title (required)
 *   subtitle  — Optional text beside the title
 *   count     — Optional count beside the title
 *   right     — Optional ReactNode for the right side (buttons, search, etc.)
 *   filters   — Optional ReactNode for the filter chips row
 *   sticky    — Whether the header sticks on scroll (default: true when right/filters present)
 */
export default function PageHeader({ title, subtitle, count, right, filters, sticky }) {
  const isSticky = sticky !== undefined ? sticky : !!(right || filters);

  return (
    <div className={`page-header${isSticky ? ' sticky-bar' : ''}`}>
      <div className="ph-title-bar">
        <div className="ph-left">
          <h1 className="ph-title">{title}</h1>
          {count && <span className="ph-count">{count}</span>}
          {subtitle && <span className="ph-subtitle">{subtitle}</span>}
        </div>
        {right && <div className="ph-right">{right}</div>}
      </div>
      {filters && (
        <div className="ph-filters">
          {filters}
        </div>
      )}
    </div>
  );
}
