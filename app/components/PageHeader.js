'use client';
import { useState, useEffect, useRef } from 'react';

/**
 * Shared page header component (BEM naming).
 *
 * Block:    .page-header
 * Elements: __title-row, __left, __title, __subtitle, __count, __right
 * Modifiers: __title-row--hidden, .sticky-bar, .scrolled
 *
 * Props:
 *   title     — Page title (required)
 *   subtitle  — Optional description text beside the title
 *   count     — Optional count badge beside the title
 *   right     — Optional ReactNode on the right side
 *   children  — Optional controls row content
 *   footer    — Optional content below controls (e.g. filter chips)
 *   sticky    — Whether controls stick on scroll (default: true when children/footer present)
 */
export default function PageHeader({ title, subtitle, count, right, children, footer, sticky }) {
  const [scrolled, setScrolled] = useState(false);
  const wrapRef = useRef(null);

  const isSticky = sticky !== undefined ? sticky : !!(children || footer);

  useEffect(() => {
    if (!isSticky) return;

    const scrollParent = wrapRef.current?.closest('.home-main') || wrapRef.current?.closest('.app-content');
    if (!scrollParent) return;

    const onScroll = () => setScrolled(scrollParent.scrollTop > 48);

    scrollParent.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollParent.removeEventListener('scroll', onScroll);
  }, [isSticky]);

  return (
    <div
      ref={wrapRef}
      className={`page-header${isSticky ? ' sticky-bar' : ''}${scrolled ? ' scrolled' : ''}`}
    >
      <div className={`page-header__title-row${scrolled ? ' page-header__title-row--hidden' : ''}`}>
        <div className="page-header__left">
          <h1 className="page-header__title">{title}</h1>
          {count && <p className="page-header__count">{count}</p>}
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {right && <div className="page-header__right">{right}</div>}
      </div>
      {children && (
        <div className="ct-controls-row">
          {children}
        </div>
      )}
      {footer}
    </div>
  );
}
