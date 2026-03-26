'use client';
import Link from 'next/link';

export default function DiscoverPage() {
  return (
    <div className="disc-empty-page">
      <div className="disc-empty-header">
        <h1 className="f2-title">Discover</h1>
        <span className="disc-coming-soon-badge">Coming soon</span>
      </div>

      <div className="disc-empty-card">
        <div className="disc-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8h-6a2 2 0 000 4h4a2 2 0 010 4H8" />
            <path d="M12 6v2m0 8v2" />
          </svg>
        </div>

        <h2 className="disc-empty-title">The Critic doesn't recommend channels it hasn't vetted.</h2>
        <p className="disc-empty-desc">Check back once it's had time to study your habits. In the meantime, there's a feed that needs scrubbing.</p>

        <div className="disc-empty-quote">
          <span className="disc-empty-quote-text">"I have standards."</span>
          <span className="disc-empty-quote-attr">— The Critic</span>
        </div>

        <div className="disc-empty-actions">
          <Link href="/feeds" className="disc-empty-action">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 4h10M3 8h6M3 12h8" />
            </svg>
            <span>Browse your feed</span>
            <span className="disc-empty-arrow">→</span>
          </Link>
          <Link href="/subscriptions" className="disc-empty-action">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="2" y="3" width="12" height="10" rx="1.5" />
              <path d="M2 6h12" />
            </svg>
            <span>Scrub your subscriptions</span>
            <span className="disc-empty-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
