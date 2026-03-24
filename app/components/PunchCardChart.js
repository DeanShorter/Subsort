'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChannelData } from './ChannelDataContext';

export default function PunchCardChart() {
  const { channels, categories, categoryColours, feedVideos, chCats } = useChannelData();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [mode, setMode] = useState('week');
  const [hidden, setHidden] = useState(new Set());

  // Build real data from feedVideos grouped by category + time
  const chartData = useMemo(() => {
    if (!feedVideos.length || !categories.length) return null;

    const channelMap = {};
    channels.forEach(ch => { channelMap[ch.channelId] = ch; });

    const now = new Date();
    const catList = categories.slice(0, 9); // Max 9 categories
    const colours = catList.map(c => categoryColours[c] || '#666');

    // Build time labels and bucket videos
    let labels, bucketFn;

    if (mode === 'day') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      bucketFn = (d) => d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0, Sun=6
    } else if (mode === 'week') {
      // Last 12 weeks
      labels = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        labels.push(`W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('en', { month: 'short' })}`);
      }
      bucketFn = (d) => {
        const weeksAgo = Math.floor((now - d) / (7 * 24 * 60 * 60 * 1000));
        return Math.max(0, 11 - weeksAgo);
      };
    } else if (mode === 'month') {
      labels = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(d.toLocaleString('en', { month: 'short' }));
      }
      bucketFn = (d) => {
        const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        return Math.max(0, 11 - monthsAgo);
      };
    } else {
      // Year — last 5 years + current
      const startYear = now.getFullYear() - 5;
      labels = [];
      for (let y = startYear; y <= now.getFullYear(); y++) labels.push(String(y));
      bucketFn = (d) => Math.max(0, d.getFullYear() - startYear);
    }

    // Count videos per category per bucket
    const data = catList.map(() => new Array(labels.length).fill(0));

    feedVideos.forEach(v => {
      if (!v.publishedAt) return;
      const d = new Date(v.publishedAt);
      const ch = channelMap[v.channelId];
      if (!ch) return;
      const cats = ch.categories || [];
      const cat = cats[0];
      const catIdx = catList.indexOf(cat);
      if (catIdx === -1) return;
      const bucket = bucketFn(d);
      if (bucket >= 0 && bucket < labels.length) {
        data[catIdx][bucket]++;
      }
    });

    return { labels, data, catList, colours };
  }, [feedVideos, channels, categories, categoryColours, mode, chCats]);

  const maxR = mode === 'day' ? 14 : mode === 'week' ? 26 : mode === 'month' ? 24 : 22;

  const renderChart = useCallback(() => {
    if (!chartData || !canvasRef.current) return;

    const { labels, data, catList, colours } = chartData;
    const visibleCats = catList.filter((_, i) => !hidden.has(i));
    const visibleIndices = catList.map((_, i) => i).filter(i => !hidden.has(i));

    const dataPoints = [];
    const bgColors = [];
    const borderColors = [];
    const rawData = [];

    const allVals = data.flat();
    const maxVal = Math.max(...allVals, 1);

    visibleIndices.forEach((ci, vi) => {
      labels.forEach((_, wi) => {
        const val = data[ci][wi];
        const r = Math.max(3, (val / maxVal) * maxR);
        const alpha = Math.min(0.9, 0.25 + (val / maxVal) * 0.65);
        const c = colours[ci];
        const cr = parseInt(c.slice(1, 3), 16) || 100;
        const cg = parseInt(c.slice(3, 5), 16) || 100;
        const cb = parseInt(c.slice(5, 7), 16) || 100;

        dataPoints.push({ x: wi, y: vi, r });
        rawData.push({ raw: val, cat: catList[ci], label: labels[wi] });
        bgColors.push(`rgba(${cr},${cg},${cb},${alpha})`);
        borderColors.push(c);
      });
    });

    const wrapH = Math.max(250, visibleCats.length * 48 + 80);
    canvasRef.current.parentElement.style.height = wrapH + 'px';

    if (chartRef.current) chartRef.current.destroy();

    // Dynamic import chart.js
    import('chart.js').then(({ Chart, BubbleController, LinearScale, PointElement, Tooltip }) => {
      Chart.register(BubbleController, LinearScale, PointElement, Tooltip);

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bubble',
        data: {
          datasets: [{
            data: dataPoints,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            hoverBorderWidth: 2,
            hoverBorderColor: '#fff',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 10, right: 20, bottom: 10, left: 10 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'var(--bg-surface-raised)',
              titleColor: 'var(--text-primary)',
              bodyColor: 'var(--text-secondary)',
              borderColor: 'var(--border-subtle)',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 10,
              titleFont: { family: 'Outfit', weight: '600', size: 13 },
              bodyFont: { family: 'DM Sans', size: 12 },
              callbacks: {
                title: (ctx) => rawData[ctx[0].dataIndex]?.cat || '',
                label: (ctx) => {
                  const d = rawData[ctx.dataIndex];
                  return d ? `${d.raw} videos · ${d.label}` : '';
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear', min: -0.5, max: labels.length - 0.5,
              grid: { color: 'rgba(255,255,255,0.06)', lineWidth: 0.5 },
              ticks: {
                color: 'rgba(255,255,255,0.4)',
                font: { family: 'DM Sans', size: 11 },
                stepSize: 1, autoSkip: false,
                maxRotation: mode === 'week' ? 45 : 0,
                callback: (v) => labels[v] || ''
              }
            },
            y: {
              type: 'linear', min: -0.5, max: visibleCats.length - 0.5,
              reverse: true,
              grid: { color: 'rgba(255,255,255,0.06)', lineWidth: 0.5 },
              ticks: {
                color: 'rgba(255,255,255,0.4)',
                font: { family: 'DM Sans', size: 11 },
                stepSize: 1,
                callback: (v) => visibleCats[v] || ''
              }
            }
          }
        }
      });
    });
  }, [chartData, hidden, maxR, mode]);

  useEffect(() => { renderChart(); return () => { chartRef.current?.destroy(); }; }, [renderChart]);

  // Summary stats
  const summary = useMemo(() => {
    if (!chartData) return null;
    const { data, catList, colours } = chartData;
    const visibleIndices = catList.map((_, i) => i).filter(i => !hidden.has(i));
    const totals = visibleIndices.map(ci => data[ci].reduce((a, b) => a + b, 0));
    const totalAll = totals.reduce((a, b) => a + b, 0);
    const topIdx = totals.indexOf(Math.max(...totals));
    const topCat = catList[visibleIndices[topIdx]] || '';
    const topPct = totalAll > 0 ? Math.round((totals[topIdx] / totalAll) * 100) : 0;
    const peakVals = visibleIndices.map(ci => Math.max(...data[ci]));
    const peakMax = Math.max(...peakVals);
    const peakIdx = peakVals.indexOf(peakMax);
    const peakCat = catList[visibleIndices[peakIdx]] || '';
    return {
      total: totalAll,
      topCat, topPct, topCol: colours[visibleIndices[topIdx]],
      peakMax, peakCat, peakCol: colours[visibleIndices[peakIdx]],
    };
  }, [chartData, hidden]);

  const toggleHidden = (i) => {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (!chartData) return null;

  return (
    <div className="analytics-card pc-wrap">
      <div className="pc-header">
        <h3 className="analytics-card-title">Viewing Activity</h3>
        <div className="pc-tabs">
          {['day', 'week', 'month', 'year'].map(m => (
            <button key={m} className={`pc-tab${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="pc-legend">
        {chartData.catList.map((cat, i) => (
          <span key={cat} className={`pc-legend-item${hidden.has(i) ? ' dim' : ''}`} onClick={() => toggleHidden(i)}>
            <span className="pc-legend-dot" style={{ background: chartData.colours[i] }} />
            {cat}
          </span>
        ))}
      </div>

      <div className="pc-canvas" style={{ height: 400 }}>
        <canvas ref={canvasRef} />
      </div>

      {summary && (
        <div className="pc-summary">
          <div className="pc-stat">
            <div className="pc-stat-val">{summary.total.toLocaleString()}</div>
            <div className="pc-stat-label">Total videos in feed</div>
          </div>
          <div className="pc-stat">
            <div className="pc-stat-val" style={{ color: summary.topCol }}>{summary.topCat}</div>
            <div className="pc-stat-label">Most active · {summary.topPct}%</div>
          </div>
          <div className="pc-stat">
            <div className="pc-stat-val" style={{ color: summary.peakCol }}>{summary.peakMax}</div>
            <div className="pc-stat-label">Peak · {summary.peakCat}</div>
          </div>
        </div>
      )}
    </div>
  );
}
