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
  { id: 'newsletter', label: 'Newsletter', icon: <><path d="M2 4l6 4 6-4"/><rect x="2" y="3" width="12" height="10" rx="1.5"/></> },
  { id: 'flags', label: 'Feature flags', icon: <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z"/> },
];

// Colour map for known events — unknown events get a default
const EVENT_COLOURS = {
  sync: 'var(--accent)',
  favourite: '#378ADD',
  category_edit: '#B07CED',
  view_feeds: '#E8875C',
  view_discover: '#E8875C',
  view_grid: '#5DCAA5',
  view_list: '#5DCAA5',
  view_hybrid: '#5DCAA5',
  add_note: '#EF9F27',
  bulk_edit: '#D4537E',
  search: '#85B7EB',
};

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
  const [signupDates, setSignupDates] = useState([]);

  // Fetch all signup dates once
  useEffect(() => {
    supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setSignupDates(data.map(r => r.created_at));
      });
  }, []);

  // Render chart when data or tab changes
  useEffect(() => {
    if (!signupDates.length) return;
    let cancelled = false;

    import('chart.js/auto').then(({ default: Chart }) => {
      if (cancelled || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const now = new Date();
      const days = activeTab === '7d' ? 7 : activeTab === '90d' ? 90 : activeTab === 'All' ? 365 : 30;

      // Build a map of date → count
      const countMap = {};
      for (const dateStr of signupDates) {
        if (!dateStr) continue;
        const day = dateStr.slice(0, 10); // YYYY-MM-DD
        countMap[day] = (countMap[day] || 0) + 1;
      }

      // Build labels + data for the range
      const labels = [];
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        labels.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
        data.push(countMap[key] || 0);
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
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5E5D58', font: { size: 10 }, stepSize: 1 }, beginAtZero: true },
          },
        },
      });
    });
    return () => { cancelled = true; if (chartRef.current) chartRef.current.destroy(); };
  }, [activeTab, signupDates]);

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

// ── Newsletter view ─────────────────────────────────────
function NewsletterView({ stats }) {
  const [subject, setSubject] = useState('');
  const [preview, setPreview] = useState('');
  const [audience, setAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState(null);
  const editorRef = useRef(null);

  const audienceOptions = [
    { id: 'all', label: 'All subscribers', count: stats.users },
    { id: 'free', label: 'Free users only', count: stats.users - stats.pro },
    { id: 'pro', label: 'Pro subscribers', count: stats.pro },
  ];

  const selectedCount = audienceOptions.find(a => a.id === audience)?.count || 0;

  const handleSend = async () => {
    if (!subject.trim()) return;
    if (!editorRef.current?.innerHTML?.trim()) return;
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          subject,
          previewText: preview,
          htmlContent: editorRef.current.innerHTML,
          audience,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setSentMsg(`Error: ${data.error}`);
      } else {
        setSentMsg(`Sent to ${data.sent.toLocaleString()} users`);
      }
    } catch (e) {
      setSentMsg('Send failed');
    }
    setSending(false);
    setTimeout(() => setSentMsg(null), 5000);
  };

  const execCmd = (cmd, val) => {
    document.execCommand(cmd, false, val || null);
    editorRef.current?.focus();
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Compose newsletter</h1>
        </div>
      </div>

      <div className="nl-layout">
        {/* Left: compose */}
        <div>
          <div className="admin-panel nl-compose">
            <div className="nl-compose-header">
              <div className="admin-panel-title">Email details</div>
              <div className="nl-field">
                <label className="nl-label">Subject line</label>
                <input
                  className="nl-input"
                  type="text"
                  placeholder="What's this email about?"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
              <div className="nl-field">
                <label className="nl-label">Preview text</label>
                <input
                  className="nl-input"
                  type="text"
                  placeholder="Shows after subject in inbox..."
                  value={preview}
                  onChange={e => setPreview(e.target.value)}
                />
              </div>
            </div>

            <div className="nl-toolbar">
              <button className="nl-toolbar-btn" onClick={() => execCmd('bold')} title="Bold"><strong>B</strong></button>
              <button className="nl-toolbar-btn" onClick={() => execCmd('italic')} title="Italic"><em>I</em></button>
              <button className="nl-toolbar-btn" onClick={() => execCmd('underline')} title="Underline"><span style={{ textDecoration: 'underline' }}>U</span></button>
              <div className="nl-toolbar-sep" />
              <button className="nl-toolbar-btn" onClick={() => execCmd('formatBlock', 'h2')} title="Heading">
                <svg viewBox="0 0 16 16"><path d="M3 3v10M13 3v10M3 8h10" /></svg>
              </button>
              <button className="nl-toolbar-btn" onClick={() => {
                const url = prompt('Link URL:');
                if (url) execCmd('createLink', url);
              }} title="Link">
                <svg viewBox="0 0 16 16"><path d="M6.5 9.5a3.5 3.5 0 005 0l1-1a3.5 3.5 0 00-5-5l-.5.5" /><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-1 1a3.5 3.5 0 005 5l.5-.5" /></svg>
              </button>
              <button className="nl-toolbar-btn" onClick={() => execCmd('insertUnorderedList')} title="Bullet list">
                <svg viewBox="0 0 16 16"><path d="M6 4h8M6 8h8M6 12h8" /><circle cx="3" cy="4" r="1" fill="currentColor" stroke="none" /><circle cx="3" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" /></svg>
              </button>
              <div className="nl-toolbar-sep" />
              <button className="nl-toolbar-btn" onClick={() => execCmd('insertHorizontalRule')} title="Divider">
                <svg viewBox="0 0 16 16"><path d="M2 8h12" /></svg>
              </button>
            </div>

            <div
              ref={editorRef}
              className="nl-editor"
              contentEditable
              data-placeholder="Start writing your newsletter..."
            />
          </div>
        </div>

        {/* Right: controls */}
        <div className="nl-sidebar">
          {/* Audience */}
          <div className="admin-panel">
            <div className="admin-panel-title">Audience</div>
            {audienceOptions.map(opt => (
              <div
                key={opt.id}
                className={`nl-audience-opt${audience === opt.id ? ' selected' : ''}`}
                onClick={() => setAudience(opt.id)}
              >
                <div className="nl-radio" />
                <span className="nl-audience-label">{opt.label}</span>
                <span className="nl-audience-count">{opt.count.toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Send */}
          <div className="admin-panel">
            <div className="admin-panel-title">Send</div>
            <div className="nl-send-stack">
              <button className="nl-btn nl-btn-primary" onClick={handleSend} disabled={sending || !!sentMsg}>
                <svg viewBox="0 0 16 16"><path d="M2 8l5 3V5z" /><path d="M7 8h7" /></svg>
                {sentMsg || (sending ? 'Sending...' : `Send to ${selectedCount.toLocaleString()} users`)}
              </button>
              <button className="nl-btn">
                <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1.5" /></svg>
                Schedule for later
              </button>
              <button className="nl-btn">
                <svg viewBox="0 0 16 16"><path d="M2 4l6 4 6-4" /><rect x="2" y="3" width="12" height="10" rx="1.5" /></svg>
                Send test to myself
              </button>
            </div>
          </div>

          {/* Placeholder stats */}
          <div className="admin-panel">
            <div className="admin-panel-title">Last email performance</div>
            <div className="nl-stats-grid">
              <div className="nl-stat">
                <div className="nl-stat-val" style={{ color: 'var(--accent)' }}>—</div>
                <div className="nl-stat-lbl">Open rate</div>
              </div>
              <div className="nl-stat">
                <div className="nl-stat-val" style={{ color: '#378ADD' }}>—</div>
                <div className="nl-stat-lbl">Click rate</div>
              </div>
              <div className="nl-stat">
                <div className="nl-stat-val">—</div>
                <div className="nl-stat-lbl">Delivered</div>
              </div>
              <div className="nl-stat">
                <div className="nl-stat-val" style={{ color: '#E85D50' }}>—</div>
                <div className="nl-stat-lbl">Bounced</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
  const [featureData, setFeatureData] = useState([]);
  const [apiUsage, setApiUsage] = useState({ today: 0, limit: 10000, byEndpoint: [], byDay: [] });
  const [videoClicks, setVideoClicks] = useState({ feeds: 0, dashboard: 0 });

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

      // Fetch stats + events + API usage in parallel
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const [usersRes, channelsRes, eventsRes, apiUsageRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: false }),
        supabase.from('channels').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('event, user_id'),
        supabase.from('api_usage').select('endpoint, units, created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
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

      // Feature usage — count distinct users per event
      const events = eventsRes.data || [];
      const eventUsers = {};
      for (const e of events) {
        if (!eventUsers[e.event]) eventUsers[e.event] = new Set();
        eventUsers[e.event].add(e.user_id);
      }
      const totalUsers = Math.max(users.length, 1);
      const features = Object.entries(eventUsers)
        .map(([event, userSet]) => ({
          name: event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          pct: Math.round((userSet.size / totalUsers) * 100),
          color: EVENT_COLOURS[event] || '#85B7EB',
          users: userSet.size,
        }))
        .sort((a, b) => b.pct - a.pct);
      setFeatureData(features);

      // Video clicks
      const feedsClicks = events.filter(e => e.event === 'video_click_feeds').length;
      const dashClicks = events.filter(e => e.event === 'video_click_dashboard').length;
      setVideoClicks({ feeds: feedsClicks, dashboard: dashClicks });

      // API usage
      const apiRows = apiUsageRes.data || [];
      const todayStr = new Date().toISOString().slice(0, 10);
      let todayUnits = 0;
      const endpointTotals = {};
      const dayTotals = {};

      for (const row of apiRows) {
        const day = row.created_at?.slice(0, 10) || todayStr;
        const units = row.units || 1;
        if (day === todayStr) todayUnits += units;
        endpointTotals[row.endpoint] = (endpointTotals[row.endpoint] || 0) + units;
        dayTotals[day] = (dayTotals[day] || 0) + units;
      }

      // Build 7-day array
      const byDay = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        byDay.push({ day: d.toLocaleDateString('en-GB', { weekday: 'short' }), units: dayTotals[key] || 0 });
      }

      const byEndpoint = Object.entries(endpointTotals)
        .map(([endpoint, units]) => ({ endpoint, units }))
        .sort((a, b) => b.units - a.units);

      setApiUsage({ today: todayUnits, limit: 10000, byEndpoint, byDay });

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
          <span className="tier-badge admin">Admin</span>
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

          {activeNav === 'newsletter' ? (
            <NewsletterView stats={stats} />
          ) : (
          <>
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

          {/* Video clicks */}
          <div className="db-stat-strip" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="db-stat-card">
              <div className="db-stat-label">Video clicks — Feeds</div>
              <div className="db-stat-value db-stat-mint">{videoClicks.feeds.toLocaleString()}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Video clicks — Dashboard</div>
              <div className="db-stat-value" style={{ color: '#378ADD' }}>{videoClicks.dashboard.toLocaleString()}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Total video clicks</div>
              <div className="db-stat-value">{(videoClicks.feeds + videoClicks.dashboard).toLocaleString()}</div>
            </div>
          </div>

          {/* Signups chart */}
          <SignupChart />

          {/* API Usage */}
          <div className="admin-panel" style={{ marginBottom: 24 }}>
            <div className="admin-panel-header">
              <span className="admin-panel-title">YouTube API usage</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily limit: {apiUsage.limit.toLocaleString()} units</span>
            </div>

            {/* Today's usage bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Today</span>
                <span style={{ fontSize: 12, color: apiUsage.today > apiUsage.limit * 0.8 ? '#E85D50' : 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                  {apiUsage.today.toLocaleString()} / {apiUsage.limit.toLocaleString()}
                </span>
              </div>
              <div className="admin-bar-wrap" style={{ height: 8 }}>
                <div
                  className="admin-bar"
                  style={{
                    width: `${Math.min(100, (apiUsage.today / apiUsage.limit) * 100)}%`,
                    background: apiUsage.today > apiUsage.limit * 0.8 ? '#E85D50' : 'var(--accent)',
                  }}
                />
              </div>
            </div>

            {/* 7-day bar chart */}
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', marginBottom: 10 }}>Last 7 days</div>
            <div className="api-day-chart">
              {apiUsage.byDay.map((d, i) => {
                const maxDay = Math.max(...apiUsage.byDay.map(x => x.units), 1);
                return (
                  <div key={i} className="api-day-col">
                    <div className="api-day-bar-wrap">
                      <div className="api-day-bar" style={{ height: `${(d.units / maxDay) * 100}%` }} />
                    </div>
                    <span className="api-day-label">{d.day}</span>
                    <span className="api-day-val">{d.units}</span>
                  </div>
                );
              })}
            </div>

            {/* By endpoint breakdown */}
            {apiUsage.byEndpoint.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-muted)', marginBottom: 10, marginTop: 16 }}>By endpoint (7 days)</div>
                {apiUsage.byEndpoint.map(e => (
                  <div key={e.endpoint} className="admin-feature-row">
                    <span className="admin-feature-name">{e.endpoint}</span>
                    <div className="admin-bar-wrap">
                      <div className="admin-bar" style={{
                        width: `${(e.units / Math.max(...apiUsage.byEndpoint.map(x => x.units), 1)) * 100}%`,
                        background: e.endpoint.includes('playlist') ? 'var(--accent)' : e.endpoint.includes('subscription') ? '#378ADD' : '#B07CED',
                      }} />
                    </div>
                    <span className="admin-feature-pct">{e.units.toLocaleString()}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Two-column: Feature usage + Engagement */}
          <div className="admin-two-col">
            {/* Feature usage */}
            <div className="admin-panel">
              <div className="admin-panel-title">Feature usage</div>
              {featureData.length > 0 ? featureData.map(f => (
                <div key={f.name} className="admin-feature-row">
                  <span className="admin-feature-name">{f.name}</span>
                  <div className="admin-bar-wrap">
                    <div className="admin-bar" style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                  <span className="admin-feature-pct">{f.pct}%</span>
                </div>
              )) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '.8125rem' }}>No events tracked yet.</p>
              )}
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
          </>
          )}
        </main>
      </div>
    </div>
  );
}
