'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

function timeAgoShort(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatEventDescription(e) {
  const m = e.metadata || {};
  switch (e.event_name) {
    case 'onboarding_completed': return `completed onboarding — ${m.total_channels || '?'} channels, score: ${m.health_score || '?'}`;
    case 'autosort_run': return `ran auto-sort — ${m.channels_sorted || '?'} channels into ${m.categories_assigned || '?'} categories`;
    case 'channel_unsubscribed': return `unsubscribed from a channel${m.was_critic_flagged ? ' (critic-flagged)' : ''}`;
    case 'channel_categorised': return `categorised a channel (${m.source || 'manual'})`;
    case 'channel_favourited': return 'favourited a channel';
    case 'channel_unfavourited': return 'unfavourited a channel';
    case 'sync': return `synced subscriptions (${m.source || 'manual'})`;
    case 'upgrade_completed': return `upgraded to Pro (${m.plan || 'monthly'})`;
    case 'downgrade_completed': return `cancelled Pro after ${m.months_subscribed || '?'} months`;
    case 'free_cap_hit': return `hit the 50-sub cap (${m.total_channels || '?'} channels)`;
    case 'sabbatical_started': return `started a sabbatical (${m.duration_days || '?'} days)`;
    case 'recommendation_acted': return `acted on ${m.type || 'a'} recommendation`;
    case 'collection_created': return `created a ${m.type || 'simple'} collection`;
    case 'session_start': return 'started a session';
    case 'session_end': return 'ended session';
    default: return e.event_name.replace(/_/g, ' ');
  }
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', session.user.id).single();
    if (!profile || (profile.tier !== 'admin' && profile.tier !== 'pro')) { setLoading(false); return; }
    setIsAdmin(true);

    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="adm-loading"><span className="spinner" /> Loading admin...</div>;
  if (!isAdmin) return <div className="adm-loading">Not authorised. <Link href="/home" style={{ color: 'var(--accent)' }}>Back to Subsnub</Link></div>;
  if (!data) return <div className="adm-loading">Failed to load data.</div>;

  const v = data.vitals;

  return (
    <div className="adm-page">
      {/* Header */}
      <div className="adm-header">
        <div>
          <h1 className="adm-h1">Admin — Subsnub</h1>
          <span className="adm-refresh-time">Last refreshed: {lastRefresh ? timeAgoShort(lastRefresh) : '—'}</span>
        </div>
        <button className="adm-refresh-btn" onClick={() => { setLoading(true); loadData(); }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 7a6 6 0 1011.5-2.5M12.5 1v3.5H9" /></svg>
          Refresh
        </button>
      </div>

      {/* Section 1: Vital Signs */}
      <div className="adm-section-title">Vital Signs</div>
      <div className="adm-vitals">
        <div className="adm-vital-card">
          <div className="adm-vital-val">{v.totalUsers}</div>
          <div className="adm-vital-lbl">Total users</div>
        </div>
        <div className="adm-vital-card">
          <div className="adm-vital-val">{v.activeToday}</div>
          <div className="adm-vital-lbl">Active today</div>
        </div>
        <div className="adm-vital-card">
          <div className="adm-vital-val">{v.activeWeek}</div>
          <div className="adm-vital-lbl">Active this week</div>
        </div>
        <div className="adm-vital-card">
          <div className="adm-vital-val">{v.proCount}</div>
          <div className="adm-vital-lbl">Pro subscribers</div>
        </div>
        <div className="adm-vital-card">
          <div className="adm-vital-val">{data.totalChannels.toLocaleString()}</div>
          <div className="adm-vital-lbl">Total channels</div>
        </div>
        <div className="adm-vital-card">
          <div className="adm-vital-val">{v.avgHealth ?? '—'}</div>
          <div className="adm-vital-lbl">Avg health score</div>
        </div>
      </div>

      {/* Section 2: Activity Feed */}
      <div className="adm-section-title">Activity Feed</div>
      <div className="adm-activity">
        {data.activityFeed.length > 0 ? data.activityFeed.map((e, i) => (
          <div key={i} className="adm-activity-item">
            <span className="adm-activity-time">{timeAgoShort(e.created_at)}</span>
            <span className="adm-activity-user">{e.userName}</span>
            <span className="adm-activity-desc">{formatEventDescription(e)}</span>
          </div>
        )) : (
          <div className="adm-empty">No activity yet. Events will appear here as users interact with the product.</div>
        )}
      </div>

      {/* Section 3: Feature Usage */}
      <div className="adm-section-title">Feature Usage (Last 7 Days)</div>
      {data.featureUsage.length > 0 ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Users</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.featureUsage.sort((a, b) => b.actionsThisWeek - a.actionsThisWeek).map((f, i) => (
                <tr key={i}>
                  <td>{f.feature}</td>
                  <td>{f.usersThisWeek}</td>
                  <td>{f.actionsThisWeek}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="adm-empty">No feature usage data yet.</div>
      )}

      {/* Section 4: Users */}
      <div className="adm-section-title">Users ({data.users.length})</div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Tier</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map(u => (
              <tr key={u.id}>
                <td>{u.display_name || '—'}</td>
                <td>{u.email || '—'}</td>
                <td><span className={`adm-tier ${u.tier}`}>{u.tier}</span></td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
