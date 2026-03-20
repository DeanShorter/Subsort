'use client'
import { useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../components/ThemeProvider';
import styles from './settings.module.css';

export default function Settings() {
  const { theme, setTheme, mounted } = useTheme();

  useEffect(() => { document.title = 'Freedly - Settings'; }, []);

  // Don't show active state until client has read localStorage — prevents
  // hydration mismatch that causes buttons to appear locked
  const activeTheme = mounted ? theme : null;

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>
          <img src="/logo.svg" alt="Freedly" height="26" />
        </Link>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>Settings</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Theme</h2>
          <p className={styles.sectionDesc}>Choose how Freedly looks to you.</p>
          <div className={styles.themeGrid}>
            <button
              onClick={() => setTheme('dark')}
              className={`${styles.themeOption} ${activeTheme === 'dark' ? styles.active : ''}`}
            >
              <div className={styles.previewDark}>
                <div className={styles.previewDarkBar} />
                <div className={styles.previewLines}>
                  <div className={styles.previewLine} />
                  <div className={styles.previewLine} style={{ width: '55%' }} />
                </div>
              </div>
              <div className={styles.themeLabelRow}>
                <span className={styles.themeLabel}>Dark</span>
                {activeTheme === 'dark' && <span className={styles.activeCheck}>✓</span>}
              </div>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`${styles.themeOption} ${activeTheme === 'light' ? styles.active : ''}`}
            >
              <div className={styles.previewLight}>
                <div className={styles.previewLightBar} />
                <div className={styles.previewLines}>
                  <div className={styles.previewLineLight} />
                  <div className={styles.previewLineLight} style={{ width: '55%' }} />
                </div>
              </div>
              <div className={styles.themeLabelRow}>
                <span className={styles.themeLabel}>Light</span>
                {activeTheme === 'light' && <span className={styles.activeCheck}>✓</span>}
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
