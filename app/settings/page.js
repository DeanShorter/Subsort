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
    <main className="settings-main">
      <PageHeader title="Settings" subtitle="Manage your account, preferences, and connected services" sticky={false} />

      {/* Account */}
      <section className="settings-section">
        <h3 className="settings-section-title">Account</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Signed in as</div>
              <div className="settings-row-desc">{user?.email || 'Not signed in'}</div>
            </div>
            {user && (
              <button className="settings-btn settings-btn-danger" onClick={signOut}>Sign out</button>
            )}
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="settings-section">
        <h3 className="settings-section-title">Theme</h3>
        <p className="settings-desc">Choose how Subscrub looks to you.</p>
        <div className="settings-theme-row">
          <button
            className={`settings-theme-btn${activeTheme === 'dark' ? ' active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            Dark {activeTheme === 'dark' && '✓'}
          </button>
          <button
            className={`settings-theme-btn${activeTheme === 'light' ? ' active' : ''}`}
            onClick={() => setTheme('light')}
          >
            Light {activeTheme === 'light' && '✓'}
          </button>
        </div>
      </section>

      {/* Sync & Usage */}
      <section className="settings-section">
        <h3 className="settings-section-title">Sync</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Daily syncs</div>
              <div className="settings-row-desc">
                {syncUsage.used} / {userTier === 'admin' ? '∞' : syncUsage.max} used today
                {userTier === 'free' && syncUsage.used >= syncUsage.max && (
                  <span className="settings-limit-tag">Limit reached</span>
                )}
              </div>
            </div>
            <button
              className="settings-btn settings-btn-accent"
              onClick={() => window.__subsortTriggerSync?.()}
              disabled={syncUsage.used >= syncUsage.max && userTier !== 'admin'}
            >
              Sync now
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Current plan</div>
              <div className="settings-row-desc settings-tier-label">{userTier || 'free'}</div>
            </div>
          </div>
          {userTier === 'free' && (
            <div className="settings-upsell">
              <div className="settings-upsell-title">Upgrade to Pro</div>
              <div className="settings-upsell-desc">
                Get 5 daily syncs, priority feed refresh, and early access to new features.
              </div>
              <button className="settings-btn settings-btn-accent" onClick={() => { window.location.href = '/pricing'; }}>
                Upgrade →
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
