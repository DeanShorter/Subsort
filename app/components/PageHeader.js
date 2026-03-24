'use client';
import { useState, useEffect, useRef } from 'react';

/**
 * Shared page header component.
 * Title section hides on scroll down, controls row stays sticky.
 *
 * Props:
 *   title     — Page title (required)
 *   subtitle  — Optional description text below the title
 *   count     — Optional count badge next to the title
 *   right     — Optional ReactNode rendered on the right side
 *   children  — Optional controls row (pills, toggles, buttons)
 *   sticky    — Whether controls stick on scroll (default: true when children present)
 */
export default function PageHeader({ title, subtitle, count, right, children, sticky }) {
  const [scrolled, setScrolled] = useState(false);
  const wrapRef = useRef(null);

  // Auto-detect sticky: true when children exist, false otherwise
  const isSticky = sticky !== undefined ? sticky : !!children;

  useEffect(() => {
    if (!isSticky) return;

    const scrollParent = wrapRef.current?.closest('.home-main') || wrapRef.current?.closest('.app-content');
    if (!scrollParent) return;

    let lastScroll = 0;
    const onScroll = () => {
      const y = scrollParent.scrollTop;
      setScrolled(y > 48);
      lastScroll = y;
    };

    scrollParent.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollParent.removeEventListener('scroll', onScroll);
  }, [isSticky]);

  return (
    <div ref={wrapRef} className={`page-header-wrap${isSticky ? ' sticky-bar' : ''}${scrolled ? ' scrolled' : ''}`}>
      <div className={`page-header${scrolled ? ' page-header-hidden' : ''}`}>
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
