'use client';
import { useState } from 'react';
import styles from '../page.module.css';

export default function StepPreview() {
  const [active, setActive] = useState(0);

  return (
    <section className={styles.stepPreview}>
      <div className={styles.stepWrap}>
        <div className={styles.stepTabs}>
          <button className={`${styles.stepTab}${active === 0 ? ` ${styles.stepTabActive}` : ''}`} onClick={() => setActive(0)}>
            Step 1: Sort your subscriptions
          </button>
          <button className={`${styles.stepTab}${active === 1 ? ` ${styles.stepTabActive}` : ''}`} onClick={() => setActive(1)}>
            Step 2: Scrub your feed
          </button>
        </div>
        <div className={styles.stepPanels}>

          {/* Panel 1 */}
          {active === 0 && (
            <div className={styles.stepPanel}>
              <div className={styles.catLabel}>Auto-created categories</div>
              <div className={styles.catPills}>
                {['Tech','Gaming','Podcasts','Music','Fitness','News'].map(c => (
                  <span key={c} className={`${styles.catPill} ${styles.catPillActive}`}>
                    <span className={styles.catCheck}>✓</span> {c}
                  </span>
                ))}
              </div>
              <div className={styles.sortRows}>
                <div className={styles.sortRow}>
                  <div className={styles.sortDot} style={{background:'#E85D50'}} />
                  <span className={styles.sortLabel}>Inactive channels</span>
                  <span className={styles.sortCount}>24</span>
                </div>
                <div className={styles.sortRow}>
                  <div className={styles.sortDot} style={{background:'#EF9F27'}} />
                  <span className={styles.sortLabel}>Avoids and interests</span>
                  <span className={styles.sortCount}>16</span>
                </div>
                <div className={styles.sortRow}>
                  <div className={styles.sortDot} style={{background:'#5E5D58'}} />
                  <span className={styles.sortLabel}>Uncategorised</span>
                  <span className={styles.sortCount}>48</span>
                </div>
              </div>
            </div>
          )}

          {/* Panel 2 */}
          {active === 1 && (
            <div className={styles.stepPanel}>
              <div className={styles.cleanTitle}>Quick cleanup</div>
              <div className={styles.cleanCard}>
                <div className={styles.cleanIcon} style={{background:'rgba(232,93,80,0.1)'}}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#E85D50" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/>
                  </svg>
                </div>
                <div className={styles.cleanInfo}>
                  <div className={styles.cleanNum} style={{color:'#E85D50'}}>24 <span className={styles.cleanSub}>inactive channels</span></div>
                  <div className={styles.cleanDesc}>Haven't uploaded in months</div>
                </div>
              </div>
              <div className={styles.cleanCard}>
                <div className={styles.cleanIcon} style={{background:'rgba(239,159,39,0.1)'}}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z"/>
                  </svg>
                </div>
                <div className={styles.cleanInfo}>
                  <div className={styles.cleanNum} style={{color:'#EF9F27'}}>16 <span className={styles.cleanSub}>never watched</span></div>
                  <div className={styles.cleanDesc}>Subscribed but never clicked</div>
                </div>
              </div>
              <div className={styles.healthCard}>
                <div className={styles.healthRing}>
                  <svg viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#38E9B1" strokeWidth="4" strokeLinecap="round" strokeDasharray="125.6" strokeDashoffset="69" transform="rotate(-90 24 24)"/>
                  </svg>
                  <span className={styles.healthVal} style={{color:'#38E9B1'}}>45</span>
                </div>
                <div>
                  <div className={styles.healthLabel}>Feed health</div>
                  <div className={styles.healthSub}>Fair — room to improve</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
