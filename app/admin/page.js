'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

// ── Admin sidebar nav items ──────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></> },
  { id: 'analytics', label: 'Analytics', icon: <><path d="M2 12l3-4 3 2 4-6 2 2"/><rect x="2" y="2" width="12" height="12" rx="1.5"/></> },
  { id: 'users', label: 'Users', icon: <><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></> },
  { id: 'channels', label: 'Channels', icon: <><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12"/></> },
  { id: 'activity', label: 'Activity log', icon: <><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></> },
];

const DB_ITEMS = [
  { id: 'supabase', label: 'Supabase', icon: <><ellipse cx="8" cy="4" rx="6" ry="2"/><path d="M2 4v8c0 1.1 2.7 2 6 2s6-.9 6-2V4"/><path d="M2 8c0 1.1 2.7 2 6 2s6-.9 6-2"/></> },
  { id: 'queries', label: 'Queries', icon: <path d="M3 4h10M3 8h6M3 12h8"/> },
];

const TOOL_ITEMS = [
  { id: 'email', label: 'Email users', icon: <><path d="M2 4l6 4 6-4"/><rect x="2" y="3" width="12" height="10" rx="1.5"/></> },
  { id: 'flags', label: 'Feature flags', icon: <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z"/> },
];

const FEATURE_DATA = [
  { name: 'Auto-sort', pct: 94, color: 'var(--accent)' },
  { name: 'Favourites', pct: 71, color: '#378ADD' },
  { name: 'Category edit', pct: 48, color: '#B07CED' },
  { name: 'Grid view', pct: 62, color: '#5DCAA5' },
  { name: 'List view', pct: 28, color: '#5DCAA5' },
  { name: 'Hybrid view', pct: 10, color: '#5DCAA5' },
  { name: 'Notes', pct: 23, color: '#EF9F27' },
  { name: 'Takeout upload', pct: 8, color: '#D4537E' },
  { name: 'Discover page', pct: 35, color: '#E8875C' },
];

const TOP_CATS = [
  { name: 'Entertainment', count: 891, pct: 100, color: '#E85D50' },
  { name: 'Tech', count: 734, pct: 82, color: '#378ADD' },
  { name: 'Gaming', count: 609, pct: 68, color: '#B07CED' },
  { name: 'Music', count: 492, pct: 55, color: 'var(--accent)' },
  { name: 'Education', count: 367, pct: 41, color: '#5DCAA5' },
];

// ── Chart component (lazy) ──────────────────────────────
function SignupChart() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [activeTab, setActiveTab] = useState('30d');

  useEffect(() => {
    let cancelled = false;
    import('chart.js/auto').then(({ default: Chart }) => {
      if (cancelled || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const now = new Date();
      const days = activeTab === '7d' ? 7 : activeTab === '90d' ? 90 : activeTab === 'All' ? 180 : 30;
      const labels = [];
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
        data.push(Math.round(20 + Math.random() * 25 + Math.max(0, (days - 1 - i) * 1.2)));
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Signups', data,
            backgroundColor: 'rgba(62,207,160,0.35)',
            hoverBackgroundColor: 'rgba(62,207,160,0.55)',
            borderRadius: 4, borderSkipped: false,
            barPercentage: 0.7, categoryPercentage: 0.85,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#5E5D58', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5E5D58', font: { size: 10 }, stepSize: 10 }, beginAtZero: true },
          },
        },
      });
    });
    return () => { cancelled = true; if (chartRef.current) chartRef.current.destroy(); };
  }, [activeTab]);

  const tabs = ['7d', '30d', '90d', 'All'];

  return (
    <div className="admin-panel" style={{ marginBottom: 24 }}>
      <div className="admin-panel-header">
        <span className="admin-panel-title">Signups over time</span>
        <div className="admin-tabs">
          {tabs.map(t => (
            <button key={t} className={`admin-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 200 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

// ── Main admin page ─────────────────────────────────────
export default function AdminPage() {
  const [activeNav, setActiveNav] = useState('overview');
  const [clock, setClock] = useState('');
  const [stats, setStats] = useState({ users: 0, active: 0, pro: 0, channels: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes();
      setClock(`${h % 12 || 12}:${m < 10 ? '0' : ''}${m}${h >= 12 ? ' PM' : ' AM'}`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  // Auth check + data fetch
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setAuthChecked(true); return; }

      // Check admin (you can adjust this check)
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', session.user.id)
        .single();

      const admin = profile?.tier === 'admin' || profile?.tier === 'pro';
      setIsAdmin(admin);
      setAuthChecked(true);
      if (!admin) return;

      // Fetch stats
      const [usersRes, channelsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: false }),
        supabase.from('channels').select('id', { count: 'exact', head: true }),
      ]);

      const users = usersRes.data || [];
      const proCount = users.filter(u => u.tier === 'pro').length;
      const totalChannels = channelsRes.count || 0;

      setStats({
        users: users.length,
        active: Math.round(users.length * 0.148), // placeholder ratio
        pro: proCount,
        channels: totalChannels,
      });

      // Recent signups (last 7)
      const recent = [...users]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 7)
        .map(u => ({
          id: u.id,
          name: u.full_name || u.email?.split('@')[0] || 'User',
          email: u.email || '',
          tier: u.tier || 'free',
          createdAt: u.created_at,
        }));
      setRecentUsers(recent);
    }
    load();
  }, []);

  const formatCount = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const avatarColors = ['var(--accent)', '#378ADD', '#B07CED', '#EF9F27', '#D4537E', '#5DCAA5', '#E85D50'];

  if (!authChecked) {
    return <div className="home-feed-loading"><span className="spinner" /> Checking access…</div>;
  }

  if (!isAdmin) {
    return (
      <main className="home-main" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="page-title" style={{ marginBottom: '.5rem' }}>Access denied</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You don't have permission to view this page.</p>
          <Link href="/dashboard" className="btn-accent" style={{ padding: '.5rem 1.25rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none', display: 'inline-block' }}>
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const renderNavItem = (item) => (
    <button
      key={item.id}
      className={`home-nav-item${activeNav === item.id ? ' active' : ''}`}
      onClick={() => setActiveNav(item.id)}
    >
      <svg viewBox="0 0 16 16">{item.icon}</svg>
      <span className="home-nav-item-label">{item.label}</span>
    </button>
  );

  return (
    <div className="app-shell">
      {/* Admin sidebar */}
      <nav className="home-nav-primary">
        <div className="hnp-header">
          <Link href="/dashboard" className="home-nav-brand" style={{ textDecoration: 'none' }}>
            <span className="home-nav-brand-wordmark">
              <span>free</span><span className="hnp-wordmark-dly">dly</span>
            </span>
          </Link>
          <span className="admin-badge">Admin</span>
        </div>

        <div className="hnp-body">
          <div className="hnp-section">
            {NAV_ITEMS.map(renderNavItem)}
          </div>

          <hr className="home-nav-divider" />

          <div className="hnp-section">
            <div className="hnp-section-label">DATABASE</div>
            {DB_ITEMS.map(renderNavItem)}
          </div>

          <hr className="home-nav-divider" />

          <div className="hnp-section">
            <div className="hnp-section-label">TOOLS</div>
            {TOOL_ITEMS.map(renderNavItem)}
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />
          <hr className="home-nav-divider" />

          <div className="hnp-section">
            <Link href="/dashboard" className="home-nav-item" style={{ textDecoration: 'none' }}>
              <svg viewBox="0 0 16 16"><path d="M6 14V8h4v6"/><path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1z"/></svg>
              <span className="home-nav-item-label">Back to Freedly</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="app-content">
        <main className="home-main">
          {/* Header */}
          <div className="page-header">
            <div className="page-header-left">
              <h1 className="page-title">Admin overview</h1>
            </div>
            <div className="page-header-right">
              <div className="admin-live">
                <div className="admin-live-dot" />
                <span className="admin-live-label">Live</span>
              </div>
              <span className="db-clock">{clock}</span>
            </div>
          </div>

          {/* Stat strip — 4 columns for admin */}
          <div className="db-stat-strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="db-stat-card">
              <div className="db-stat-label">Total users</div>
              <div className="db-stat-value">{formatCount(stats.users)}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Active today
                <div className="admin-live-dot" style={{ width: 5, height: 5 }} />
              </div>
              <div className="db-stat-value db-stat-mint">{stats.active}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Pro subscribers</div>
              <div className="db-stat-value" style={{ color: '#EF9F27' }}>{stats.pro}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Channels tracked</div>
              <div className="db-stat-value">{formatCount(stats.channels)}</div>
              {stats.users > 0 && (
                <div className="change-neutral-metric">~{Math.round(stats.channels / stats.users)} per user</div>
              )}
            </div>
          </div>

          {/* Signups chart */}
          <SignupChart />

          {/* Two-column: Feature usage + Engagement */}
          <div className="admin-two-col">
            {/* Feature usage */}
            <div className="admin-panel">
              <div className="admin-panel-title">Feature usage</div>
              {FEATURE_DATA.map(f => (
                <div key={f.name} className="admin-feature-row">
                  <span className="admin-feature-name">{f.name}</span>
                  <div className="admin-bar-wrap">
                    <div className="admin-bar" style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                  <span className="admin-feature-pct">{f.pct}%</span>
                </div>
              ))}
            </div>

            {/* Engagement */}
            <div className="admin-panel">
              <div className="admin-panel-title">Engagement</div>
              <div className="admin-eng-grid">
                <div className="admin-eng-card">
                  <div className="admin-eng-val" style={{ color: 'var(--accent)' }}>4.2</div>
                  <div className="admin-eng-label">Avg sessions / wk</div>
                </div>
                <div className="admin-eng-card">
                  <div className="admin-eng-val">6.8</div>
                  <div className="admin-eng-label">Min avg session</div>
                </div>
                <div className="admin-eng-card">
                  <div className="admin-eng-val" style={{ color: '#EF9F27' }}>38%</div>
                  <div className="admin-eng-label">D7 retention</div>
                </div>
              </div>

              <div className="admin-sub-label">Top categories by user count</div>
              {TOP_CATS.map(c => (
                <div key={c.name} className="admin-feature-row">
                  <span className="admin-feature-name">{c.name}</span>
                  <div className="admin-bar-wrap">
                    <div className="admin-bar" style={{ width: `${c.pct}%`, background: c.color }} />
                  </div>
                  <span className="admin-feature-pct">{c.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent signups table */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <span className="admin-panel-title">Recent signups</span>
              <span className="admin-view-all">View all users →</span>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Signed up</th>
                  <th>Plan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => {
                  const initials = u.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
                  const isNew = Date.now() - new Date(u.createdAt).getTime() < 24 * 60 * 60 * 1000;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar" style={{ background: avatarColors[i % avatarColors.length] }}>{initials}</div>
                          <div>
                            <div className="admin-user-name">{u.name}</div>
                            <div className="admin-user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{timeAgo(u.createdAt)}</td>
                      <td style={u.tier === 'pro' ? { color: '#EF9F27', fontWeight: 500 } : {}}>
                        {u.tier === 'pro' ? 'Pro' : 'Free'}
                      </td>
                      <td>
                        <span className={`admin-status ${isNew ? 'new' : 'active'}`}>
                          {isNew ? 'New' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recentUsers.length === 0 && (
                  <tr><td colSpan={4} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
