/* global React, window */
const D2 = window.ChiComData2;

// Horizontal bar list
function HBars({ items, colorKey = 'color', labelKey = 'name', valueKey = 'count', defaultColor = 'var(--accent)', height = 260, tooltip }) {
  const tt = tooltip;
  const max = Math.max(...items.map(i => i[valueKey]));
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} className="rowbar" style={{ gridTemplateColumns: '1fr 52px' }}
          onMouseEnter={e => tt && tt.show(e, `<b>${it[labelKey]}</b><br/>${it[valueKey]}`)}
          onMouseMove={tt && tt.move} onMouseLeave={tt && tt.hide}>
          <div>
            <div style={{ fontSize: 11, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it[labelKey]}</div>
            <div className="rowbar-track">
              <div className="rowbar-fill" style={{ width: `${(it[valueKey] / max) * 100}%`, background: it[colorKey] || defaultColor }}></div>
            </div>
          </div>
          <div className="rowbar-value">{it[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}
window.HBars = HBars;

// ============ Q7 ============

const Q7_GREEN = 'oklch(0.62 0.15 155)';
const Q7_RED   = 'oklch(0.60 0.20 25)';
const Q7_GRAY  = 'oklch(0.70 0.02 260)';

function _donutArc(cx, cy, r, r2, a0, a1) {
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

function Q7BarCard({ items, title, badge, chartId, tt }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{title} {badge}</div>
      </div>
      <HBars items={items.map(t => ({ ...t, color: Q7_GREEN }))} labelKey="en" valueKey="count" tooltip={tt} />
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );
}

function Q7SentimentCard({ sentiment, title, badge, chartId, tt }) {
  const total = Math.max(1, sentiment.positive + sentiment.neutral + sentiment.negative);
  let acc = 0;
  const segs = [
    { label: 'Positive', v: sentiment.positive, color: Q7_GREEN },
    { label: 'Neutral',  v: sentiment.neutral,  color: Q7_GRAY },
    { label: 'Negative', v: sentiment.negative, color: Q7_RED },
  ].map(s => {
    const start = acc; acc += s.v / total;
    return { ...s, start, end: acc };
  });
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{title} {badge}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
        <svg width={200} height={200}>
          {segs.map(s => (
            <path key={s.label} d={_donutArc(100, 100, 85, 55, s.start, s.end)} fill={s.color}
              onMouseEnter={e => tt.show(e, `<b>${s.label}</b> · ${s.v}%`)}
              onMouseMove={tt.move} onMouseLeave={tt.hide}
              style={{ cursor: 'pointer' }} />
          ))}
          <text x={100} y={96} textAnchor="middle" className="mono" style={{ fontSize: 22, fontWeight: 600, fill: 'var(--text)' }}>{sentiment.positive}%</text>
          <text x={100} y={114} textAnchor="middle" className="axis-tick">positive</text>
        </svg>
      </div>
      <div className="legend-inline" style={{ justifyContent: 'center' }}>
        {segs.map(s => <span key={s.label}><span className="dot" style={{ background: s.color }}></span>{s.label} {s.v}%</span>)}
      </div>
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );
}

function Q7() {
  const tt = window.useTooltip();
  const { Q7_TOPICS, Q7_BENEFITS, Q7_SENTIMENT } = D2;
  // Primary view: sub-topic breakdown of positive-sentiment posts per
  // segment (matches the remixed analyst report). Falls back to the
  // keyword-matched Q7_TOPICS charts if the pipeline hasn't been rebuilt
  // with the new Q7_POS_SUBS_* fields yet.
  const hasSubSplit = D2.Q7_POS_SUBS_SOA && D2.Q7_POS_SUBS_EC;

  const soaBadge = <span className="badge soa">SOA</span>;
  const ecBadge  = <span className="badge ec">EC</span>;

  const soaTop = (D2.Q7_POS_SUBS_SOA || [])[0] || { en: '—', vn: '—', count: 0 };
  const ecTop  = (D2.Q7_POS_SUBS_EC  || [])[0] || { en: '—', vn: '—', count: 0 };

  return (
    <div className="grid-12">
      {hasSubSplit ? (
        <>
          <div className="col-6"><Q7BarCard items={D2.Q7_POS_SUBS_SOA} title="Top positive sub-topics" badge={soaBadge} chartId="Q7_1" tt={tt} /></div>
          <div className="col-6"><Q7BarCard items={D2.Q7_POS_SUBS_EC}  title="Top positive sub-topics" badge={ecBadge}  chartId="Q7_2" tt={tt} /></div>
        </>
      ) : (
        <>
          <div className="col-4"><Q7BarCard items={Q7_TOPICS}   title="Top join triggers"    chartId="Q7_1" tt={tt} /></div>
          <div className="col-4"><Q7BarCard items={Q7_BENEFITS} title="Top benefits mentioned" chartId="Q7_2" tt={tt} /></div>
          <div className="col-4"><Q7SentimentCard sentiment={Q7_SENTIMENT} title="Sentiment distribution" chartId="Q7_3" tt={tt} /></div>
        </>
      )}

      <div style={{ gridColumn: '1 / -1' }}>
        <window.Insight qId="Q7">
          {hasSubSplit ? (
            <>
              SOA top positive sub-topic: <b>{soaTop.en || soaTop.vn}</b> ({soaTop.count.toLocaleString()} mentions) ·
              EC top positive sub-topic: <b>{ecTop.en || ecTop.vn}</b> ({ecTop.count.toLocaleString()}).
            </>
          ) : (
            <>
              Top join reason: <b>{Q7_TOPICS[0]?.en || Q7_TOPICS[0]?.vn || '—'}</b> ({Q7_TOPICS[0]?.count.toLocaleString() || 0} mentions) ·
              Top benefit: <b>{Q7_BENEFITS[0]?.en || Q7_BENEFITS[0]?.vn || '—'}</b> ({Q7_BENEFITS[0]?.count.toLocaleString() || 0}).
            </>
          )}
        </window.Insight>
      </div>
      {tt.node}
    </div>
  );
}
window.Q7 = Q7;

// ============ Q8 ============
function Q8() {
  const tt = window.useTooltip();
  const { Q8_TRIGGERS, Q8_PERSONA, Q8_TREND } = D2;
  const total = Q8_PERSONA.reduce((a, b) => a + b.count, 0);
  let acc = 0;
  const pieSegs = Q8_PERSONA.map(p => {
    const start = acc; acc += p.count / total;
    return { ...p, start, end: acc };
  });
  const arc = (cx, cy, r, a0, a1) => {
    const large = a1 - a0 > 0.5 ? 1 : 0;
    const sx = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r;
    const sy = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r;
    const ex = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r;
    const ey = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r;
    return `M${cx},${cy} L${sx},${sy} A${r},${r} 0 ${large} 1 ${ex},${ey} Z`;
  };

  const maxTrend = Math.max(...Q8_TREND);
  const months = window.ChiComData.MONTHS.concat(['2026-05', '2026-06', '2026-07', '2026-08']).slice(0, Q8_TREND.length);

  return (
    <div className="grid-12">
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Top reasons to leave Amazon</div>
          </div>
          <HBars items={Q8_TRIGGERS} labelKey="en" valueKey="count" tooltip={tt} />
        
        <window.CardComments chartId="Q8_1" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Persona distribution</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg width={220} height={220}>
              {pieSegs.map(p => (
                <path key={p.label} d={arc(110, 110, 100, p.start, p.end)} fill={p.color}
                  stroke="var(--panel)" strokeWidth={1}
                  onMouseEnter={e => tt.show(e, `<b>${p.label}</b><br/>${p.count} · ${Math.round((p.count / total) * 100)}%`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
              ))}
            </svg>
            <div style={{ flex: 1, fontSize: 12 }}>
              {Q8_PERSONA.map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, background: p.color, borderRadius: 2 }}></span>
                  <span style={{ flex: 1 }}>{p.label}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        
        <window.CardComments chartId="Q8_2" />
      </div>
      </div>
      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Negative abandonment discussions — by month</div>
            </div>
            <span className="card-meta">mentions · max {maxTrend}</span>
          </div>
          <svg width="100%" viewBox="0 0 720 180">
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <g key={i}>
                <line x1={40} y1={20 + 130 * f} x2={700} y2={20 + 130 * f} className="grid-line" />
                <text x={34} y={20 + 130 * f + 3} textAnchor="end" className="axis-tick">
                  {Math.round(maxTrend * (1 - f))}
                </text>
              </g>
            ))}
            <path d={Q8_TREND.map((v, i) => {
              const x = 40 + (i / (Q8_TREND.length - 1)) * 660;
              const y = 150 - (v / maxTrend) * 130;
              return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            }).join(' ')} fill="none" stroke="oklch(0.60 0.20 25)" strokeWidth={2} />
            <path d={
              Q8_TREND.map((v, i) => {
                const x = 40 + (i / (Q8_TREND.length - 1)) * 660;
                const y = 150 - (v / maxTrend) * 130;
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
              }).join(' ') + ' L700,150 L40,150 Z'
            } fill="oklch(0.60 0.20 25)" opacity={0.1} />
            {Q8_TREND.map((v, i) => {
              const x = 40 + (i / (Q8_TREND.length - 1)) * 660;
              const y = 150 - (v / maxTrend) * 130;
              return <circle key={i} cx={x} cy={y} r={3} fill="oklch(0.60 0.20 25)"
                onMouseEnter={e => tt.show(e, `<b>${months[i] || `M${i}`}</b><br/>${v} abandonment mentions`)}
                onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />;
            })}
            {months.map((m, i) => i % 2 === 0 && (
              <text key={m} x={40 + (i / (Q8_TREND.length - 1)) * 660} y={170} textAnchor="middle" className="axis-tick">{m}</text>
            ))}
          </svg>
        
        <window.CardComments chartId="Q8_3" />
      </div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <window.Insight qId="Q8">
          Top reason to leave: <b>{Q8_TRIGGERS[0]?.en || Q8_TRIGGERS[0]?.vn || '—'}</b> ({Q8_TRIGGERS[0]?.count.toLocaleString() || 0} mentions) ·
          Most-leaving persona: <b>{Q8_PERSONA[0]?.label || '—'}</b> ({Q8_PERSONA[0]?.count.toLocaleString() || 0}) ·
          Peak month: <b>{months[Q8_TREND.indexOf(Math.max(...Q8_TREND))] || '—'}</b> ({Math.max(...Q8_TREND).toLocaleString()} mentions).
        </window.Insight>
      </div>
      {tt.node}
    </div>
  );
}
window.Q8 = Q8;

// ============ Q9 — active participants by persona ============
function _q9Arc(cx, cy, r, r2, a0, a1) {
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

function Q9Donut({ title, badge, items, chartId, tt }) {
  const total = items.reduce((a, b) => a + b.count, 0) || 1;
  let acc = 0;
  const seg = items.map(it => {
    const start = acc; acc += it.count / total;
    return { ...it, start, end: acc };
  });
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{title} {badge}</div>
        <span className="card-meta">{total.toLocaleString()} posts</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0' }}>
        <svg width={200} height={200}>
          {seg.map(s => (
            <path key={s.name} d={_q9Arc(100, 100, 85, 50, s.start, s.end)} fill={s.color}
              onMouseEnter={e => tt.show(e, `<b>${s.name}</b> · ${s.count.toLocaleString()} (${Math.round((s.count / total) * 100)}%)`)}
              onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
          ))}
          <text x={100} y={96} textAnchor="middle" style={{ fontSize: 22, fontWeight: 600, fill: 'var(--text)' }}>{total.toLocaleString()}</text>
          <text x={100} y={114} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--text-3)' }}>posts</text>
        </svg>
        <div style={{ flex: 1, fontSize: 11 }}>
          {seg.map(s => (
            <div key={s.name} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, flexShrink: 0 }}></span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              <span className="mono" style={{ color: 'var(--text-3)' }}>{Math.round((s.count / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );
}

function Q9ThreadList({ title, badge, items, chartId }) {
  const sentimentDot = (s) => {
    const color = s === 'positive' ? 'oklch(0.62 0.15 155)'
                : s === 'negative' ? 'oklch(0.60 0.20 25)'
                : 'oklch(0.70 0.02 260)';
    return (
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} title={s || 'unknown'}></span>
    );
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{title} {badge}</div>
        <span className="card-meta">top {items.length} threads</span>
      </div>
      <div>
        {items.length === 0 && (
          <div style={{ padding: '24px 8px', fontSize: 12, color: 'var(--text-3)' }}>
            No threads available.
          </div>
        )}
        {items.map((t, i) => (
          <a key={t.id} href={t.link} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 64px',
              gap: 10,
              alignItems: 'flex-start',
              padding: '10px 6px',
              borderBottom: '1px solid var(--border)',
              textDecoration: 'none',
              color: 'inherit',
            }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', paddingTop: 2 }}>
              #{i + 1}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>
                {sentimentDot(t.sentiment)}
                <span className={`badge ${t.group_type === 'SOA' ? 'soa' : 'ec'}`}>{t.group_type}</span>
                <span>{t.group_name}</span>
                {t.persona && <span>· {t.persona}</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.35 }}>
                {t.preview || <em style={{ color: 'var(--text-3)' }}>(no preview)</em>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                {(t.comments ?? Math.max(0, t.count - 1)).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>comments</div>
            </div>
          </a>
        ))}
      </div>
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );
}

function Q9() {
  const soa = D2.Q9_TOP_THREADS_SOA || [];
  const ec  = D2.Q9_TOP_THREADS_EC  || [];
  const soaBadge = <span className="badge soa">SOA</span>;
  const ecBadge  = <span className="badge ec">EC</span>;

  return (
    <div className="grid-12">
      <div className="col-6"><Q9ThreadList title="Top 10 most-discussed threads" badge={soaBadge} items={soa} chartId="Q9_SOA" /></div>
      <div className="col-6"><Q9ThreadList title="Top 10 most-discussed threads" badge={ecBadge}  items={ec}  chartId="Q9_EC"  /></div>
    </div>
  );
}
window.Q9 = Q9;
