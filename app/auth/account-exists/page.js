'use client';
import Link from 'next/link';

export default function AccountExistsPage() {
  return (
    <div className="auth-msg-page">
      <div className="auth-msg-card">
        <div className="auth-msg-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1 className="auth-msg-title">Account already exists</h1>
        <p className="auth-msg-text">An account already exists with this email address.</p>
        <p className="auth-msg-text">Sign in instead?</p>
        <Link href="/signin?action=signin" className="auth-msg-cta">Sign In</Link>
        <Link href="/" className="auth-msg-link">Back to home</Link>
      </div>
    </div>
  );
}
