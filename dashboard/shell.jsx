/* global React */
const { useState, useEffect, useRef, useMemo } = React;
const D = window.ChiComData;

// ----- shared helpers -----
const clsx = (...xs) => xs.filter(Boolean).join(' ');

function useTooltip() {
  const [tt, setTt] = useState({ x: 0, y: 0, html: '', show: false });
  const show = (e, html) => setTt({ x: e.clientX, y: e.clientY, html, show: true });
  const move = (e) => setTt(t => ({ ...t, x: e.clientX, y: e.clientY }));
  const hide = () => setTt(t => ({ ...t, show: false }));
  const node = React.createElement('div', {
    className: clsx('tt', tt.show && 'show'),
    style: { left: tt.x + 12, top: tt.y + 12 },
    dangerouslySetInnerHTML: { __html: tt.html }
  });
  return { show, move, hide, node };
}
window.useTooltip = useTooltip;

// Sparkline
function Sparkline({ values, color, width = 120, height = 28 }) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color || 'var(--accent)'} strokeWidth="1.5" />
    </svg>
  );
}
window.Sparkline = Sparkline;

// Heatmap color ramp — returns oklch based on intensity 0..1
function heatColor(intensity, accent = 'indigo') {
  const v = Math.max(0, Math.min(1, intensity));
  // Use accent-based ramp: lighter to darker of the accent color
  // We'll just use lightness ramp against the accent hue
  const hueMap = { indigo: 265, blue: 230, teal: 190, violet: 290, rose: 10, amber: 60 };
  const h = hueMap[accent] ?? 265;
  const l = 0.96 - v * 0.45;
  const c = 0.02 + v * 0.16;
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h})`;
}
window.heatColor = heatColor;

// Heatmap color with fixed bins (for Q1 style)
function binColor(v, bins = [5, 10, 20, 30, 50], accent = 'indigo') {
  let bin = 0;
  for (let i = 0; i < bins.length; i++) { if (v >= bins[i]) bin = i + 1; }
  return heatColor(bin / bins.length, accent);
}
window.binColor = binColor;

// Header / KPI / filters
function TopBar({ section, sections, onNav }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark">CC</div>
          <span>ChiCom</span>
          <span className="brand-sub">/ Community Insights</span>
        </div>
        <div className="nav-pills">
          <button className="nav-pill active">Overview</button>
          <button className="nav-pill">Topics</button>
          <button className="nav-pill">Personas</button>
          <button className="nav-pill">Trends</button>
          <button className="nav-pill">Sentiment</button>
        </div>
        <div className="topbar-right">
          <span className="chip"><span className="chip-dot"></span>Live · last sync 3m ago</span>
          <span className="chip">Oct 2025 — Apr 2026</span>
        </div>
      </div>
    </div>
  );
}
window.TopBar = TopBar;

function KpiStrip() {
  const kpi = (window.ChiComData || {}).KPI || {};
  const fmt = n => n ? n.toLocaleString() : '—';
  const negPct = kpi.relevantPosts ? ((kpi.negativeMentions / kpi.relevantPosts) * 100).toFixed(1) : '—';
  return (
    <div className="kpi-strip">
      <div className="kpi">
        <div className="kpi-label">Total Posts</div>
        <div className="kpi-value mono">{fmt(kpi.totalPosts)}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{fmt(kpi.relevantPosts)} relevant</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Analysed Posts</div>
        <div className="kpi-value mono">{fmt(kpi.relevantPosts)}</div>
        <div className="kpi-delta up mono">spam filtered out</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Master Topics</div>
        <div className="kpi-value mono">{kpi.masterTopics || 7}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{kpi.subTopics || 142} sub-topics</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Negative Mentions</div>
        <div className="kpi-value mono">{fmt(kpi.negativeMentions)}</div>
        <div className="kpi-delta down mono">{negPct}% of relevant posts</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Active Groups</div>
        <div className="kpi-value mono">{kpi.activeGroups || 9}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{kpi.analysedGroups || 6} analysed · 3 SOA + 3 EC</div>
      </div>
    </div>
  );
}
window.KpiStrip = KpiStrip;

function FilterRail({ groupType, setGroupType, dateRange, setDateRange }) {
  return (
    <div className="filter-rail">
      <span className="filter-rail-label">Group type</span>
      <div className="seg">
        {['All', 'SOA', 'EC'].map(g => (
          <button key={g} className={groupType === g ? 'on' : ''} onClick={() => setGroupType(g)}>{g}</button>
        ))}
      </div>
      <span className="filter-rail-label" style={{ marginLeft: 12 }}>Date range</span>
      <div className="seg">
        {['7d', '30d', '90d', '6m', 'All'].map(r => (
          <button key={r} className={dateRange === r ? 'on' : ''} onClick={() => setDateRange(r)}>{r}</button>
        ))}
      </div>
      <span className="filter-rail-label" style={{ marginLeft: 12 }}>Persona</span>
      <div className="seg">
        {['All', 'Seller', 'Prospect', 'Service Provider'].map(p => (
          <button key={p} className={p === 'All' ? 'on' : ''}>{p}</button>
        ))}
      </div>
    </div>
  );
}
window.FilterRail = FilterRail;

function AnchorRail() {
  const items = [
    ['Q1', 'Topic weights'],
    ['Q2', 'Persona × Topics'],
    ['Q3', 'Seller vs Prospect'],
    ['Q4', 'Trends'],
    ['Q5', 'Negative timing'],
    ['Q7', 'Join triggers'],
    ['Q8', 'Abandon signals'],
    ['Q9', '—'],
    ['Q10', 'Categories'],
    ['Q11', 'Tools'],
    ['Q12', 'Services'],
    ['Q13', 'Courses'],
    ['Q14', 'Growth'],
  ];
  return (
    <div className="anchor-rail">
      <div className="anchor-list">
        <span className="filter-rail-label" style={{ marginRight: 6 }}>Jump to</span>
        {items.map(([q, label]) => (
          <a key={q} href={`#${q}`}>{q} · {label}</a>
        ))}
      </div>
    </div>
  );
}
window.AnchorRail = AnchorRail;

function Section({ id, num, title, children }) {
  return (
    <section className="qsection" id={id}>
      {title ? (
        <div className="qhead">
          <span className="qnum">{num}</span>
          <div className="qtitle"><h2>{title}</h2></div>
        </div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          <span className="qnum">{num}</span>
        </div>
      )}
      {children}
    </section>
  );
}
window.Section = Section;
