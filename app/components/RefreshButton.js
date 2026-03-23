'use client';

import { useRSSRefresh } from '../../hooks/useRSSRefresh';

export default function RefreshButton() {
  const { refresh, loading, result } = useRSSRefresh();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        className="ct-pill-btn"
        onClick={refresh}
        disabled={loading}
      >
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
        >
          <path d="M1.5 7a5.5 5.5 0 019.3-4M12.5 7a5.5 5.5 0 01-9.3 4" />
          <path d="M10.8 1v2h2M3.2 13v-2h-2" />
        </svg>
        {loading ? 'Refreshing…' : 'Refresh feed'}
      </button>

      {result && (
        <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 500 }}>
          {result.newVideos > 0
            ? `Found ${result.newVideos} new videos`
            : 'All up to date'
          }
        </span>
      )}
    </div>
  );
}
