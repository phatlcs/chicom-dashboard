/* global React */
const { useState, useEffect, useRef, useMemo } = React;
const D = window.ChiComData;

// ----- shared helpers -----
const clsx = (...xs) => xs.filter(Boolean).join(' ');

function useTooltip() {
  const [tt, setTt] = useState({ x: 0, y: 0, html: '', show: false });
  const show = (e, html) => setTt({ x: e.clientX, y: e.clientY, html, show: true });
  const move = (e) => setTt(t => ({ ...t, x: e.clientX, y: e.clientY }));
  const hide = () => setTt(t => (t.show ? { ...t, show: false } : t));

  // Auto-hide on scroll / mouse leaving the document (stops stuck tooltips)
  useEffect(() => {
    const onDismiss = () => setTt(t => (t.show ? { ...t, show: false } : t));
    window.addEventListener('scroll', onDismiss, true);
    window.addEventListener('wheel', onDismiss, { passive: true });
    document.addEventListener('mouseleave', onDismiss);
    window.addEventListener('blur', onDismiss);
    return () => {
      window.removeEventListener('scroll', onDismiss, true);
      window.removeEventListener('wheel', onDismiss);
      document.removeEventListener('mouseleave', onDismiss);
      window.removeEventListener('blur', onDismiss);
    };
  }, []);

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

// Header — just the brand, no fake nav pills or status chips
function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark">CC</div>
          <span>ChiCom</span>
          <span className="brand-sub">/ Community Insights</span>
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
        <div className="kpi-label">Tổng bài</div>
        <div className="kpi-value mono">{fmt(kpi.totalPosts)}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{fmt(kpi.relevantPosts)} liên quan</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Bài phân tích</div>
        <div className="kpi-value mono">{fmt(kpi.relevantPosts)}</div>
        <div className="kpi-delta up mono">đã lọc spam</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Chủ đề chính</div>
        <div className="kpi-value mono">{kpi.masterTopics ?? '—'}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{kpi.subTopics ?? 0} chủ đề phụ</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Đề cập tiêu cực</div>
        <div className="kpi-value mono">{fmt(kpi.negativeMentions)}</div>
        <div className="kpi-delta down mono">{negPct}% bài liên quan</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Nhóm đang hoạt động</div>
        <div className="kpi-value mono">{kpi.activeGroups ?? '—'}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>
          {kpi.analysedGroups ?? 0} phân tích · {kpi.soaGroups ?? 0} SOA + {kpi.ecGroups ?? 0} EC
        </div>
      </div>
    </div>
  );
}
window.KpiStrip = KpiStrip;

// FilterRail removed — the segmented controls didn't actually filter any charts.
// Keep a stub so app.jsx's reference doesn't crash if cached.
function FilterRail() { return null; }
window.FilterRail = FilterRail;

function AnchorRail() {
  const items = [
    ['Q1', 'Trọng số chủ đề'],
    ['Q2', 'Persona × Chủ đề'],
    ['Q3', 'Seller vs Prospect'],
    ['Q4', 'Xu hướng'],
    ['Q5', 'Thời điểm tiêu cực'],
    ['Q7', 'Lý do gia nhập'],
    ['Q8', 'Dấu hiệu rời bỏ'],
    ['Q9', 'Nhóm tham gia'],
    ['Q10', 'Ngành hàng'],
    ['Q11', 'Tools'],
    ['Q12', 'Dịch vụ'],
    ['Q13', 'Khóa học'],
    ['Q14', 'Tăng trưởng'],
  ];
  return (
    <div className="anchor-rail">
      <div className="anchor-list">
        <span className="filter-rail-label" style={{ marginRight: 6 }}>Đi đến</span>
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
