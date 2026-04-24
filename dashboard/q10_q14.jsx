/* global React, window */
const D2b = window.ChiComData2;

// Q10 — Product categories (sub-topic breakdown per segment)
// Primary view: SOA + EC sub-topic breakdowns — remixed analyst report uses
// sub-topic counts as a proxy for product-context discussion. Falls back to
// the old keyword-matched Q10_TOP / Q10_WEEKLY charts when the pipeline
// hasn't been rebuilt with the new Q10_SUBS_* fields yet.
function Q10() {
  const tt = window.useTooltip();
  const { Q10_TOP, Q10_WEEKS, Q10_WEEKLY } = D2b;
  const hasSubSplit = D2b.Q10_SUBS_SOA && D2b.Q10_SUBS_EC;

  const soaBadge = <span className="badge soa">SOA</span>;
  const ecBadge  = <span className="badge ec">EC</span>;

  // Fallback-mode chart constants (keyword weekly trend)
  const WW = 720, WH = 260, wpad = { t: 20, r: 120, b: 30, l: 40 };
  const wPlotW = WW - wpad.l - wpad.r, wPlotH = WH - wpad.t - wpad.b;
  const maxWeek = hasSubSplit ? 0 : Math.max(...(Q10_WEEKLY || []).flatMap(w => w.points));

  const soaTop = (D2b.Q10_SUBS_SOA || [])[0] || { vn: '—', count: 0 };
  const ecTop  = (D2b.Q10_SUBS_EC  || [])[0] || { vn: '—', count: 0 };

  return (
    <div className="grid-12">
      {hasSubSplit ? (
        <>
          <div className="col-6">
            <div className="card">
              <div className="card-head">
                <div className="card-title">Top discussion sub-topics {soaBadge}</div>
              </div>
              <HBars items={D2b.Q10_SUBS_SOA} labelKey="vn" valueKey="count" tooltip={tt} />
              <window.CardComments chartId="Q10_1" />
            </div>
          </div>
          <div className="col-6">
            <div className="card">
              <div className="card-head">
                <div className="card-title">Top discussion sub-topics {ecBadge}</div>
              </div>
              <HBars items={D2b.Q10_SUBS_EC} labelKey="vn" valueKey="count" tooltip={tt} />
              <window.CardComments chartId="Q10_2" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="col-5">
            <div className="card">
              <div className="card-head">
                <div className="card-title">Top 10 Product Categories — Q4 2025</div>
              </div>
              <HBars items={Q10_TOP} labelKey="name" valueKey="count" tooltip={tt} />
              <window.CardComments chartId="Q10_1" />
            </div>
          </div>
          <div className="col-7">
            <div className="card">
              <div className="card-head">
                <div className="card-title">Weekly trend — Top 8 categories</div>
              </div>
              <svg width="100%" viewBox={`0 0 ${WW} ${WH}`}>
                {[0, 0.5, 1].map((f, i) => (
                  <line key={i} x1={wpad.l} y1={wpad.t + wPlotH * f} x2={WW - wpad.r} y2={wpad.t + wPlotH * f} className="grid-line" />
                ))}
                {Q10_WEEKLY.map((t) => {
                  const pts = t.points.map((v, i) => {
                    const x = wpad.l + (i / (t.points.length - 1)) * wPlotW;
                    const y = wpad.t + wPlotH - Math.max(0, v) / maxWeek * wPlotH;
                    return [x, y];
                  });
                  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
                  const area = d + ` L${wpad.l + wPlotW},${wpad.t + wPlotH} L${wpad.l},${wpad.t + wPlotH} Z`;
                  return (
                    <g key={t.name}>
                      <path d={area} fill={t.color} opacity={0.12} />
                      <path d={d} fill="none" stroke={t.color} strokeWidth={1.5} />
                    </g>
                  );
                })}
                {Q10_WEEKS.map((w, i) => i % 3 === 0 && (
                  <text key={w} x={wpad.l + (i / (Q10_WEEKS.length - 1)) * wPlotW} y={WH - 10} textAnchor="middle" className="axis-tick">{w}</text>
                ))}
                {Q10_WEEKLY.map((t, i) => (
                  <g key={t.name + 'l'}>
                    <rect x={WW - wpad.r + 10} y={wpad.t + i * 20} width={10} height={10} fill={t.color} rx={2} />
                    <text x={WW - wpad.r + 26} y={wpad.t + i * 20 + 9} className="axis-tick" style={{ fontSize: 10 }}>{t.name}</text>
                  </g>
                ))}
              </svg>
              <window.CardComments chartId="Q10_2" />
            </div>
          </div>
        </>
      )}

      <div style={{ gridColumn: '1 / -1' }}>
        <window.Insight qId="Q10">
          {hasSubSplit ? (
            <>
              SOA top sub-topic: <b>{soaTop.vn}</b> ({soaTop.count.toLocaleString()} mentions) ·
              EC top sub-topic: <b>{ecTop.vn}</b> ({ecTop.count.toLocaleString()}).
            </>
          ) : (
            <>
              Leading category: <b>{Q10_TOP[0]?.name || '—'}</b> ({Q10_TOP[0]?.count.toLocaleString() || 0} mentions) ·
              Top-3: {Q10_TOP.slice(0, 3).map(c => c.name).join(', ')}.
            </>
          )}
        </window.Insight>
      </div>
      {tt.node}
    </div>
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
          <HBars items={Q11_TOOLS.map(t => ({ ...t, color: 'var(--accent)' }))} labelKey="name" valueKey="use" tooltip={tt} />
        
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
                    onMouseEnter={e => tt.show(e, `<b>${t.name}</b> · Satisfied ${t.satisfied}`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide} />
                  <rect x={x0 + bw + 2} y={pad.t + plotH - iH} width={bw} height={iH} fill={red}
                    onMouseEnter={e => tt.show(e, `<b>${t.name}</b> · Issues ${t.issues}`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide} />
                  <text x={x0 + bw} y={pad.t + plotH + 10}
                    transform={`rotate(-35 ${x0 + bw} ${pad.t + plotH + 10})`}
                    textAnchor="end" className="axis-tick" style={{ fontSize: 9 }}>{t.name}</text>
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
          <HBars items={Q11_ISSUES.map(t => ({ ...t, color: red }))} labelKey="name" valueKey="count" tooltip={tt} />
        
        <window.CardComments chartId="Q11_3" />
      </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Top satisfaction drivers</div></div>
          <HBars items={Q11_SATISFACTION.map(t => ({ ...t, color: green }))} labelKey="name" valueKey="count" tooltip={tt} />
        
        <window.CardComments chartId="Q11_4" />
      </div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <window.Insight qId="Q11">
          Most-used tool: <b>{Q11_TOOLS[0]?.name || '—'}</b> (use {Q11_TOOLS[0]?.use.toLocaleString() || 0}, satisfied {Q11_TOOLS[0]?.satisfied || 0}, issues {Q11_TOOLS[0]?.issues || 0}) ·
          Top issue: <b>{Q11_ISSUES[0]?.name || '—'}</b> ({Q11_ISSUES[0]?.count.toLocaleString() || 0}) ·
          Top satisfaction driver: <b>{Q11_SATISFACTION[0]?.name || '—'}</b> ({Q11_SATISFACTION[0]?.count.toLocaleString() || 0}).
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
      <HBars items={items.map(s => ({ name: s.name, count: s.mentions, color: accent }))} tooltip={tt} />
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );

  return (
    <div className="grid-12">
      {hasSplit && (
        <>
          <div className="col-6">
            <ServiceHBars items={D2b.Q12_SERVICES_SOA} title="3rd-party services — mentions" badge={soaBadge} chartId="Q12_4" accent="oklch(0.55 0.17 25)" />
          </div>
          <div className="col-6">
            <ServiceHBars items={D2b.Q12_SERVICES_EC}  title="3rd-party services — mentions" badge={ecBadge}  chartId="Q12_5" accent="oklch(0.55 0.17 260)" />
          </div>
        </>
      )}
      <div className="col-12">
        <div className="card">
          <div className="card-head"><div className="card-title">3rd-party services — Overview</div></div>
          <div className="grid-3" style={{ gap: 12 }}>
            {[
              { title: 'High Priority (High Demand)', items: ['Review Service — 61.8% demand', 'Product Sourcing — 54.2%', 'Software/Tools — 53.6%', 'VA/Assistant — 52.0%'], color: red },
              { title: 'Medium Priority (Volume)', items: ['Accountant/Tax — 177', 'Legal/Trademark — 108', 'Listing Optimization — 107 mentions'], color: 'oklch(0.68 0.17 60)' },
              { title: 'Well Served (High Satisfaction)', items: ['Photography — 100%', 'Legal/Trademark — 81.8%', 'Product Sourcing — 78.9%'], color: 'oklch(0.62 0.15 155)' },
            ].map(b => (
              <div key={b.title} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, borderLeft: `3px solid ${b.color}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>{b.title}</div>
                {b.items.map(i => <div key={i} style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 3 }}>• {i}</div>)}
              </div>
            ))}
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
                    onMouseEnter={e => tt.show(e, `<b>${s.name}</b> · ${s.mentions} mentions`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide} />
                  <rect x={x0 + bw + 2} y={pad.t + plotH - nH} width={bw} height={nH} fill={red}
                    onMouseEnter={e => tt.show(e, `<b>${s.name}</b> · ${s.need} looking`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide} />
                  <text x={x0 + bw} y={pad.t + plotH + 10}
                    transform={`rotate(-30 ${x0 + bw} ${pad.t + plotH + 10})`}
                    textAnchor="end" className="axis-tick" style={{ fontSize: 10 }}>{s.name}</text>
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
          <HBars items={Q12_SERVICES.map(s => ({ name: s.name, count: s.demand, color: 'oklch(0.75 0.17 75)' }))} tooltip={tt} />
        
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
              Most-mentioned service: <b>{topMent?.name || '—'}</b> ({topMent?.mentions.toLocaleString() || 0} mentions) ·
              Highest demand: <b>{topDemand?.name || '—'}</b> ({topDemand?.demand || 0}% demand) ·
              Most satisfied: <b>{topSat?.name || '—'}</b> ({topSat?.satisfaction || 0}%).
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
      <HBars items={items.map(c => ({ name: c.name, count: c.mentions, color: accent }))} tooltip={tt} />
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );

  const total = Q13_COURSES.reduce((a, b) => a + b.mentions, 0);
  let acc = 0;
  const donutSeg = Q13_COURSES.map((c, i) => {
    const start = acc; acc += c.mentions / total;
    const colors = [blue, green, 'oklch(0.75 0.17 75)', 'oklch(0.60 0.20 25)'];
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
            <CourseHBars items={D2b.Q13_COURSES_SOA} title="Courses — mentions" badge={soaBadge} chartId="Q13_5" accent="oklch(0.55 0.17 25)" />
          </div>
          <div className="col-6">
            <CourseHBars items={D2b.Q13_COURSES_EC}  title="Courses — mentions" badge={ecBadge}  chartId="Q13_6" accent="oklch(0.55 0.17 260)" />
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
                    textAnchor="end" className="axis-tick">{c.name}</text>
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
          <HBars items={Q13_COURSES.map(c => ({ name: c.name, count: c.interest, color: 'oklch(0.75 0.17 75)' }))} tooltip={tt} />
        
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
                    <span>{c.name}</span>
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
                  onMouseEnter={e => tt.show(e, `<b>${s.name}</b> · ${Math.round((s.mentions / total) * 100)}%`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
              ))}
            </svg>
            <div style={{ flex: 1, fontSize: 11 }}>
              {donutSeg.map(s => (
                <div key={s.name} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2, flexShrink: 0 }}></span>
                  <span style={{ flex: 1 }}>{s.name}</span>
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
              Most-mentioned course: <b>{topCourse?.name || '—'}</b> ({topCourse?.mentions.toLocaleString() || 0}) ·
              Most-sought: <b>{topSeeking?.name || '—'}</b> ({topSeeking?.seeking || 0} mentions actively asking) ·
              Most positive sentiment: <b>{topPositive?.name || '—'}</b> (+{topPositive?.positive || 0}).
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
      <HBars items={items.map(g => ({ name: g.name, count: g.count, color: accent }))} tooltip={tt} />
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
            <GrowthHBars items={D2b.Q14_GROWTH_SOA} title="Growth Topics — mentions" badge={soaBadge} chartId="Q14_4" accent="oklch(0.55 0.17 25)" />
          </div>
          <div className="col-6">
            <GrowthHBars items={D2b.Q14_GROWTH_EC}  title="Growth Topics — mentions" badge={ecBadge}  chartId="Q14_5" accent="oklch(0.55 0.17 260)" />
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
                  onMouseEnter={e => tt.show(e, `<b>${s.name}</b> · ${s.count}`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
              ))}
            </svg>
            <div style={{ flex: 1, fontSize: 11 }}>
              {Q14_GROWTH.map(g => (
                <div key={g.name} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 10, height: 10, background: g.color, borderRadius: 2 }}></span>
                  <span style={{ flex: 1 }}>{g.name}</span>
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
          <HBars items={Q14_GROWTH.map(g => ({ name: g.name, count: g.count, color: 'var(--accent)' }))} tooltip={tt} />
        
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
                    <span>{g.name}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{tot}</span>
                  </div>
                  <div style={{ display: 'flex', height: 14, borderRadius: 3, overflow: 'hidden' }}
                    onMouseEnter={e => tt.show(e, `<b>${g.name}</b><br/>Seeking ${g.seeking} · Positive ${g.positive} · Mixed ${g.mixed} · Negative ${g.negative}`)}
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
              Leading growth topic: <b>{topGrowth?.name || '—'}</b> ({topGrowth?.count.toLocaleString() || 0} mentions) ·
              Most positive sentiment: <b>{mostPositive?.name || '—'}</b> (+{mostPositive?.positive || 0}) ·
              Sellers seek most help on: <b>{mostSeeking?.name || '—'}</b> ({mostSeeking?.seeking || 0} mentions actively asking).
            </window.Insight>
          </div>
        );
      })()}
      {tt.node}
    </div>
  );
}
window.Q14 = Q14;
