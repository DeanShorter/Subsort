import Link from 'next/link';

export default function UnsubscribedPage() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', fontFamily: 'var(--font-body)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '.5rem' }}>Unsubscribed</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          You've been removed from the Subscrub newsletter. You won't receive any more emails from us.
        </p>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
          Back to Subscrub →
        </Link>
      </div>
    </main>
  );
}
