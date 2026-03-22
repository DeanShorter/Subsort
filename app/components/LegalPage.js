'use client';
import Link from 'next/link';

export default function LegalPage({ children }) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <span className="legal-logo-mint">free</span>dly
        </Link>
      </header>
      <main className="legal-content">
        {children}
      </main>
      <footer className="legal-footer">
        <span>© 2026 Freedly</span>
        <div className="legal-footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/blog">Blog</Link>
        </div>
      </footer>
    </div>
  );
}
