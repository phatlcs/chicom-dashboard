/* global React, window */
const D2b = window.ChiComData2;

// ── Q10 — Top Product Categories (SOA / EC / Total) ─────────────────────────
// Data is keyword-matched from post content (backend/keywords.py:Q10_CATEGORY_KW)
// and shipped via D2b.Q10_TOP / Q10_TOP_SOA / Q10_TOP_EC. No hardcoded
// narrative — counts and %s reflect actual extraction.

// Helper: convert keyword-match rows into the shape the table/donut expects.
// Input rows: { name, vn, en, count, color }.
// Output rows: { cat, n, pct, color }.
function _q10Shape(rows, denom) {
  const safeDenom = Math.max(1, denom || 0);
  return (rows || []).map(r => ({
    cat:   r.en || r.name || r.vn,
    n:     r.count || 0,
    pct:   ((r.count || 0) / safeDenom * 100).toFixed(1),
    color: r.color || 'var(--accent)',
  }));
}

function Q10RankTable({ data, headerLabel }) {
  const top = data[0]?.n || 1;
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="card-head" style={{ padding: '14px 18px' }}>
        <div className="card-title">{headerLabel}</div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1.4fr 1fr 64px 78px',
        gap: 12, padding: '8px 18px',
        background: 'var(--panel-2)',
        borderBottom: '1px solid var(--border)',
        fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
        color: 'var(--text-3)', textTransform: 'uppercase',
      }}>
        <span>#</span>
        <span>Category</span>
        <span>Bar</span>
        <span style={{ textAlign: 'right' }}>%</span>
        <span style={{ textAlign: 'right' }}>Mentions</span>
      </div>
      <div>
        {data.map((d, i) => (
          <div key={d.cat} style={{
            display: 'grid',
            gridTemplateColumns: '28px 1.4fr 1fr 64px 78px',
            gap: 12, alignItems: 'center',
            padding: '11px 18px',
            borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? 'var(--text)' : 'var(--text-3)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ minWidth: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }}></span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.cat}</span>
            </div>
            <div className="rowbar-track" style={{ height: 6 }}>
              <div className="rowbar-fill" style={{ width: `${Math.max(2, Math.round(d.n / top * 100))}%`, background: d.color, height: '100%' }}></div>
            </div>
            <span className="mono" style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.pct}%</span>
            <span className="mono" style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-2)' }}>{d.n.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function _q10Arc(cx, cy, r, r2, a0, a1) {
  const large = a1 - a0 > 0.5 ? 1 : 0;
  const sx = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r;
  const sy = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r;
  const ex = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r;
  const ey = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r;
  const sx2 = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r2;
  const sy2 = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r2;
  const ex2 = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r2;
  const ey2 = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r2;
  return `M${sx},${sy} A${r},${r} 0 ${large} 1 ${ex},${ey} L${sx2},${sy2} A${r2},${r2} 0 ${large} 0 ${ex2},${ey2} Z`;
}

function Q10DonutCard({ data, total, headerLabel, tt }) {
  // Drop "Other / Undisclosed" from donut so categories of interest get the full ring
  const slice = data.filter(d => !d.cat.toLowerCase().startsWith('other'));
  const sum = slice.reduce((a, b) => a + b.n, 0) || 1;
  let acc = 0;
  const seg = slice.map(d => {
    const start = acc; acc += d.n / sum;
    return { ...d, start, end: acc };
  });
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="card-head" style={{ padding: '14px 18px' }}>
        <div className="card-title">{headerLabel}</div>
      </div>
      <div style={{ padding: 18, display: 'flex', justifyContent: 'center' }}>
        <svg width={220} height={220}>
          {seg.map(s => (
            <path key={s.cat} d={_q10Arc(110, 110, 95, 60, s.start, s.end)} fill={s.color}
              onMouseEnter={e => tt.show(e, `<b>${s.cat}</b><br/>${s.n.toLocaleString()} mentions · ${s.pct}%`)}
              onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
          ))}
          <text x={110} y={106} textAnchor="middle" className="mono" style={{ fontSize: 18, fontWeight: 700, fill: 'var(--text)' }}>
            {total.toLocaleString()}
          </text>
          <text x={110} y={124} textAnchor="middle" className="axis-tick" style={{ fontSize: 10 }}>mentions</text>
        </svg>
      </div>
      <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {seg.map(s => (
          <div key={s.cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-2)', minWidth: 0 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }}></span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.cat}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <span className="mono" style={{ fontWeight: 700, color: 'var(--text)' }}>{s.pct}%</span>
              <span className="mono" style={{ color: 'var(--text-3)' }}>~{s.n.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Q10MiniRows({ data }) {
  const top = data[0]?.n || 1;
  return (
    <div>
      {data.slice(0, 5).map((d, i) => (
        <div key={d.cat} style={{
          display: 'grid', gridTemplateColumns: '24px 1fr 60px 60px',
          gap: 8, alignItems: 'center', padding: '8px 14px',
          borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
        }}>
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>#{i + 1}</span>
          <span style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.cat}>{d.cat}</span>
          <div className="rowbar-track" style={{ height: 4 }}>
            <div className="rowbar-fill" style={{ width: `${Math.max(4, Math.round(d.n / top * 100))}%`, background: d.color, height: '100%' }}></div>
          </div>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{d.pct}%</span>
        </div>
      ))}
    </div>
  );
}

function Q10MethodologyNote() {
  return (
    <div style={{
      marginTop: 18, padding: '12px 16px',
      background: 'oklch(0.96 0.04 70 / 0.4)',
      border: '1px solid oklch(0.80 0.10 70)',
      borderRadius: 8, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6,
    }}>
      <strong>Methodology:</strong> Categories are extracted by keyword-matching post content
      against the dictionary in <code>backend/keywords.py:Q10_CATEGORY_KW</code>. Counts reflect
      the number of relevant posts that explicitly mention each category. Most posts don't
      mention a specific category, so totals here are smaller than the headline mention totals.
    </div>
  );
}

function Q10TabNav({ tab, setTab, totals }) {
  const tabs = [
    { id: 'soa', label: 'SOA Groups', sub: (totals.soa || 0).toLocaleString(), accent: 'oklch(0.55 0.17 290)' },
    { id: 'ec',  label: 'EC Groups',  sub: (totals.ec  || 0).toLocaleString(), accent: 'oklch(0.55 0.17 340)' },
    { id: 'all', label: 'Total',      sub: (totals.all || 0).toLocaleString(), accent: 'var(--accent)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
      {tabs.map(t => {
        const active = t.id === tab;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            background: 'transparent',
            color: active ? 'var(--text)' : 'var(--text-3)',
            borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: -1,
          }}>
            {t.label}
            <span className="mono" style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 10,
              background: active ? 'var(--panel-2)' : 'var(--panel)',
              color: active ? t.accent : 'var(--text-3)',
              border: '1px solid var(--border)',
              fontWeight: 600,
            }}>{t.sub} matched</span>
          </button>
        );
      })}
    </div>
  );
}

function Q10() {
  const tt = window.useTooltip();
  const [tab, setTab] = React.useState('all');

  // Pull keyword-matched category data from the data pipeline
  const D2 = window.ChiComData2 || {};
  const rowsAll = D2.Q10_TOP     || [];
  const rowsSOA = D2.Q10_TOP_SOA || [];
  const rowsEC  = D2.Q10_TOP_EC  || [];

  // Sum of all keyword-matched mentions for each scope (denominator for %)
  const sumOf = rows => rows.reduce((acc, r) => acc + (r.count || 0), 0);
  const totals = { soa: sumOf(rowsSOA), ec: sumOf(rowsEC), all: sumOf(rowsAll) };

  const PANELS = {
    soa: {
      data: _q10Shape(rowsSOA, totals.soa),
      total: totals.soa,
      title: 'SOA Groups — Top Product Categories',
      tableHeader: 'Ranked by share of SOA category mentions',
      donutHeader: 'Distribution (SOA)',
      kpiTopLabel: 'Top Category',
    },
    ec: {
      data: _q10Shape(rowsEC, totals.ec),
      total: totals.ec,
      title: 'EC Groups — Top Product Categories',
      tableHeader: 'Ranked by share of EC category mentions',
      donutHeader: 'Distribution (EC)',
      kpiTopLabel: 'Top Category',
    },
    all: {
      data: _q10Shape(rowsAll, totals.all),
      total: totals.all,
      title: 'Total — Top Product Categories',
      tableHeader: 'Ranked by share of all category mentions',
      donutHeader: 'Distribution (Total)',
      kpiTopLabel: 'Top Category',
    },
  };
  const p = PANELS[tab];
  const top = p.data[0];
  const totalAccent = tab === 'soa' ? 'oklch(0.55 0.17 290)'
                    : tab === 'ec'  ? 'oklch(0.55 0.17 340)'
                    : 'var(--accent)';

  return (
    <>
      <Q10TabNav tab={tab} setTab={setTab} totals={totals} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4, letterSpacing: '-0.3px' }}>{p.title}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 640, lineHeight: 1.55, margin: 0 }}>
            Categories matched from post content via keyword dictionary. Numbers are real mention counts —
            most posts don't mention a category, so totals are smaller than headline mention totals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div className="card" style={{ padding: '10px 14px', minWidth: 110, textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>
              {tab === 'all' ? 'Total Matched' : `${tab.toUpperCase()} Matched`}
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: totalAccent, lineHeight: 1 }}>{p.total.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>mentions</div>
          </div>
          <div className="card" style={{ padding: '10px 14px', minWidth: 130, textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>{p.kpiTopLabel}</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: totalAccent, lineHeight: 1 }}>{top ? `${top.pct}%` : '—'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{top ? top.cat : '—'}</div>
          </div>
        </div>
      </div>

      <div className="grid-12">
        <div className="col-8"><Q10RankTable data={p.data} headerLabel={p.tableHeader} /></div>
        <div className="col-4"><Q10DonutCard data={p.data} total={p.total} headerLabel={p.donutHeader} tt={tt} /></div>

        {tab === 'all' && (
          <>
            <div className="col-6">
              <div className="card" style={{ padding: 0 }}>
                <div className="card-head" style={{ padding: '12px 16px', color: 'oklch(0.55 0.17 290)' }}>
                  <div className="card-title">SOA Top 5 — Amazon Sellers</div>
                </div>
                <Q10MiniRows data={_q10Shape(rowsSOA, totals.soa)} />
              </div>
            </div>
            <div className="col-6">
              <div className="card" style={{ padding: 0 }}>
                <div className="card-head" style={{ padding: '12px 16px', color: 'oklch(0.55 0.17 340)' }}>
                  <div className="card-title">EC Top 5 — Multi-platform Sellers</div>
                </div>
                <Q10MiniRows data={_q10Shape(rowsEC, totals.ec)} />
              </div>
            </div>
          </>
        )}

        {/* Detailed keywords — what each category matches against in post content */}
        <div className="col-12">
          <div className="card" style={{ padding: 0 }}>
            <div className="card-head" style={{ padding: '14px 18px' }}>
              <div className="card-title">Detailed keywords <span className="en">per category</span></div>
              <span className="card-meta" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Keyword dictionary used by the matcher — backend/keywords.py:Q10_CATEGORY_KW
              </span>
            </div>
            <div style={{ padding: '12px 18px' }}>
              {p.data.map((d, i) => {
                const kws = (D2.Q10_KEYWORDS || {})[d.cat] || [];
                return (
                  <div key={d.cat} style={{
                    display: 'grid', gridTemplateColumns: '220px 1fr 60px',
                    gap: 12, alignItems: 'baseline',
                    padding: '10px 0',
                    borderBottom: i < p.data.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }}></span>
                      {d.cat}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {kws.length === 0 ? (
                        <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>(no keywords mapped)</span>
                      ) : kws.map(k => (
                        <span key={k} className="mono" style={{
                          padding: '2px 8px', borderRadius: 4,
                          background: 'var(--panel-2)', fontSize: 11,
                        }}>{k}</span>
                      ))}
                    </div>
                    <span className="mono" style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)' }}>{kws.length} kws</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <Q10MethodologyNote />
          <window.CardComments chartId={`Q10_${tab}`} />
        </div>
      </div>
      {tt.node}
    </>
  );
}
window.Q10 = Q10;

// Q11 — Tool usage
function Q11() {
  const tt = window.useTooltip();
  const { Q11_TOOLS, Q11_ISSUES, Q11_SATISFACTION } = D2b;
  const maxUse = Math.max(...Q11_TOOLS.map(t => t.use));
  const maxSI = Math.max(...Q11_TOOLS.flatMap(t => [t.satisfied, t.issues]));
  const green = 'oklch(0.62 0.15 155)', red = 'oklch(0.60 0.20 25)';
  const W = 640, H = 260, pad = { t: 30, r: 20, b: 50, l: 30 };
  const cellW = (W - pad.l - pad.r) / Q11_TOOLS.length;

  return (
    <div className="grid-12">
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Tool usage</div></div>
          <HBars items={Q11_TOOLS.map(t => ({ ...t, color: 'var(--accent)' }))} labelKey="en" valueKey="use" tooltip={tt} />
        
        <window.CardComments chartId="Q11_1" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Satisfied vs Issues (per tool)</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: green }}></span>Satisfied</span>
              <span><span className="dot" style={{ background: red }}></span>Issues</span>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={pad.l} y1={pad.t + (H - pad.t - pad.b) * f} x2={W - pad.r} y2={pad.t + (H - pad.t - pad.b) * f} className="grid-line" />
            ))}
            {Q11_TOOLS.map((t, i) => {
              const x0 = pad.l + i * cellW + 4;
              const bw = (cellW - 10) / 2;
              const plotH = H - pad.t - pad.b;
              const sH = (t.satisfied / maxSI) * plotH;
              const iH = (t.issues / maxSI) * plotH;
              return (
                <g key={t.name}>
                  <rect x={x0} y={pad.t + plotH - sH} width={bw} height={sH} fill={green}
                    onMouseEnter={e => tt.show(e, `<b>${t.en || t.name}</b> · Satisfied ${t.satisfied}`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide} />
                  <rect x={x0 + bw + 2} y={pad.t + plotH - iH} width={bw} height={iH} fill={red}
                    onMouseEnter={e => tt.show(e, `<b>${t.en || t.name}</b> · Issues ${t.issues}`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide} />
                  <text x={x0 + bw} y={pad.t + plotH + 10}
                    transform={`rotate(-35 ${x0 + bw} ${pad.t + plotH + 10})`}
                    textAnchor="end" className="axis-tick" style={{ fontSize: 9 }}>{t.en || t.name}</text>
                </g>
              );
            })}
          </svg>
        
        <window.CardComments chartId="Q11_2" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Top common issues</div></div>
          <HBars items={Q11_ISSUES.map(t => ({ ...t, color: red }))} labelKey="en" valueKey="count" tooltip={tt} />
        
        <window.CardComments chartId="Q11_3" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Top satisfaction drivers</div></div>
          <HBars items={Q11_SATISFACTION.map(t => ({ ...t, color: green }))} labelKey="en" valueKey="count" tooltip={tt} />
        
        <window.CardComments chartId="Q11_4" />
      </div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <window.Insight qId="Q11">
          Most-used tool: <b>{Q11_TOOLS[0]?.en || Q11_TOOLS[0]?.name || '—'}</b> (use {Q11_TOOLS[0]?.use.toLocaleString() || 0}, satisfied {Q11_TOOLS[0]?.satisfied || 0}, issues {Q11_TOOLS[0]?.issues || 0}) ·
          Top issue: <b>{Q11_ISSUES[0]?.en || Q11_ISSUES[0]?.name || '—'}</b> ({Q11_ISSUES[0]?.count.toLocaleString() || 0}) ·
          Top satisfaction driver: <b>{Q11_SATISFACTION[0]?.en || Q11_SATISFACTION[0]?.name || '—'}</b> ({Q11_SATISFACTION[0]?.count.toLocaleString() || 0}).
        </window.Insight>
      </div>
      {tt.node}
    </div>
  );
}
window.Q11 = Q11;

// Q12 — 3rd-party services
function Q12() {
  const tt = window.useTooltip();
  const { Q12_SERVICES } = D2b;
  const hasSplit = D2b.Q12_SERVICES_SOA && D2b.Q12_SERVICES_EC;
  const maxM = Math.max(...Q12_SERVICES.flatMap(s => [s.mentions, s.need]));
  const W = 640, H = 260, pad = { t: 20, r: 20, b: 50, l: 30 };
  const cellW = (W - pad.l - pad.r) / Q12_SERVICES.length;
  const blue = 'oklch(0.58 0.14 190)', red = 'oklch(0.60 0.20 25)';

  const soaBadge = <span className="badge soa">SOA</span>;
  const ecBadge  = <span className="badge ec">EC</span>;
  const ServiceHBars = ({ items, title, badge, chartId, accent }) => (
    <div className="card">
      <div className="card-head"><div className="card-title">{title} {badge}</div></div>
      <HBars items={items.map(s => ({ name: s.en || s.name, count: s.mentions, color: accent }))} tooltip={tt} />
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );

  return (
    <div className="grid-12">
      {hasSplit && (
        <>
          <div className="col-6">
            <ServiceHBars items={D2b.Q12_SERVICES_SOA} title="3rd-party services — mentions" badge={soaBadge} chartId="Q12_4" accent="oklch(0.55 0.17 290)" />
          </div>
          <div className="col-6">
            <ServiceHBars items={D2b.Q12_SERVICES_EC}  title="3rd-party services — mentions" badge={ecBadge}  chartId="Q12_5" accent="oklch(0.55 0.17 340)" />
          </div>
        </>
      )}
      <div className="col-12">
        <div className="card">
          <div className="card-head"><div className="card-title">3rd-party services — Overview</div></div>
          <div className="grid-3" style={{ gap: 12 }}>
            {(() => {
              const _label = s => s.en || s.name;
              const byDemand  = [...Q12_SERVICES].sort((a, b) => (b.demand || 0)       - (a.demand || 0));
              const byVolume  = [...Q12_SERVICES].sort((a, b) => (b.mentions || 0)     - (a.mentions || 0));
              const bySatisf  = [...Q12_SERVICES].sort((a, b) => (b.satisfaction || 0) - (a.satisfaction || 0));
              const buckets = [
                { title: 'High Priority (High Demand)',  color: red,
                  items: byDemand.slice(0, 4).map(s => `${_label(s)} — ${s.demand || 0}% demand`) },
                { title: 'Medium Priority (Volume)',     color: 'oklch(0.68 0.17 60)',
                  items: byVolume.slice(0, 3).map(s => `${_label(s)} — ${(s.mentions || 0).toLocaleString()} mentions`) },
                { title: 'Well Served (High Satisfaction)', color: 'oklch(0.62 0.15 155)',
                  items: bySatisf.slice(0, 3).map(s => `${_label(s)} — ${s.satisfaction || 0}% satisfaction`) },
              ];
              return buckets.map(b => (
                <div key={b.title} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, borderLeft: `3px solid ${b.color}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{b.title}</div>
                  {b.items.map(i => <div key={i} style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>• {i}</div>)}
                </div>
              ));
            })()}
          </div>

        <window.CardComments chartId="Q12_1" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Mentions vs Need</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: blue }}></span>Total mentions</span>
              <span><span className="dot" style={{ background: red }}></span>Looking for</span>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={pad.l} y1={pad.t + (H - pad.t - pad.b) * f} x2={W - pad.r} y2={pad.t + (H - pad.t - pad.b) * f} className="grid-line" />
            ))}
            {Q12_SERVICES.map((s, i) => {
              const x0 = pad.l + i * cellW + 8;
              const bw = (cellW - 16) / 2;
              const plotH = H - pad.t - pad.b;
              const mH = (s.mentions / maxM) * plotH;
              const nH = (s.need / maxM) * plotH;
              return (
                <g key={s.name}>
                  <rect x={x0} y={pad.t + plotH - mH} width={bw} height={mH} fill={blue}
                    onMouseEnter={e => tt.show(e, `<b>${s.en || s.name}</b> · ${s.mentions} mentions`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide} />
                  <rect x={x0 + bw + 2} y={pad.t + plotH - nH} width={bw} height={nH} fill={red}
                    onMouseEnter={e => tt.show(e, `<b>${s.en || s.name}</b> · ${s.need} looking`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide} />
                  <text x={x0 + bw} y={pad.t + plotH + 10}
                    transform={`rotate(-30 ${x0 + bw} ${pad.t + plotH + 10})`}
                    textAnchor="end" className="axis-tick" style={{ fontSize: 10 }}>{s.en || s.name}</text>
                </g>
              );
            })}
          </svg>
        
        <window.CardComments chartId="Q12_2" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">% Demand by service</div></div>
          <HBars items={Q12_SERVICES.map(s => ({ name: s.en || s.name, count: s.demand, color: 'oklch(0.75 0.17 75)' }))} tooltip={tt} />
        
        <window.CardComments chartId="Q12_3" />
      </div>
      </div>
      {(() => {
        const topDemand = [...Q12_SERVICES].sort((a, b) => b.demand - a.demand)[0];
        const topMent = Q12_SERVICES[0];
        const topSat = [...Q12_SERVICES].sort((a, b) => b.satisfaction - a.satisfaction)[0];
        return (
          <div style={{ gridColumn: '1 / -1' }}>
            <window.Insight qId="Q12">
              Most-mentioned service: <b>{topMent?.en || topMent?.name || '—'}</b> ({topMent?.mentions.toLocaleString() || 0} mentions) ·
              Highest demand: <b>{topDemand?.en || topDemand?.name || '—'}</b> ({topDemand?.demand || 0}% demand) ·
              Most satisfied: <b>{topSat?.en || topSat?.name || '—'}</b> ({topSat?.satisfaction || 0}%).
            </window.Insight>
          </div>
        );
      })()}
      {tt.node}
    </div>
  );
}
window.Q12 = Q12;

// Q13 — Courses
function Q13() {
  const tt = window.useTooltip();
  const { Q13_COURSES } = D2b;
  const hasSplit = D2b.Q13_COURSES_SOA && D2b.Q13_COURSES_EC;
  const maxMS = Math.max(...Q13_COURSES.flatMap(c => [c.mentions, c.seeking]));
  const blue = 'oklch(0.58 0.14 190)', green = 'oklch(0.62 0.15 155)', red = 'oklch(0.60 0.20 25)';
  const W = 520, H = 240, pad = { t: 20, r: 20, b: 70, l: 30 };
  const cellW = (W - pad.l - pad.r) / Q13_COURSES.length;

  const soaBadge = <span className="badge soa">SOA</span>;
  const ecBadge  = <span className="badge ec">EC</span>;
  const CourseHBars = ({ items, title, badge, chartId, accent }) => (
    <div className="card">
      <div className="card-head"><div className="card-title">{title} {badge}</div></div>
      <HBars items={items.map(c => ({ name: c.en || c.name, count: c.mentions, color: accent }))} tooltip={tt} />
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );

  const total = Q13_COURSES.reduce((a, b) => a + b.mentions, 0);
  let acc = 0;
  const donutSeg = Q13_COURSES.map((c, i) => {
    const start = acc; acc += c.mentions / total;
    // 4 distinct non-sentiment hues — red/green reserved for sentiment only
    const colors = ['oklch(0.55 0.17 260)', 'oklch(0.62 0.15 290)', 'oklch(0.75 0.17 80)', 'oklch(0.62 0.15 320)'];
    return { ...c, start, end: acc, color: colors[i] };
  });
  const arc = (cx, cy, r, r2, a0, a1) => {
    const large = a1 - a0 > 0.5 ? 1 : 0;
    const sx = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r;
    const sy = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r;
    const ex = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r;
    const ey = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r;
    const sx2 = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r2;
    const sy2 = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r2;
    const ex2 = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r2;
    const ey2 = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r2;
    return `M${sx},${sy} A${r},${r} 0 ${large} 1 ${ex},${ey} L${sx2},${sy2} A${r2},${r2} 0 ${large} 0 ${ex2},${ey2} Z`;
  };

  return (
    <div className="grid-12">
      {hasSplit && (
        <>
          <div className="col-6">
            <CourseHBars items={D2b.Q13_COURSES_SOA} title="Courses — mentions" badge={soaBadge} chartId="Q13_5" accent="oklch(0.55 0.17 290)" />
          </div>
          <div className="col-6">
            <CourseHBars items={D2b.Q13_COURSES_EC}  title="Courses — mentions" badge={ecBadge}  chartId="Q13_6" accent="oklch(0.55 0.17 340)" />
          </div>
        </>
      )}
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Mentions vs Seeking</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: blue }}></span>Mentions</span>
              <span><span className="dot" style={{ background: green }}></span>Seeking</span>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
            {Q13_COURSES.map((c, i) => {
              const x0 = pad.l + i * cellW + 10;
              const bw = (cellW - 22) / 2;
              const plotH = H - pad.t - pad.b;
              const mH = (c.mentions / maxMS) * plotH;
              const sH = (c.seeking / maxMS) * plotH;
              return (
                <g key={c.name}>
                  <rect x={x0} y={pad.t + plotH - mH} width={bw} height={mH} fill={blue} />
                  <rect x={x0 + bw + 2} y={pad.t + plotH - sH} width={bw} height={sH} fill={green} />
                  <text x={x0 + bw} y={pad.t + plotH + 12}
                    transform={`rotate(-25 ${x0 + bw} ${pad.t + plotH + 12})`}
                    textAnchor="end" className="axis-tick">{c.en || c.name}</text>
                </g>
              );
            })}
          </svg>
        
        <window.CardComments chartId="Q13_1" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">% Interest level</div></div>
          <HBars items={Q13_COURSES.map(c => ({ name: c.en || c.name, count: c.interest, color: 'oklch(0.75 0.17 75)' }))} tooltip={tt} />
        
        <window.CardComments chartId="Q13_2" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Sentiment analysis</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: green }}></span>Positive</span>
              <span><span className="dot" style={{ background: red }}></span>Negative</span>
            </div>
          </div>
          <div style={{ padding: '10px 0' }}>
            {Q13_COURSES.map(c => {
              const tot = c.positive + c.negative;
              return (
                <div key={c.name} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{c.en || c.name}</span>
                    <span className="mono" style={{ color: 'var(--text-3)' }}>+{c.positive} / −{c.negative}</span>
                  </div>
                  <div style={{ display: 'flex', height: 10, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(c.positive / tot) * 100}%`, background: green }}></div>
                    <div style={{ width: `${(c.negative / tot) * 100}%`, background: red }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        
        <window.CardComments chartId="Q13_3" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Course categories</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg width={200} height={200}>
              {donutSeg.map(s => (
                <path key={s.name} d={arc(100, 100, 85, 50, s.start, s.end)} fill={s.color}
                  onMouseEnter={e => tt.show(e, `<b>${s.en || s.name}</b> · ${Math.round((s.mentions / total) * 100)}%`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
              ))}
            </svg>
            <div style={{ flex: 1, fontSize: 11 }}>
              {donutSeg.map(s => (
                <div key={s.name} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, flexShrink: 0 }}></span>
                  <span style={{ flex: 1 }}>{s.en || s.name}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{Math.round((s.mentions / total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        
        <window.CardComments chartId="Q13_4" />
      </div>
      </div>
      {(() => {
        const topCourse = Q13_COURSES[0];
        const topSeeking = [...Q13_COURSES].sort((a, b) => b.seeking - a.seeking)[0];
        const topPositive = [...Q13_COURSES].sort((a, b) => b.positive - a.positive)[0];
        return (
          <div style={{ gridColumn: '1 / -1' }}>
            <window.Insight qId="Q13">
              Most-mentioned course: <b>{topCourse?.en || topCourse?.name || '—'}</b> ({topCourse?.mentions.toLocaleString() || 0}) ·
              Most-sought: <b>{topSeeking?.en || topSeeking?.name || '—'}</b> ({topSeeking?.seeking || 0} mentions actively asking) ·
              Most positive sentiment: <b>{topPositive?.en || topPositive?.name || '—'}</b> (+{topPositive?.positive || 0}).
            </window.Insight>
          </div>
        );
      })()}
      {tt.node}
    </div>
  );
}
window.Q13 = Q13;

// Q14 — Growth & P&L
function Q14() {
  const tt = window.useTooltip();
  const { Q14_GROWTH } = D2b;
  const hasSplit = D2b.Q14_GROWTH_SOA && D2b.Q14_GROWTH_EC;
  const total = Q14_GROWTH.reduce((a, b) => a + b.count, 0);
  const maxG = Math.max(...Q14_GROWTH.map(g => g.count));
  let acc = 0;
  const seg = Q14_GROWTH.map(g => {
    const start = acc; acc += g.count / total;
    return { ...g, start, end: acc };
  });

  const soaBadge = <span className="badge soa">SOA</span>;
  const ecBadge  = <span className="badge ec">EC</span>;
  const GrowthHBars = ({ items, title, badge, chartId, accent }) => (
    <div className="card">
      <div className="card-head"><div className="card-title">{title} {badge}</div></div>
      <HBars items={items.map(g => ({ name: g.en || g.name, count: g.count, color: accent }))} tooltip={tt} />
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );
  const arc = (cx, cy, r, r2, a0, a1) => {
    const large = a1 - a0 > 0.5 ? 1 : 0;
    const sx = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r;
    const sy = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r;
    const ex = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r;
    const ey = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r;
    const sx2 = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r2;
    const sy2 = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r2;
    const ex2 = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r2;
    const ey2 = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r2;
    return `M${sx},${sy} A${r},${r} 0 ${large} 1 ${ex},${ey} L${sx2},${sy2} A${r2},${r2} 0 ${large} 0 ${ex2},${ey2} Z`;
  };

  const red = 'oklch(0.60 0.20 25)', green = 'oklch(0.62 0.15 155)',
        yellow = 'oklch(0.75 0.17 75)', gray = 'oklch(0.70 0.02 260)';

  return (
    <div className="grid-12">
      {hasSplit && (
        <>
          <div className="col-6">
            <GrowthHBars items={D2b.Q14_GROWTH_SOA} title="Growth Topics — mentions" badge={soaBadge} chartId="Q14_4" accent="oklch(0.55 0.17 290)" />
          </div>
          <div className="col-6">
            <GrowthHBars items={D2b.Q14_GROWTH_EC}  title="Growth Topics — mentions" badge={ecBadge}  chartId="Q14_5" accent="oklch(0.55 0.17 340)" />
          </div>
        </>
      )}
      <div className="col-5">
        <div className="card">
          <div className="card-head"><div className="card-title">Growth topics distribution</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width={220} height={220}>
              {seg.map(s => (
                <path key={s.name} d={arc(110, 110, 95, 55, s.start, s.end)} fill={s.color}
                  onMouseEnter={e => tt.show(e, `<b>${s.en || s.name}</b> · ${s.count}`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
              ))}
            </svg>
            <div style={{ flex: 1, fontSize: 11 }}>
              {Q14_GROWTH.map(g => (
                <div key={g.name} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 10, height: 10, background: g.color, borderRadius: 2 }}></span>
                  <span style={{ flex: 1 }}>{g.en || g.name}</span>
                </div>
              ))}
            </div>
          </div>
        
        <window.CardComments chartId="Q14_1" />
      </div>
      </div>
      <div className="col-7">
        <div className="card">
          <div className="card-head"><div className="card-title">Top 6 topics comparison</div></div>
          <HBars items={Q14_GROWTH.map(g => ({ name: g.en || g.name, count: g.count, color: 'var(--accent)' }))} tooltip={tt} />
        
        <window.CardComments chartId="Q14_2" />
      </div>
      </div>
      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Sentiment by growth topic</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: red }}></span>Seeking</span>
              <span><span className="dot" style={{ background: green }}></span>Positive</span>
              <span><span className="dot" style={{ background: yellow }}></span>Mixed</span>
              <span><span className="dot" style={{ background: gray }}></span>Negative</span>
            </div>
          </div>
          <div>
            {Q14_GROWTH.map(g => {
              const tot = g.seeking + g.positive + g.mixed + g.negative;
              const pct = v => (v / tot) * 100;
              return (
                <div key={g.name} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{g.en || g.name}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{tot}</span>
                  </div>
                  <div style={{ display: 'flex', height: 14, borderRadius: 3, overflow: 'hidden' }}
                    onMouseEnter={e => tt.show(e, `<b>${g.en || g.name}</b><br/>Seeking ${g.seeking} · Positive ${g.positive} · Mixed ${g.mixed} · Negative ${g.negative}`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide}>
                    <div style={{ width: `${pct(g.seeking)}%`, background: red }}></div>
                    <div style={{ width: `${pct(g.positive)}%`, background: green }}></div>
                    <div style={{ width: `${pct(g.mixed)}%`, background: yellow }}></div>
                    <div style={{ width: `${pct(g.negative)}%`, background: gray }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        
        <window.CardComments chartId="Q14_3" />
      </div>
      </div>
      {(() => {
        const topGrowth = Q14_GROWTH[0];
        const mostPositive = [...Q14_GROWTH].sort((a, b) => b.positive - a.positive)[0];
        const mostSeeking = [...Q14_GROWTH].sort((a, b) => b.seeking - a.seeking)[0];
        return (
          <div style={{ gridColumn: '1 / -1' }}>
            <window.Insight qId="Q14">
              Leading growth topic: <b>{topGrowth?.en || topGrowth?.name || '—'}</b> ({topGrowth?.count.toLocaleString() || 0} mentions) ·
              Most positive sentiment: <b>{mostPositive?.en || mostPositive?.name || '—'}</b> (+{mostPositive?.positive || 0}) ·
              Sellers seek most help on: <b>{mostSeeking?.en || mostSeeking?.name || '—'}</b> ({mostSeeking?.seeking || 0} mentions actively asking).
            </window.Insight>
          </div>
        );
      })()}
      {tt.node}
    </div>
  );
}
window.Q14 = Q14;
