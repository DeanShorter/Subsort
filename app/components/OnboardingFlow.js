'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useChannelData } from './ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { syncYouTubeSubscriptions } from '../../lib/sync';
import { autoCategoriseAll, persistAutoSort } from '../../lib/auto-categorise';
import { showToast } from './Toast';

const STEPS = ['welcome', 'connect', 'syncing', 'assessment', 'upload', 'autosort', 'sorting', 'complete'];

function StepDots({ current }) {
  const group = current === 'welcome' ? 0
    : (current === 'connect' || current === 'syncing') ? 1
    : 2;
  return (
    <div className="ob-dots">
      <div className={`ob-dot${group === 0 ? ' active' : group > 0 ? ' done' : ''}`} />
      <div className={`ob-dot${group === 1 ? ' active' : group > 1 ? ' done' : ''}`} />
      <div className={`ob-dot${group === 2 ? ' active' : ''}`} />
    </div>
  );
}

export default function OnboardingFlow({ visible, onComplete }) {
  const { user, accessToken, signIn } = useAuth();
  const { channels, categories, dbCategories, chIsUncategorised, reload } = useChannelData();
  const [step, setStep] = useState('welcome');
  const [syncChecks, setSyncChecks] = useState([
    { label: 'Connecting to YouTube', status: 'pending' },
    { label: 'Pulling subscriptions', status: 'pending' },
    { label: 'Scanning for uploads', status: 'pending' },
    { label: 'Scrutinising the mess', status: 'pending' },
    { label: '', status: 'pending' }, // "Judging [name]..." filled dynamically
  ]);
  const [subCount, setSubCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [sortProgress, setSortProgress] = useState({ done: 0, total: 0 });
  const [sortResult, setSortResult] = useState(null);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef(null);
  const syncRan = useRef(false);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'you';

  // Resume from OAuth redirect
  useEffect(() => {
    const savedStep = localStorage.getItem('subsort_onboarding_step');
    if (savedStep) {
      setStep(savedStep);
      localStorage.removeItem('subsort_onboarding_step');
    }
  }, []);

  // Update the "Judging [name]..." label
  useEffect(() => {
    setSyncChecks(prev => {
      const next = [...prev];
      next[4] = { ...next[4], label: `Judging ${userName}...` };
      return next;
    });
  }, [userName]);

  // Run sync when step is 'syncing'
  useEffect(() => {
    if (step !== 'syncing' || syncRan.current || !user) return;
    syncRan.current = true;

    (async () => {
      const updateCheck = (idx, status) => {
        setSyncChecks(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], status };
          return next;
        });
      };

      // Step 0: Connecting
      updateCheck(0, 'active');
      await new Promise(r => setTimeout(r, 800));
      updateCheck(0, 'done');

      // Step 1: Pull subscriptions
      updateCheck(1, 'active');
      let subResult = null;
      if (accessToken) {
        try {
          subResult = await syncYouTubeSubscriptions(accessToken, user.id, [], () => {});
          await reload();
        } catch (e) {
          console.error('[Onboarding] Sync failed:', e);
        }
      }
      updateCheck(1, 'done');

      // Step 2: Scanning uploads (RSS)
      updateCheck(2, 'active');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch('/api/refresh', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
        }
      } catch (e) {}
      updateCheck(2, 'done');

      // Step 3: Scrutinising
      updateCheck(3, 'active');
      await new Promise(r => setTimeout(r, 1200));
      updateCheck(3, 'done');

      // Step 4: Judging
      updateCheck(4, 'active');
      await new Promise(r => setTimeout(r, 2000));
      updateCheck(4, 'done');

      // Calculate stats
      const total = subResult?.channels?.length || channels.length;
      const inactive = (subResult?.channels || channels).filter(ch =>
        ch.videoCount === 0 || (ch.subscriberCount < 100 && ch.videoCount < 5)
      ).length;

      setSubCount(total);
      setInactiveCount(inactive);

      // Save sync timestamp so sidebar doesn't re-trigger
      localStorage.setItem('subsort_sync_ts', String(Date.now()));
      localStorage.setItem('subsort_rss_ts', String(Date.now()));

      await new Promise(r => setTimeout(r, 600));
      setStep('assessment');
    })();
  }, [step, user, accessToken, channels, reload]);

  // Handle "Connect YouTube" — save step, trigger OAuth
  const handleConnect = useCallback(() => {
    localStorage.setItem('subsort_onboarding_step', 'syncing');
    signIn();
  }, [signIn]);

  // Handle watch history file upload
  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let entries;
        if (file.name.endsWith('.json')) {
          const raw = JSON.parse(ev.target.result);
          entries = (Array.isArray(raw) ? raw : []).filter(item =>
            item.titleUrl && item.title && item.title !== 'Watched a video that has been removed'
          ).map(item => ({
            title: (item.title || '').replace(/^Watched\s+/, ''),
            channelName: item.subtitles?.[0]?.name || '',
            channelUrl: item.subtitles?.[0]?.url || '',
            time: item.time || '',
          }));
        } else {
          entries = [];
        }

        if (!entries.length) { showToast('No entries found'); setParsing(false); return; }

        const channelCounts = {};
        let earliest = null, latest = null;
        const dayOfWeekCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const hourCounts = {};

        for (const entry of entries) {
          if (!entry.channelName?.trim()) continue;
          if (!channelCounts[entry.channelName]) channelCounts[entry.channelName] = { count: 0, channelUrl: entry.channelUrl, channelName: entry.channelName };
          channelCounts[entry.channelName].count++;
          if (entry.time) {
            const d = new Date(entry.time);
            if (!isNaN(d)) {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              dayOfWeekCounts[days[d.getDay()]]++;
              hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;
              if (!earliest || d < earliest) earliest = d;
              if (!latest || d > latest) latest = d;
            }
          }
        }

        const topChannels = Object.values(channelCounts).sort((a, b) => b.count - a.count);
        const data = {
          totalEntries: entries.length,
          uniqueChannels: Object.keys(channelCounts).length,
          dateRange: { from: earliest?.toISOString(), to: latest?.toISOString() },
          topChannels: topChannels.slice(0, 30),
          missingSubs: [],
          dayOfWeek: dayOfWeekCounts,
          hourOfDay: hourCounts,
        };

        localStorage.setItem('subsort_watchhistory', JSON.stringify(data));
        if (user) {
          supabase.from('watch_history').upsert({
            user_id: user.id, total_entries: data.totalEntries, unique_channels: data.uniqueChannels,
            date_from: data.dateRange.from, date_to: data.dateRange.to,
            top_channels: data.topChannels, missing_subs: [], day_of_week: data.dayOfWeek, hour_of_day: data.hourOfDay,
            uploaded_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }

        showToast(`Parsed ${entries.length.toLocaleString()} entries!`);
        setStep('autosort');
      } catch (err) {
        showToast('Failed to parse: ' + err.message);
      }
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  }, [user]);

  // Handle auto-sort
  const handleAutoSort = useCallback(async () => {
    setStep('sorting');
    try {
      const currentChannels = channels.length ? channels : [];
      const { assignments, assigned } = autoCategoriseAll(currentChannels, () => true); // all channels for new user
      if (!assigned) {
        setSortResult({ sorted: 0, cats: 0, catNames: [] });
        setStep('complete');
        return;
      }

      setSortProgress({ done: 0, total: assigned });
      const result = await persistAutoSort(supabase, user, assignments, dbCategories || [], (done, total) => {
        setSortProgress({ done, total });
      });

      await reload();

      // Get created category names with counts
      const catCounts = {};
      assignments.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
      const catNames = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));

      setSortResult({
        sorted: assigned,
        cats: result.categoriesCreated + (dbCategories?.length || 0),
        catNames,
      });
      setStep('complete');
    } catch (e) {
      console.error('[Onboarding] Auto-sort failed:', e);
      showToast('Auto-sort failed');
      setStep('autosort');
    }
  }, [channels, user, dbCategories, reload]);

  // Complete onboarding
  const finish = useCallback(() => {
    localStorage.setItem('subsort_onboarding_done', '1');
    if (user) {
      supabase.from('profiles').update({ onboarding_completed_at: new Date().toISOString() }).eq('id', user.id);
    }
    onComplete();
  }, [user, onComplete]);

  if (!visible) return null;

  return (
    <div className="ob-overlay">
      <div className="ob-screen">
        <StepDots current={step} />

        {/* ── STEP 1: Welcome ── */}
        {step === 'welcome' && (
          <div className="ob-body">
            <div className="ob-logo-icon">
              <span style={{ color: '#00A651' }}>SUB</span><span style={{ color: '#fff' }}>SNUB</span>
            </div>
            <h2 className="ob-title">Your subscriptions, organised.</h2>
            <p className="ob-text">Subsnub helps you manage, categorise, and clean up your YouTube subscriptions. With The Critic watching over your shoulder.</p>
            <button className="ob-btn-primary" onClick={() => setStep('connect')}>
              Let&rsquo;s go
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}

        {/* ── STEP 2: Connect YouTube ── */}
        {step === 'connect' && (
          <div className="ob-body">
            <h2 className="ob-title">Import your subscriptions</h2>
            <p className="ob-text">Connect your YouTube account so Subsnub can see your subscriptions. We only need read access — we&rsquo;ll never modify anything.</p>
            <div className="ob-connect-card">
              <div className="ob-connect-row">
                <div className="ob-connect-icon" style={{ background: '#FF0000' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 6.5l5.5 3.5L8 13.5z" fill="#fff" /></svg>
                </div>
                <div>
                  <div className="ob-connect-title">YouTube</div>
                  <div className="ob-connect-meta">Read-only access</div>
                </div>
              </div>
              <div className="ob-connect-scope">
                <div className="ob-scope-icon"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                View your subscriptions
              </div>
              <div className="ob-connect-scope">
                <div className="ob-scope-icon"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
                View channel information
              </div>
              <div className="ob-connect-scope">
                <div className="ob-scope-icon ob-scope-no"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" /></svg></div>
                <span style={{ color: 'var(--text-muted)' }}>No write or delete access</span>
              </div>
            </div>
            <button className="ob-btn-primary" onClick={handleConnect}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 4.5l5 3.5-5 3.5z" fill="#fff" /></svg>
              Connect YouTube
            </button>
          </div>
        )}

        {/* ── STEP 2b: Syncing ── */}
        {step === 'syncing' && (
          <div className="ob-body ob-body-loading">
            <div className="ob-spinner" />
            <div className="ob-checklist">
              {syncChecks.map((check, i) => (
                <div key={i} className={`ob-check-item ${check.status}`}>
                  <div className={`ob-check-icon ${check.status}`}>
                    {check.status === 'done' && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  {check.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Assessment ── */}
        {step === 'assessment' && (
          <div className="ob-body">
            <div className="ob-stat-pills">
              <div className="ob-stat-pill" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
                <span className="ob-stat-num">{subCount}</span> subscriptions
              </div>
              <div className="ob-stat-pill" style={{ background: 'var(--orange-soft)', color: 'var(--orange-text)' }}>
                <span className="ob-stat-num">{inactiveCount}</span> inactive
              </div>
            </div>

            <div className="ob-critic-card">
              <div className="ob-critic-head">
                <div className="ob-critic-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l2 4 4.5.6-3.2 3.2.7 4.4L8 11.5l-4 2.2.7-4.4L1.5 6.1l4.5-.6z" fill="#fff" /></svg></div>
                <span className="ob-critic-label">The Critic</span>
              </div>
              <div className="ob-critic-quote">&ldquo;Wow. {subCount} subscriptions. I&rsquo;d better get to work on this asap...&rdquo;</div>
              <div className="ob-critic-followup">&ldquo;Before I start scrubbing, would you like to upload your watch history so I can get a better idea of how I can be of service?&rdquo;</div>
            </div>

            <div className="ob-wh-card">
              <div className="ob-wh-title">Want more accurate insights?</div>
              <div className="ob-wh-text">Upload your YouTube watch history from Google Takeout and The Critic can tell you which channels you actually watch vs which ones are just taking up space.</div>
              <div className="ob-wh-actions">
                <button className="ob-wh-btn" onClick={() => setStep('upload')}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v7M4 6l3-3.5 3 3.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M2.5 11h9" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  Upload watch history
                </button>
                <button className="ob-wh-skip" onClick={() => setStep('autosort')}>Skip for now</button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3a: Upload instructions ── */}
        {step === 'upload' && (
          <div className="ob-body" style={{ textAlign: 'left' }}>
            <div className="ob-howto-card">
              <div className="ob-howto-title">How to export your watch history</div>
              {[
                { title: 'Go to Google Takeout', text: <>Visit <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="ob-link">takeout.google.com</a> and sign in with the same Google account you use for YouTube.</> },
                { title: 'Deselect all, then select YouTube', text: 'Click "Deselect all" first, then scroll down and tick "YouTube and YouTube Music" only.' },
                { title: 'Change format to JSON', text: 'Click "Multiple formats", find "History" and change the dropdown from HTML to JSON. Click OK.' },
                { title: 'Select only History', text: 'Click "All YouTube data included", then "Deselect all", then tick only "History". Click OK.' },
                { title: 'Create export and download', text: 'Click "Next step", then "Create export". Google will email you when it\'s ready (usually a few minutes). Download and unzip the file.' },
                { title: 'Upload the file below', text: <span>Find <code className="ob-code">watch-history.json</code> in the Takeout folder and drop it here.</span> },
              ].map((s, i) => (
                <div key={i} className="ob-howto-step">
                  <div className="ob-howto-num">{i + 1}</div>
                  <div className="ob-howto-content">
                    <div className="ob-howto-step-title">{s.title}</div>
                    <div className="ob-howto-step-text">{s.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ob-upload-zone" onClick={() => fileRef.current?.click()}>
              <div className="ob-upload-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v8M5.5 7L9 3.5 12.5 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 13h12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <div className="ob-upload-text">{parsing ? 'Parsing...' : 'Drop watch-history.json here'}</div>
              <div className="ob-upload-meta">or click to browse</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button className="ob-wh-skip" onClick={() => setStep('autosort')}>I&rsquo;ll do this later in Settings</button>
            </div>
            <input ref={fileRef} type="file" accept=".json,.html" onChange={handleFile} style={{ display: 'none' }} />
          </div>
        )}

        {/* ── STEP 3b: Auto-sort proposition ── */}
        {step === 'autosort' && (
          <div className="ob-body">
            <div className="ob-autosort-card">
              <div className="ob-autosort-title">Let The Critic auto-sort your subscriptions</div>
              <div className="ob-autosort-text">The Critic will analyse your {subCount || channels.length} subscriptions and automatically organise them into categories based on each channel&rsquo;s content type, topic, and upload patterns.</div>
              <div className="ob-autosort-note">This gives you a clean starting point. You can rename categories, move channels between them, or create your own categories at any time.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button className="ob-autosort-btn" onClick={handleAutoSort}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  Auto-sort my subscriptions
                </button>
                <button className="ob-wh-skip" onClick={() => { setSortResult({ sorted: 0, cats: 0, catNames: [] }); setStep('complete'); }}>I&rsquo;ll sort manually</button>
              </div>
            </div>
            <button className="ob-btn-primary" style={{ marginTop: 12 }} onClick={finish}>
              Go to dashboard
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}

        {/* ── Sorting in progress ── */}
        {step === 'sorting' && (
          <div className="ob-body ob-body-loading">
            <div className="ob-spinner" />
            <div className="ob-sort-status">Sorting your subscriptions...</div>
            <div className="ob-sort-count">{sortProgress.done} / {sortProgress.total || subCount || channels.length}</div>
            <div className="ob-sort-sub">channels categorised</div>
          </div>
        )}

        {/* ── Sort complete ── */}
        {step === 'complete' && (
          <div className="ob-body">
            {sortResult && sortResult.sorted > 0 && (
              <>
                <div className="ob-comp-stats">
                  <div className="ob-comp-stat" style={{ background: 'var(--accent-soft)' }}>
                    <div className="ob-comp-val" style={{ color: 'var(--accent)' }}>{sortResult.sorted}</div>
                    <div className="ob-comp-label" style={{ color: 'var(--accent-text)' }}>channels sorted</div>
                  </div>
                  <div className="ob-comp-stat" style={{ background: 'var(--orange-soft)' }}>
                    <div className="ob-comp-val" style={{ color: 'var(--orange)' }}>{sortResult.catNames.length}</div>
                    <div className="ob-comp-label" style={{ color: 'var(--orange-text)' }}>categories created</div>
                  </div>
                </div>

                <div className="ob-cat-pills">
                  {sortResult.catNames.map((c, i) => (
                    <span key={c.name} className={`ob-cat-pill${i === 0 ? ' highlight' : ''}`}>{c.name} {c.count}</span>
                  ))}
                </div>
              </>
            )}

            <div className="ob-critic-card">
              <div className="ob-critic-head">
                <div className="ob-critic-icon"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l2 4 4.5.6-3.2 3.2.7 4.4L8 11.5l-4 2.2.7-4.4L1.5 6.1l4.5-.6z" fill="#fff" /></svg></div>
                <span className="ob-critic-label">The Critic</span>
              </div>
              <div className="ob-critic-quote">
                {sortResult && sortResult.sorted > 0
                  ? `"Done. ${sortResult.sorted} channels sorted into ${sortResult.catNames.length} categories. Not bad for 30 seconds of work. You can rename, move, or create your own categories whenever you like. Now let me show you around."`
                  : `"Alright, your subscriptions are loaded. You can sort them yourself from the Subscriptions page. Now let me show you around."`
                }
              </div>
              <div className="ob-critic-sig">&mdash; The Critic, getting started</div>
            </div>

            <button className="ob-btn-primary" onClick={finish}>
              Go to dashboard
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
