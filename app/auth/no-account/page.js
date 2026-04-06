'use client';
import Link from 'next/link';

export default function NoAccountPage() {
  return (
    <div className="auth-msg-page">
      <div className="auth-msg-card">
        <div className="auth-msg-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 className="auth-msg-title">No account found</h1>
        <p className="auth-msg-text">We can&rsquo;t find an account associated with this email address.</p>
        <p className="auth-msg-text">Click Sign Up to get started.</p>
        <Link href="/signin?action=signup" className="auth-msg-cta">Sign up</Link>
        <Link href="/" className="auth-msg-link">Back to home</Link>
      </div>
    </div>
  );
}
