'use client';

/**
 * Shared page header component.
 * Renders a consistent sticky title bar with optional controls across all pages.
 *
 * Props:
 *   title     — Page title (required)
 *   subtitle  — Optional description text below the title
 *   count     — Optional count badge next to the title (e.g. "324 subscriptions")
 *   right     — Optional ReactNode rendered on the right side (clock, search, etc.)
 *   children  — Optional controls row (pills, toggles, buttons) rendered below the title
 *   sticky    — Whether the header sticks on scroll (default: true)
 */
export default function PageHeader({ title, subtitle, count, right, children, sticky = true }) {
  return (
    <div className={`page-header-wrap${sticky ? ' sticky-bar' : ''}`}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{title}</h1>
          {count && <p className="page-header-count">{count}</p>}
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {right && <div className="page-header-right">{right}</div>}
      </div>
      {children && (
        <div className="ct-controls-row">
          {children}
        </div>
      )}
    </div>
  );
}
