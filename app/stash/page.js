'use client';

export default function StashPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div className="stash-header">
        <div className="stash-header-row">
          <div className="stash-title">Stash <span>your saved videos</span></div>
          <div className="stash-header-right">
            <div className="stash-header-stat">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="9" rx="1.5" stroke="var(--ocean)" strokeWidth="1.2" /><path d="M4 7l2 2 4-4" stroke="var(--ocean)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <strong>0</strong> saved
            </div>
            <div className="stash-header-stat">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="var(--ocean)" strokeWidth="1.2" strokeLinecap="round" /></svg>
              <strong>0</strong> collections
            </div>
          </div>
        </div>
      </div>

      <div className="stash-content">
        {/* Critic strip */}
        <div className="stash-critic-strip">
          <div className="stash-critic-icon" style={{ background: 'var(--orange)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.8 3.6 4 .5-2.9 2.8.7 4L7 10.5l-3.6 1.9.7-4L1.2 5.6l4-.5z" fill="#fff" /></svg>
          </div>
          <div className="stash-critic-msg">"Nothing saved yet. When you find a video worth coming back to, hit the save button. I'll keep it safe."</div>
        </div>

        {/* Collections */}
        <div className="stash-section-header">
          <div className="stash-section-title">
            Collections
            <span className="stash-section-count">0</span>
          </div>
          <span className="stash-section-link">Manage</span>
        </div>

        <div className="stash-collections-row">
          <div className="stash-collection-add">
            <div className="stash-collection-add-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="var(--ocean)" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>New collection</span>
          </div>
        </div>

        {/* Recently saved */}
        <div className="stash-section-header">
          <div className="stash-section-title">
            Recently saved
            <span className="stash-section-count">0 videos</span>
          </div>
        </div>

        {/* Empty state */}
        <div className="stash-empty">
          <div className="stash-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ocean)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
              <path d="M17 21v-8a1 1 0 00-1-1H8a1 1 0 00-1 1v8" />
              <path d="M7 3v4h10V3" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Your stash is empty</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.5 }}>
            Save videos from your feed to watch later. They'll appear here organised by when you saved them.
          </div>
        </div>
      </div>
    </div>
  );
}
