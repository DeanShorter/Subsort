'use client'
import Link from 'next/link';
import { useTheme } from '../components/ThemeProvider';
import styles from './settings.module.css';

export default function Settings() {
  const { theme, setTheme } = useTheme();

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
              className={`${styles.themeOption} ${theme === 'dark' ? styles.active : ''}`}
            >
              <div className={styles.themePreview} data-variant="dark">
                <div className={styles.previewBar} />
                <div className={styles.previewContent}>
                  <div className={styles.previewLine} />
                  <div className={styles.previewLine} style={{ width: '60%' }} />
                </div>
              </div>
              <span className={styles.themeLabel}>Dark</span>
              {theme === 'dark' && <span className={styles.activeCheck}>✓</span>}
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`${styles.themeOption} ${theme === 'light' ? styles.active : ''}`}
            >
              <div className={styles.themePreview} data-variant="light">
                <div className={styles.previewBar} />
                <div className={styles.previewContent}>
                  <div className={styles.previewLine} />
                  <div className={styles.previewLine} style={{ width: '60%' }} />
                </div>
              </div>
              <span className={styles.themeLabel}>Light</span>
              {theme === 'light' && <span className={styles.activeCheck}>✓</span>}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
