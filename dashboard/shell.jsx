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
        <div className="kpi-label">Tổng Lượt Thảo Luận</div>
        <div className="kpi-value mono">{fmt(kpi.totalPosts)}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{fmt(kpi.relevantPosts)} liên quan</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Lượt Thảo Luận phân tích</div>
        <div className="kpi-value mono">{fmt(kpi.relevantPosts)}</div>
        <div className="kpi-delta up mono">đã lọc spam</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Master Topics</div>
        <div className="kpi-value mono">{kpi.masterTopics ?? '—'}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{kpi.subTopics ?? 0} chủ đề phụ</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Đề cập tiêu cực</div>
        <div className="kpi-value mono">{fmt(kpi.negativeMentions)}</div>
        <div className="kpi-delta down mono">{negPct}% Lượt Thảo Luận liên quan</div>
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

function Section({ id, num, title, indication, soaOnly, children }) {
  const soaScope = (window.ChiComData || {}).SOA_SCOPE;
  return (
    <section className="qsection" id={id}>
      {title ? (
        <div className="qhead">
          <span className="qnum">{num}</span>
          <div className="qtitle"><h2>{title}</h2></div>
          {soaOnly && <ScopeBadge />}
        </div>
      ) : (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="qnum">{num}</span>
          {soaOnly && <ScopeBadge />}
        </div>
      )}
      {soaOnly && soaScope && (
        <div style={{
          margin: '0 0 10px',
          padding: '8px 14px',
          background: 'oklch(0.96 0.04 25 / 0.4)',
          border: '1px solid oklch(0.80 0.08 25)',
          borderRadius: 4,
          fontSize: 11,
          color: 'var(--text-2)',
        }}>
          <b>Phạm vi dữ liệu:</b> Chỉ tính trên <b>{soaScope.totalRelevant.toLocaleString()}</b> Lượt Thảo Luận từ <b>{soaScope.groupIds.length} nhóm SOA</b> ({soaScope.groupNames.join(', ')}) — câu hỏi này đặc thù cho Amazon sellers.
        </div>
      )}
      {indication && (
        <div style={{
          margin: '0 0 14px',
          padding: '10px 14px',
          background: 'oklch(0.96 0.03 60)',
          borderLeft: '4px solid oklch(0.68 0.17 60)',
          borderRadius: 4,
          fontSize: 12,
          color: 'var(--text-2)',
          lineHeight: 1.5,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(0.45 0.17 60)', marginBottom: 4 }}>
            Indication
          </div>
          {indication}
        </div>
      )}
      {children}
    </section>
  );
}
window.Section = Section;

function ScopeBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 4,
      background: 'oklch(0.60 0.20 25 / 0.15)',
      color: 'oklch(0.45 0.20 25)',
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      border: '1px solid oklch(0.80 0.12 25)',
    }}>
      <span style={{ width: 5, height: 5, background: 'oklch(0.55 0.20 25)', borderRadius: '50%' }}></span>
      Chỉ SOA
    </span>
  );
}
window.ScopeBadge = ScopeBadge;

// Insight text-box under every chart — auto-generated from the data passed in
function Insight({ children }) {
  if (!children || (Array.isArray(children) && children.every(c => !c))) return null;
  return (
    <div style={{
      marginTop: 10,
      padding: '8px 12px',
      background: 'oklch(0.97 0.01 260)',
      borderLeft: '3px solid oklch(0.55 0.17 260)',
      borderRadius: 3,
      fontSize: 11,
      color: 'var(--text-2)',
      lineHeight: 1.5,
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(0.45 0.17 260)', marginRight: 6 }}>
        Insight
      </span>
      {children}
    </div>
  );
}
window.Insight = Insight;

// Divider banner between sections (Thông tin sơ bộ / Thông tin chi tiết)
function SectionBanner({ label, sublabel }) {
  return (
    <div style={{
      margin: '24px 0 16px',
      padding: '14px 20px',
      background: 'linear-gradient(90deg, oklch(0.68 0.17 60), oklch(0.72 0.15 30))',
      borderRadius: 6,
      color: '#fff',
      display: 'flex',
      alignItems: 'baseline',
      gap: 14,
    }}>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
      {sublabel && <span style={{ fontSize: 12, opacity: 0.9 }}>{sublabel}</span>}
    </div>
  );
}
window.SectionBanner = SectionBanner;

// Compact time-range pill (rendered near the page header)
function TimeRangeBadge() {
  const dr = (window.ChiComData || {}).DATE_RANGE || {};
  const fmt = (s) => {
    if (!s) return '—';
    try {
      const d = new Date(s);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return s; }
  };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px', borderRadius: 999,
      background: 'oklch(0.96 0.02 60)', border: '1px solid oklch(0.85 0.04 60)',
      fontSize: 12, color: 'var(--text-2)',
      marginTop: 8,
    }}>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>Khoảng thời gian:</span>
      <span className="mono">{fmt(dr.start)} → {fmt(dr.end)}</span>
      <span style={{ color: 'var(--text-3)' }}>· {dr.monthsCount || 0} tháng</span>
    </div>
  );
}
window.TimeRangeBadge = TimeRangeBadge;

// Overview panel — Section 1 content (community + persona breakdown)
function OverviewPanel() {
  const tt = window.useTooltip();
  const ov = (window.ChiComData || {}).OVERVIEW;
  if (!ov) return null;

  const palette = [
    'oklch(0.68 0.17 60)', 'oklch(0.55 0.17 260)', 'oklch(0.62 0.15 155)',
    'oklch(0.60 0.20 25)', 'oklch(0.58 0.14 190)', 'oklch(0.55 0.17 290)',
    'oklch(0.75 0.17 90)', 'oklch(0.62 0.15 320)', 'oklch(0.70 0.02 260)',
  ];

  const arc = (cx, cy, r, a0, a1) => {
    const large = a1 - a0 > 0.5 ? 1 : 0;
    const sx = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r;
    const sy = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r;
    const ex = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r;
    const ey = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r;
    return `M${cx},${cy} L${sx},${sy} A${r},${r} 0 ${large} 1 ${ex},${ey} Z`;
  };

  const commTotal = ov.communities.reduce((a, b) => a + b.count, 0) || 1;
  let cAcc = 0;
  const commSeg = ov.communities.map((c, i) => {
    const s = cAcc; cAcc += c.count / commTotal;
    return { ...c, start: s, end: cAcc, color: palette[i % palette.length] };
  });

  const persTotal = ov.personas.reduce((a, b) => a + b.count, 0) || 1;
  let pAcc = 0;
  const persSeg = ov.personas.map((p, i) => {
    const s = pAcc; pAcc += p.count / persTotal;
    return { ...p, start: s, end: pAcc, color: palette[i % palette.length] };
  });
  const maxComm = Math.max(...ov.communities.map(c => c.count), 1);

  const Narrative = ({ children }) => (
    <div style={{
      padding: '12px 16px',
      background: 'oklch(0.68 0.17 60 / 0.12)',
      borderLeft: '4px solid oklch(0.68 0.17 60)',
      borderRadius: 4,
      fontSize: 13,
      color: 'var(--text)',
      lineHeight: 1.55,
    }}>{children}</div>
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Narrative>
        <b>Thống kê Lượt Thảo Luận sau IRR theo community:</b>{' '}
        Tổng Lượt Thảo Luận của <b>{ov.soaGroupCount} nhóm SOA</b> chiếm tỉ trọng <b>{ov.soaPct}% SOV</b> trong{' '}
        <b>{ov.monthsCount} tháng</b>, trong đó <b>{ov.topCommunity.name}</b> áp đảo với{' '}
        <b>{ov.topCommunity.count.toLocaleString()}</b> Lượt Thảo Luận (~{ov.topCommunityPct}% SOV).
      </Narrative>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Lượt Thảo Luận theo community</div>
            <span className="card-meta">{commTotal.toLocaleString()} tổng</span>
          </div>
          <div>
            {ov.communities.map((c, i) => (
              <div key={c.id} className="rowbar" style={{ gridTemplateColumns: '160px 1fr 60px' }}
                onMouseEnter={e => tt.show(e, `<b>${c.name}</b><br/>${c.count.toLocaleString()} Lượt Thảo Luận · ${c.type}`)}
                onMouseMove={tt.move} onMouseLeave={tt.hide}>
                <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>
                  <span className={`badge ${c.type === 'SOA' ? 'soa' : 'ec'}`} style={{ marginRight: 6 }}>{c.type}</span>
                  {c.short}
                </div>
                <div className="rowbar-track">
                  <div className="rowbar-fill" style={{ width: `${(c.count / maxComm) * 100}%`, background: palette[i % palette.length] }}></div>
                </div>
                <div className="rowbar-value mono">{c.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Phân bố community (% SOV)</div>
            <span className="card-meta">SOA {ov.soaPct}% · EC {ov.ecPct}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width={200} height={200}>
              {commSeg.map(s => (
                <path key={s.id} d={arc(100, 100, 90, s.start, s.end)} fill={s.color}
                  stroke="var(--panel)" strokeWidth={1}
                  onMouseEnter={e => tt.show(e, `<b>${s.name}</b><br/>${s.count.toLocaleString()} · ${Math.round((s.count / commTotal) * 100)}%`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
              ))}
            </svg>
            <div style={{ flex: 1, fontSize: 11, maxHeight: 200, overflowY: 'auto' }}>
              {commSeg.map(s => (
                <div key={s.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ width: 9, height: 9, background: s.color, borderRadius: 2, flexShrink: 0 }}></span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.name}>{s.short}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{Math.round((s.count / commTotal) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Narrative>
        <b>Thống kê Lượt Thảo Luận sau lọc theo persona:</b>{' '}
        {ov.topPersona && <><b>{ov.topPersona.vn}</b> chiếm tỉ trọng áp đảo với <b>{ov.topPersona.count.toLocaleString()}</b> Lượt Thảo Luận</>}
        {ov.secondPersona && <>, tiếp đó là <b>{ov.secondPersona.vn}</b> với <b>{ov.secondPersona.count.toLocaleString()}</b> Lượt Thảo Luận.</>}
      </Narrative>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Lượt Thảo Luận theo persona</div>
            <span className="card-meta">{persTotal.toLocaleString()} tổng</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11 }}>
                <th style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>Seller Type</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 600 }}>Lượt Thảo Luận</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 600 }}>%</th>
              </tr>
            </thead>
            <tbody>
              {ov.personas.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '7px 6px' }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, background: palette[i % palette.length], borderRadius: 2, marginRight: 8, verticalAlign: 'middle' }}></span>
                    {p.vn}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', padding: '7px 6px' }}>{p.count.toLocaleString()}</td>
                  <td className="mono" style={{ textAlign: 'right', padding: '7px 6px', color: 'var(--text-3)' }}>{p.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Phân bố persona (%)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width={220} height={220}>
              {persSeg.map(s => (
                <path key={s.id} d={arc(110, 110, 100, s.start, s.end)} fill={s.color}
                  stroke="var(--panel)" strokeWidth={1}
                  onMouseEnter={e => tt.show(e, `<b>${s.vn}</b><br/>${s.count.toLocaleString()} · ${s.pct}%`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
              ))}
            </svg>
            <div style={{ flex: 1, fontSize: 11 }}>
              {persSeg.map(s => (
                <div key={s.id} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, flexShrink: 0 }}></span>
                  <span style={{ flex: 1 }}>{s.vn}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {tt.node}
    </div>
  );
}
window.OverviewPanel = OverviewPanel;
