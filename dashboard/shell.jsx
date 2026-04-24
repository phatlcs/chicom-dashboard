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
        <div className="kpi-label">Tổng mentions</div>
        <div className="kpi-value mono">{fmt(kpi.totalPosts)}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{fmt(kpi.relevantPosts)} relevant</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">mentions phân tích</div>
        <div className="kpi-value mono">{fmt(kpi.relevantPosts)}</div>
        <div className="kpi-delta up mono">spam filtered out</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Master Topics</div>
        <div className="kpi-value mono">{kpi.masterTopics ?? '—'}</div>
        <div className="kpi-delta mono" style={{ color: 'var(--text-3)' }}>{kpi.subTopics ?? 0} sub-topics</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Negative mentions</div>
        <div className="kpi-value mono">{fmt(kpi.negativeMentions)}</div>
        <div className="kpi-delta down mono">{negPct}% of relevant mentions</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Active Groups</div>
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
  // Labels from remixed-91e62673.html TOC.
  const items = [
    ['Q1',  '#Q1',  'Topics nhiều nhất / Weight từng group'],
    ['Q2',  '#Q2',  'Topics theo Persona / từng group'],
    ['Q3',  '#Q3',  'Seller vs Prospect deep-dive'],
    ['Q4',  '#Q4',  'Master Topic monthly trends'],
    ['Q5',  '#Q5',  'Negative — thời điểm trong tuần'],
    ['Q6',  '#Q6',  'Negative — thời điểm trong ngày'],
    ['Q7',  '#Q7',  'Topics kêu gọi gia nhập Amazon'],
    ['Q8',  '#Q8',  'Topics tín hiệu rời bỏ Amazon'],
    ['Q9',  '#Q9',  'Active personas · KOL mentions'],
    ['Q10', '#Q10', 'Most-discussed categories'],
    ['Q11', '#Q11', 'Amazon product/program adoption'],
    ['Q12', '#Q12', '3rd-party services nhu cầu'],
    ['Q13', '#Q13', 'Amazon courses được quan tâm'],
    ['Q14', '#Q14', 'Business growth & P&L discussion'],
  ];
  return (
    <div className="anchor-rail">
      <div className="anchor-list">
        <span className="filter-rail-label">Mục lục</span>
        <div className="anchor-grid">
          {items.map(([q, href, label]) => (
            <a key={q} href={href}>{q} · {label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
window.AnchorRail = AnchorRail;

function Section({ id, num, title, scope, soaOnly, children }) {
  const soaScope = (window.ChiComData || {}).SOA_SCOPE;
  // Scope falls back to expert_insights.json entry if not passed explicitly.
  const expertScope = scope || ((window.ExpertInsights || {})[id] || {}).scope;
  return (
    <section className="qsection" id={id}>
      <div className="qhead">
        <span className="qnum">{num || id}</span>
        <div className="qtitle">
          {title && <h2>{title}</h2>}
          {expertScope && <div className="qscope">{expertScope}</div>}
        </div>
        {soaOnly && <ScopeBadge />}
      </div>
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
          <b>Data scope:</b> Computed on only <b>{soaScope.totalRelevant.toLocaleString()}</b> mentions từ <b>{soaScope.groupIds.length} SOA groups</b> ({soaScope.groupNames.join(', ')}) — this question is Amazon-seller specific.
        </div>
      )}
      {children}
      <ExpertInsightPanel qId={id} />
    </section>
  );
}
window.Section = Section;

// ── Expert Insight Panel ────────────────────────────────────────────────
// Renders the manually-curated "Nhận định & Khuyến nghị" block for a Q,
// sourced from window.ExpertInsights (see dashboard/expert_insights.js).
// Three clearly separated sub-blocks: Nhận định · Warning · Khuyến nghị.
function ExpertInsightPanel({ qId }) {
  const data = qId && (window.ExpertInsights || {})[qId];
  if (!data) return null;

  const hasFindings  = Array.isArray(data.findings) && data.findings.length > 0;
  const hasCallouts  = Array.isArray(data.callouts) && data.callouts.length > 0;
  const hasRecs      = Array.isArray(data.recommendations) && data.recommendations.length > 0;
  const hasStats     = Array.isArray(data.stats) && data.stats.length > 0;
  if (!hasFindings && !hasCallouts && !hasRecs && !hasStats) return null;

  return (
    <div className="ei-panel">
      <div className="ei-panel-header">
        <span className="ei-panel-tag">Nhận định & Khuyến nghị</span>
      </div>

      {hasStats && (
        <div className="ei-stats">
          {data.stats.map((s, i) => (
            <div className="ei-stat" key={i}>
              <div className="ei-stat-label">{s.label}</div>
              <div className={`ei-stat-value ${s.variant || ''}`}>{s.value}</div>
              {s.note && <div className="ei-stat-note">{s.note}</div>}
            </div>
          ))}
        </div>
      )}

      {hasFindings && (
        <div className="ei-block-group">
          <div className="ei-section-title">📊 Nhận định</div>
          {data.findings.map((f, i) => (
            <div className={`ei-finding ${f.variant || ''}`} key={i}>
              {f.label && <div className={`ei-finding-label ${f.variant || ''}`}>{f.label}</div>}
              <div className="ei-finding-body" dangerouslySetInnerHTML={{ __html: f.html || '' }} />
            </div>
          ))}
        </div>
      )}

      {hasCallouts && (
        <div className="ei-block-group">
          <div className="ei-section-title">⚠️ Warning / Key finding</div>
          {data.callouts.map((c, i) => (
            <div className={`ei-callout ${c.variant || ''}`} key={i}>
              {c.icon && <span className="ei-callout-icon">{c.icon}</span>}
              <span dangerouslySetInnerHTML={{ __html: c.html || '' }} />
            </div>
          ))}
        </div>
      )}

      {hasRecs && (
        <div className="ei-block-group">
          <div className="ei-section-title">💡 Khuyến nghị</div>
          <div className="ei-rec-body">
            {data.recommendations.map((r, i) => (
              <div className="ei-rec-item" key={i}>
                <div className="ei-rec-num">{i + 1}</div>
                <div className="ei-rec-content" dangerouslySetInnerHTML={{ __html: r }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
window.ExpertInsightPanel = ExpertInsightPanel;

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
      SOA only
    </span>
  );
}
window.ScopeBadge = ScopeBadge;

// ── Team-shared insight overrides (Vercel KV via /api/insights) ───────────
// Fetched once on page load. Each <Insight qId="Q1"/> merges KV overrides
// on top of the baked-in window.ChiComData.INSIGHTS, and in-place edits
// POST back to the same endpoint so every teammate sees the latest.

window.__kvInsights = window.__kvInsights || { loaded: false, data: {}, listeners: new Set() };

async function _fetchKvInsights() {
  if (window.__kvInsights.loaded || window.__kvInsights.loading) return;
  window.__kvInsights.loading = true;
  try {
    const r = await fetch('/api/insights', { cache: 'no-store' });
    if (r.ok) {
      window.__kvInsights.data = await r.json();
    }
  } catch (e) {
    /* endpoint not reachable (local / static) — silently fall back */
  } finally {
    window.__kvInsights.loaded = true;
    window.__kvInsights.loading = false;
    for (const fn of window.__kvInsights.listeners) fn();
  }
}
_fetchKvInsights();

async function _saveKvInsight(qId, text) {
  try {
    const r = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qId, text }),
    });
    if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
    return true;
  } catch (e) {
    return false;
  }
}

async function _deleteKvInsight(qId) {
  try {
    await fetch('/api/insights', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qId }),
    });
    return true;
  } catch { return false; }
}

// ── CardComments: pair of collapsible editable comment boxes under a chart ─
// Each has:
//   - compact state: single-line placeholder, auto-height
//   - expanded state on focus / when it has text: multi-line auto-grow
//   - only vertical height changes; width stays 50% of its row
// Saves on blur to /api/insights with id = `${chartId}:${slot}` (slot = a|b).
// Also mirrors to localStorage so edits survive refresh even offline.

function CommentBox({ chartId, slot, label }) {
  const [, forceRefresh] = useState(0);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState(null);
  const ref = useRef(null);
  const id = `${chartId}:${slot}`;
  const storageKey = `chicom_note_${id}`;

  // Subscribe to the global KV fetch — once it lands we refresh
  useEffect(() => {
    const fn = () => forceRefresh(n => n + 1);
    window.__kvInsights.listeners.add(fn);
    return () => window.__kvInsights.listeners.delete(fn);
  }, []);

  // Initial value: localStorage → KV → empty
  useEffect(() => {
    const local = localStorage.getItem(storageKey);
    const remote = window.__kvInsights.data[id];
    setValue(local ?? remote ?? '');
  }, [id, storageKey, window.__kvInsights.loaded]);

  // Auto-grow textarea height to content
  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(600, el.scrollHeight) + 'px';
  };
  useEffect(resize, [value, focused]);

  const flashStatus = (type, text, ms = 1500) => {
    setStatus({ type, text });
    if (ms) setTimeout(() => setStatus(s => (s && s.text === text ? null : s)), ms);
  };

  const save = async () => {
    const next = (ref.current?.value ?? '').trim();
    const prior = (localStorage.getItem(storageKey) || '').trim();
    if (next === prior) return;
    if (!next) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, next);
    }
    setValue(next);
    flashStatus('saving', 'Đang lưu…', 0);
    try {
      const r = await fetch('/api/insights', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next ? { id, text: next } : { id }),
      });
      if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
      window.__kvInsights.data[id] = next || null;
      flashStatus('ok', 'Đã lưu');
    } catch (e) {
      flashStatus('err', 'Lỗi mạng — thử lại', 3500);
    }
  };

  const hasText = value.trim().length > 0;
  const expanded = focused || hasText;

  const statusColor =
    status?.type === 'ok'     ? 'oklch(0.55 0.14 155)' :
    status?.type === 'err'    ? 'oklch(0.55 0.18 25)'  :
    status?.type === 'saving' ? 'oklch(0.55 0.02 260)' :
    'var(--text-3)';

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.05em', color: 'var(--text-3)',
        marginBottom: 3,
      }}>
        <span>{label || `Note ${slot.toUpperCase()}`}</span>
        {status && <span style={{ color: statusColor, textTransform: 'none' }}>{status.text}</span>}
      </div>
      <textarea
        ref={ref}
        value={value}
        placeholder={expanded ? 'Nhập ghi chú…' : '+ thêm ghi chú'}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); save(); }}
        rows={1}
        style={{
          width: '100%',
          minHeight: expanded ? 56 : 28,
          padding: expanded ? '8px 10px' : '5px 10px',
          border: `1px solid ${expanded ? 'oklch(0.75 0.06 260)' : 'var(--border)'}`,
          borderRadius: 4,
          background: expanded ? 'var(--panel)' : 'oklch(0.98 0.005 260)',
          fontSize: 11.5,
          fontFamily: 'inherit',
          color: 'var(--text)',
          resize: 'none',          // vertical size controlled by us only
          overflow: 'hidden',
          outline: 'none',
          lineHeight: 1.5,
          transition: 'min-height 120ms, padding 120ms, border-color 120ms, background 120ms',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function CardComments({ chartId }) {
  if (!chartId) return null;
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      marginTop: 8,
      paddingTop: 8,
      borderTop: '1px dashed var(--border)',
    }}>
      <CommentBox chartId={chartId} slot="a" label="Note A" />
      <CommentBox chartId={chartId} slot="b" label="Note B" />
    </div>
  );
}
window.CardComments = CardComments;


// Insight text-box under every chart.
// Resolution order per qId:
//   1. localStorage edit (instant, per-device)
//   2. KV override fetched from /api/insights (team-shared)
//   3. window.ChiComData.INSIGHTS[qId]   (baked-in LLM / manual)
//   4. children (terse fallback template)
// contentEditable → on blur, saves to localStorage + KV.
// "↺ Reset" button → clears both and falls back to the default.
//
// SHOW_INSIGHT: set to true to re-enable the AI Insight panel under every
// chart. Currently hidden because the Nhận định & Khuyến nghị expert panel
// covers the same ground.
const SHOW_INSIGHT = false;

function Insight({ qId, children }) {
  const [, forceRefresh] = useState(0);
  const [status, setStatus] = useState(null);          // {type,text} or null
  const [edited, setEdited] = useState(null);          // local override text
  const ref = useRef(null);

  const storageKey = qId ? `chicom_insight_${qId}` : null;
  const kvText = qId ? (window.__kvInsights.data[qId] || null) : null;
  const llmText = qId ? (((window.ChiComData || {}).INSIGHTS || {})[qId] || null) : null;

  // Subscribe to KV-load event so the first fetch triggers a re-render
  useEffect(() => {
    const fn = () => forceRefresh(n => n + 1);
    window.__kvInsights.listeners.add(fn);
    return () => window.__kvInsights.listeners.delete(fn);
  }, []);

  // Load localStorage override once
  useEffect(() => {
    if (!storageKey) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) setEdited(saved);
  }, [storageKey]);

  const defaultText = kvText || llmText || null;
  const currentText = edited ?? defaultText;
  const hasChildren = children && !(Array.isArray(children) && children.every(c => !c));
  const isOverridden = edited !== null || (kvText && kvText !== llmText);

  if (!currentText && !hasChildren) return null;

  const isAI = !!(currentText || llmText);
  const label = isAI ? (isOverridden ? 'AI Insight · edited' : 'AI Insight') : 'Insight';
  const accent     = isAI ? 'oklch(0.55 0.17 290)' : 'oklch(0.55 0.17 260)';
  const accentDark = isAI ? 'oklch(0.45 0.17 290)' : 'oklch(0.45 0.17 260)';
  const bg         = isAI ? 'oklch(0.97 0.02 290)' : 'oklch(0.97 0.01 260)';

  const flashStatus = (type, text, ms = 1800) => {
    setStatus({ type, text });
    if (ms) setTimeout(() => setStatus(s => s && s.text === text ? null : s), ms);
  };

  const saveEdit = async () => {
    if (!ref.current || !qId) return;
    const next = ref.current.innerText.trim();
    const baseline = (defaultText || '').trim();
    if (next === baseline) {
      // Reverted to default — clean up
      localStorage.removeItem(storageKey);
      setEdited(null);
      if (kvText) {
        await _deleteKvInsight(qId);
        window.__kvInsights.data[qId] = null;
        flashStatus('ok', 'Đã khôi phục mặc định');
      }
      return;
    }
    if (next === (edited || '').trim()) return; // unchanged from prior edit

    // Save locally first (instant, refresh-proof)
    localStorage.setItem(storageKey, next);
    setEdited(next);
    flashStatus('saving', 'Đang lưu…', 0);
    const ok = await _saveKvInsight(qId, next);
    if (ok) {
      window.__kvInsights.data[qId] = next;
      flashStatus('ok', 'Đã lưu');
    } else {
      flashStatus('err', 'Lỗi lưu — thử lại', 4000);
    }
  };

  const resetToDefault = async (e) => {
    e.stopPropagation();
    if (!qId) return;
    if (!confirm('Khôi phục insight AI gốc? Bản chỉnh sửa hiện tại sẽ bị xoá.')) return;
    localStorage.removeItem(storageKey);
    setEdited(null);
    flashStatus('saving', 'Đang xoá…', 0);
    const ok = await _deleteKvInsight(qId);
    window.__kvInsights.data[qId] = null;
    if (ref.current) ref.current.innerText = llmText || '';
    flashStatus(ok ? 'ok' : 'err', ok ? 'Đã khôi phục' : 'Lỗi mạng — thử lại', ok ? 1800 : 4000);
  };

  const editable = !!qId; // only Qs with an id are persistable

  const statusColor =
    status?.type === 'ok'     ? 'oklch(0.55 0.14 155)' :
    status?.type === 'err'    ? 'oklch(0.55 0.18 25)'  :
    status?.type === 'saving' ? 'oklch(0.55 0.02 260)' :
    'transparent';

  return (
    <div style={{
      marginTop: 10,
      padding: '8px 12px',
      background: bg,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 3,
      fontSize: 11,
      color: 'var(--text-2)',
      lineHeight: 1.55,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: accentDark, marginBottom: 4,
      }}>
        <span>{label}</span>
        {editable && isOverridden && (
          <button
            onClick={resetToDefault}
            title="Khôi phục insight AI gốc"
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: accentDark, fontSize: 10, padding: '0 4px',
              fontWeight: 600, textDecoration: 'underline',
            }}
          >↺ Reset</button>
        )}
        {status && (
          <span style={{ color: statusColor, fontWeight: 600, textTransform: 'none' }}>
            {status.text}
          </span>
        )}
        {editable && !status && (
          <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontWeight: 500, textTransform: 'none' }}>
            bấm để chỉnh
          </span>
        )}
      </div>
      {editable && currentText != null ? (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onBlur={saveEdit}
          style={{
            outline: 'none', cursor: 'text',
            minHeight: 18, whiteSpace: 'pre-wrap',
          }}
        >{currentText}</div>
      ) : (
        <div>{currentText || children}</div>
      )}
    </div>
  );
}
// Gate the export rather than returning null inside the component (avoids
// breaking React's rules-of-hooks when SHOW_INSIGHT toggles).
window.Insight = SHOW_INSIGHT ? Insight : () => null;

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
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>Date range:</span>
      <span className="mono">{fmt(dr.start)} → {fmt(dr.end)}</span>
      <span style={{ color: 'var(--text-3)' }}>· {dr.monthsCount || 0} months</span>
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
        <b>Thống kê mentions sau IRR theo community:</b>{' '}
        Tổng mentions của <b>{ov.soaGroupCount} SOA groups</b> hold <b>{ov.soaPct}% SOV</b> trong{' '}
        <b>{ov.monthsCount} months</b>, trong đó <b>{ov.topCommunity.name}</b> leading with{' '}
        <b>{ov.topCommunity.count.toLocaleString()}</b> mentions (~{ov.topCommunityPct}% SOV).
      </Narrative>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">mentions theo community</div>
            <span className="card-meta">{commTotal.toLocaleString()} total</span>
          </div>
          <div>
            {ov.communities.map((c, i) => (
              <div key={c.id} className="rowbar" style={{ gridTemplateColumns: '160px 1fr 60px' }}
                onMouseEnter={e => tt.show(e, `<b>${c.name}</b><br/>${c.count.toLocaleString()} mentions · ${c.type}`)}
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
        
        <window.CardComments chartId="overview_1" />
      </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Community distribution (% SOV)</div>
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
        
        <window.CardComments chartId="overview_2" />
      </div>
      </div>

      <Narrative>
        <b>Thống kê mentions sau lọc theo persona:</b>{' '}
        {ov.topPersona && <><b>{ov.topPersona.vn}</b> dominates with <b>{ov.topPersona.count.toLocaleString()}</b> mentions</>}
        {ov.secondPersona && <>, followed by <b>{ov.secondPersona.vn}</b> với <b>{ov.secondPersona.count.toLocaleString()}</b> mentions.</>}
      </Narrative>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">mentions theo persona</div>
            <span className="card-meta">{persTotal.toLocaleString()} total</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11 }}>
                <th style={{ textAlign: 'left', padding: '8px 6px', fontWeight: 600 }}>Seller Type</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', fontWeight: 600 }}>mentions</th>
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
        
        <window.CardComments chartId="overview_3" />
      </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Persona distribution (%)</div>
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
        
        <window.CardComments chartId="overview_4" />
      </div>
      </div>
      {tt.node}
    </div>
  );
}
window.OverviewPanel = OverviewPanel;
