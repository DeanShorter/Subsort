'use client';

/**
 * Shared page header component.
 * Renders a consistent title bar across all pages.
 *
 * Props:
 *   title     — Page title (required)
 *   subtitle  — Optional description text below the title
 *   count     — Optional count badge next to the title (e.g. "324 subscriptions")
 *   right     — Optional ReactNode rendered on the right side (clock, search, etc.)
 */
export default function PageHeader({ title, subtitle, count, right }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1 className="page-title">{title}</h1>
        {count && <p className="page-header-count">{count}</p>}
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {right && <div className="page-header-right">{right}</div>}
    </div>
  );
}
