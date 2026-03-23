'use client';
import { useRef } from 'react';
import styles from '../page.module.css';

export default function HeroBg({ children }) {
  const bgRef = useRef(null);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    if (bgRef.current) {
      bgRef.current.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
    }
  }

  function handleMouseLeave() {
    if (bgRef.current) {
      bgRef.current.style.transform = 'translate(0, 0)';
    }
  }

  return (
    <div
      className={styles.heroInteractive}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={bgRef} className={styles.heroBg} />
      {children}
    </div>
  );
}
