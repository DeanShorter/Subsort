'use client';
import { useAuth } from '../components/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import PageHeader from '../components/PageHeader';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, mounted } = useTheme();
  const activeTheme = mounted ? theme : null;

  return (
    <main style={{ padding: '2.5rem', maxWidth: 700, margin: '0 auto', overflowY: 'auto', flex: 1 }}>
      <PageHeader title="Settings" subtitle="Manage your account, preferences, and data." />

      {/* Account */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 className="settings-section-title">Account</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Signed in as</div>
              <div className="settings-row-desc">{user?.email || 'Not signed in'}</div>
            </div>
            {user && (
              <button className="settings-row-action" onClick={signOut}>Sign out</button>
            )}
          </div>
        </div>
      </section>

      {/* Theme */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 className="settings-section-title">Theme</h3>
        <p style={{ fontSize: '.8125rem', color: 'var(--text-secondary)', marginBottom: '.75rem' }}>Choose how Freedly looks to you.</p>
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button
            onClick={() => setTheme('dark')}
            style={{
              flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)',
              border: `2px solid ${activeTheme === 'dark' ? 'var(--accent)' : 'var(--border-subtle)'}`,
              background: activeTheme === 'dark' ? 'var(--accent-soft)' : 'var(--bg-card)',
              cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-body)',
              color: 'var(--text-primary)', fontSize: '.875rem', fontWeight: 600,
            }}
          >
            Dark {activeTheme === 'dark' && '✓'}
          </button>
          <button
            onClick={() => setTheme('light')}
            style={{
              flex: 1, padding: '1rem', borderRadius: 'var(--radius-md)',
              border: `2px solid ${activeTheme === 'light' ? 'var(--accent)' : 'var(--border-subtle)'}`,
              background: activeTheme === 'light' ? 'var(--accent-soft)' : 'var(--bg-card)',
              cursor: 'pointer', textAlign: 'center', fontFamily: 'var(--font-body)',
              color: 'var(--text-primary)', fontSize: '.875rem', fontWeight: 600,
            }}
          >
            Light {activeTheme === 'light' && '✓'}
          </button>
        </div>
      </section>
    </main>
  );
}
