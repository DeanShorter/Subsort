'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import PageHeader from '../components/PageHeader';

export default function SettingsPage() {
  const { user, userTier, signOut } = useAuth();
  const { theme, setTheme, mounted } = useTheme();
  const activeTheme = mounted ? theme : null;

  // Sync usage tracking
  const [syncUsage, setSyncUsage] = useState({ used: 0, max: 1 });
  useEffect(() => {
    const maxSyncs = userTier === 'admin' ? 999 : userTier === 'pro' ? 5 : 1;
    const syncLog = JSON.parse(localStorage.getItem('subsort_sync_log') || '{}');
    const today = new Date().toDateString();
    const todaySyncs = syncLog.date === today ? (syncLog.count || 0) : 0;
    setSyncUsage({ used: todaySyncs, max: maxSyncs });
  }, [userTier]);

  return (
    <main style={{ padding: '2.5rem', maxWidth: 700, margin: '0 auto', overflowY: 'auto', flex: 1 }}>
      <PageHeader title="Settings" subtitle="Manage your account, preferences, and connected services" sticky={false} />

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
        <p style={{ fontSize: '.8125rem', color: 'var(--text-secondary)', marginBottom: '.75rem' }}>Choose how Subscrub looks to you.</p>
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

      {/* Sync & Usage */}
      <section style={{ marginBottom: '2rem' }}>
        <h3 className="settings-section-title">Sync</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Daily syncs</div>
              <div className="settings-row-desc">
                {syncUsage.used} / {userTier === 'admin' ? '∞' : syncUsage.max} used today
                {userTier === 'free' && syncUsage.used >= syncUsage.max && (
                  <span style={{ color: 'var(--color-error)', marginLeft: '.5rem' }}>Limit reached</span>
                )}
              </div>
            </div>
            <button
              className="settings-row-action"
              onClick={() => window.__subsortTriggerSync?.()}
              disabled={syncUsage.used >= syncUsage.max && userTier !== 'admin'}
            >
              Sync now
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Current plan</div>
              <div className="settings-row-desc" style={{ textTransform: 'capitalize' }}>{userTier || 'free'}</div>
            </div>
          </div>
          {userTier === 'free' && (
            <div style={{
              marginTop: '.75rem', padding: '.875rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-soft)', border: '1px solid rgba(56,233,177,.2)',
            }}>
              <div style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '.25rem' }}>
                Upgrade to Pro
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '.625rem' }}>
                Get 5 daily syncs, priority feed refresh, and early access to new features.
              </div>
              <button
                className="settings-row-action"
                style={{ background: 'var(--accent)', color: '#111', border: 'none', fontWeight: 600 }}
                onClick={() => window.location.href = '/pricing'}
              >
                Upgrade →
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
