/* global React, D, window */
const { useState: useStateQ3 } = React;

// ============ Q3 — Seller vs Prospect deep dive ============
function Q3() {
  const tt = window.useTooltip();
  const q3 = [...D.Q3_SELLER_PROSPECT].sort((a, b) => Math.max(b.sellerPct, b.prospectPct) - Math.max(a.sellerPct, a.prospectPct));
  const max = Math.max(...q3.flatMap(r => [r.sellerPct, r.prospectPct]));

  const sellerColor = 'oklch(0.62 0.16 25)';
  const prospectColor = 'oklch(0.55 0.17 260)';

  // Sub-topic difference
  const subs = [...D.Q3_SUBS].sort((a, b) => b.diff - a.diff);
  const absMax = Math.max(...subs.map(s => Math.abs(s.diff))) + 1;

  return (
    <div className="grid-12">
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">{D.MASTER_TOPICS.length} Master Topics — Seller vs Prospect</div>
            </div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: sellerColor }}></span>Seller</span>
              <span><span className="dot" style={{ background: prospectColor }}></span>Prospect</span>
            </div>
          </div>
          <div>
            {q3.map(r => (
              <div key={r.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, marginBottom: 4, color: 'var(--text)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{r.vn}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    S {r.sellerPct}% · P {r.prospectPct}%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}
                  onMouseEnter={e => tt.show(e, `<b>${r.vn}</b><br/>Seller ${r.sellerPct}% · Prospect ${r.prospectPct}%<br/>diff ${r.diff > 0 ? '+' : ''}${r.diff}pp`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide}>
                  <div style={{ flex: 1, display: 'flex', gap: 2, flexDirection: 'column' }}>
                    <div style={{ height: 6, background: 'var(--panel-2)', borderRadius: 2 }}>
                      <div style={{ width: `${(r.sellerPct / max) * 100}%`, height: '100%', background: sellerColor, borderRadius: 2 }}></div>
                    </div>
                    <div style={{ height: 6, background: 'var(--panel-2)', borderRadius: 2 }}>
                      <div style={{ width: `${(r.prospectPct / max) * 100}%`, height: '100%', background: prospectColor, borderRadius: 2 }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(() => {
            const sellerLead = [...q3].sort((a, b) => b.diff - a.diff)[0];
            const prospectLead = [...q3].sort((a, b) => a.diff - b.diff)[0];
            return (
              <window.Insight>
                Seller dominates: <b>{sellerLead.vn}</b> (+{sellerLead.diff}pp) ·
                Prospect dominates: <b>{prospectLead.vn}</b> ({prospectLead.diff}pp).
              </window.Insight>
            );
          })()}
        </div>
      </div>

      <div className="col-6">
        <div className="card" style={{ minHeight: 520 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Khác biệt theo chủ đề phụ</div>
            </div>
            <span className="card-meta">{subs.length} chủ đề phụ</span>
          </div>
          <svg width="100%" height={subs.length * 20 + 30} viewBox={`0 0 640 ${subs.length * 20 + 30}`} preserveAspectRatio="none">
            <line x1={320} y1={0} x2={320} y2={subs.length * 20} className="axis-line" />
            {subs.map((s, i) => {
              const y = i * 20;
              const barW = (Math.abs(s.diff) / absMax) * 300;
              const x = s.diff >= 0 ? 320 : 320 - barW;
              return (
                <g key={i}
                  onMouseEnter={e => tt.show(e, `<b>${s.vn}</b><br/>Seller ${s.seller}% · Prospect ${s.prospect}%<br/>diff ${s.diff > 0 ? '+' : ''}${s.diff}pp`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide}>
                  <text x={315} y={y + 14} textAnchor={s.diff >= 0 ? 'end' : 'start'} className="axis-tick" style={{ fontSize: 10 }}>
                    {s.vn.length > 34 ? s.vn.slice(0, 32) + '…' : s.vn}
                  </text>
                  <rect x={x} y={y + 5} width={barW} height={12} fill={s.diff >= 0 ? sellerColor : prospectColor} rx={2} />
                  <text x={s.diff >= 0 ? x + barW + 4 : x - 4} y={y + 14}
                    textAnchor={s.diff >= 0 ? 'start' : 'end'}
                    className="mono" style={{ fontSize: 10, fill: 'var(--text-3)' }}>
                    {s.diff > 0 ? '+' : ''}{s.diff}
                  </text>
                </g>
              );
            })}
          </svg>
          {(() => {
            const biggestGap = [...subs].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
            return (
              <window.Insight>
                Sub-topic có khoảng cách Seller/Prospect lớn nhất: <b>{biggestGap.vn}</b> ({biggestGap.diff > 0 ? '+' : ''}{biggestGap.diff}pp).
              </window.Insight>
            );
          })()}
        </div>
      </div>

      {tt.node}
    </div>
  );
}
window.Q3 = Q3;

// ============ Q4 — Trends over time ============
function Q4() {
  const tt = window.useTooltip();
  const trends = D.Q4_TRENDS;
  const months = D.MONTHS;
  const W = 700, H = 280, pad = { t: 20, r: 20, b: 30, l: 40 };
  const maxY = Math.max(...trends.flatMap(t => t.points));
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;

  const linePts = (pts) => pts.map((v, i) => {
    const x = pad.l + (i / (pts.length - 1)) * plotW;
    const y = pad.t + plotH - (v / maxY) * plotH;
    return [x, y];
  });

  // Stacked percentage area chart
  const stacked = months.map((m, mi) => {
    const total = trends.reduce((a, t) => a + t.points[mi], 0);
    let acc = 0;
    return trends.map(t => {
      const frac = t.points[mi] / total;
      const seg = { start: acc, end: acc + frac, id: t.id, color: t.color };
      acc += frac;
      return seg;
    });
  });

  const stackedPath = (tIdx) => {
    const topPts = stacked.map((s, mi) => [pad.l + (mi / (months.length - 1)) * plotW, pad.t + plotH - s[tIdx].end * plotH]);
    const botPts = stacked.map((s, mi) => [pad.l + (mi / (months.length - 1)) * plotW, pad.t + plotH - s[tIdx].start * plotH]).reverse();
    return [...topPts, ...botPts].map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';
  };

  // weekly with events
  const weekly = D.Q4_WEEKLY;
  const weeks = D.Q4_EVENTS;
  const WW = 820, WH = 320, wpad = { t: 64, r: 240, b: 32, l: 44 };
  const maxWY = Math.max(...weekly.flatMap(t => t.points));
  const wPlotW = WW - wpad.l - wpad.r, wPlotH = WH - wpad.t - wpad.b;
  const weekRangeLabel = (D.WEEKS && D.WEEKS.length)
    ? `${D.WEEKS[0]} — ${D.WEEKS[D.WEEKS.length - 1]} · theo tuần`
    : 'theo tuần';

  return (
    <div className="grid-12">
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Master Topics — số lượng tuyệt đối</div>
            </div>
            <span className="card-meta">theo tháng</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <g key={i}>
                <line x1={pad.l} y1={pad.t + plotH * f} x2={W - pad.r} y2={pad.t + plotH * f} className="grid-line" />
                <text x={pad.l - 6} y={pad.t + plotH * f + 3} textAnchor="end" className="axis-tick">
                  {Math.round(maxY * (1 - f))}
                </text>
              </g>
            ))}
            {months.map((m, i) => (
              <text key={m} x={pad.l + (i / (months.length - 1)) * plotW} y={H - 10} textAnchor="middle" className="axis-tick">{m}</text>
            ))}
            {trends.map((t, ti) => {
              const pts = linePts(t.points);
              const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
              return (
                <g key={t.id}>
                  <path d={d} fill="none" stroke={t.color} strokeWidth={1.5} />
                  {pts.map(([x, y], pi) => (
                    <circle key={pi} cx={x} cy={y} r={2.5} fill={t.color}
                      onMouseEnter={e => tt.show(e, `<b>${t.vn.slice(0, 40)}…</b><br/>${months[pi]} · ${t.points[pi]}`)}
                      onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
                  ))}
                </g>
              );
            })}
          </svg>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 10, marginTop: 8 }}>
            {trends.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                <span style={{ width: 10, height: 10, background: t.color, borderRadius: 2, flexShrink: 0 }}></span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>MT{i + 1} · {t.vn.slice(0, 24)}…</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Master Topics — phân bố %</div>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
            {trends.map((t, ti) => (
              <path key={t.id} d={stackedPath(ti)} fill={t.color} opacity={0.85}
                onMouseEnter={e => tt.show(e, `<b>${t.vn.slice(0, 40)}…</b>`)}
                onMouseMove={tt.move} onMouseLeave={tt.hide} />
            ))}
            {months.map((m, i) => (
              <text key={m} x={pad.l + (i / (months.length - 1)) * plotW} y={H - 10} textAnchor="middle" className="axis-tick">{m}</text>
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <text key={i} x={pad.l - 6} y={pad.t + plotH * f + 3} textAnchor="end" className="axis-tick">
                {Math.round((1 - f) * 100)}%
              </text>
            ))}
          </svg>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Xu hướng chủ đề theo tuần</div>
            </div>
            <span className="card-meta">{weekRangeLabel}</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${WW} ${WH}`} style={{ display: 'block' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <line key={i} x1={wpad.l} y1={wpad.t + wPlotH * f} x2={WW - wpad.r} y2={wpad.t + wPlotH * f} className="grid-line" />
            ))}
            {weeks.map((ev, i) => {
              const x = wpad.l + (ev.week / (D.WEEKS.length - 1)) * wPlotW;
              // 3-row stagger so adjacent spike labels don't collide
              const yOffset = [-46, -30, -14][i % 3];
              return (
                <g key={i}>
                  <line x1={x} y1={wpad.t} x2={x} y2={wpad.t + wPlotH} stroke="var(--neg)" strokeDasharray="3 3" strokeWidth={1} opacity={0.6} />
                  <line x1={x} y1={wpad.t + yOffset + 2} x2={x} y2={wpad.t} stroke="var(--neg)" strokeWidth={1} opacity={0.35} />
                  <text x={x} y={wpad.t + yOffset} textAnchor="middle" className="axis-tick" style={{ fill: 'var(--neg)', fontSize: 10 }}>{ev.label}</text>
                </g>
              );
            })}
            {weekly.map(t => {
              const pts = t.points.map((v, i) => {
                const x = wpad.l + (i / (t.points.length - 1)) * wPlotW;
                const y = wpad.t + wPlotH - (v / maxWY) * wPlotH;
                return [x, y];
              });
              const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
              return (
                <g key={t.id}>
                  <path d={d} fill="none" stroke={t.color} strokeWidth={2} />
                  {pts.map(([x, y], pi) => (
                    <circle key={pi} cx={x} cy={y} r={2.5} fill={t.color} />
                  ))}
                </g>
              );
            })}
            {D.WEEKS.map((w, i) => i % 2 === 0 && (
              <text key={w} x={wpad.l + (i / (D.WEEKS.length - 1)) * wPlotW} y={WH - 10} textAnchor="middle" className="axis-tick">{w}</text>
            ))}
            {weekly.map((t, i) => {
              const label = t.vn.length > 24 ? t.vn.slice(0, 22) + '…' : t.vn;
              return (
                <g key={t.id + 'leg'}>
                  <rect x={WW - wpad.r + 10} y={wpad.t + i * 22} width={10} height={10} fill={t.color} rx={2} />
                  <text x={WW - wpad.r + 26} y={wpad.t + i * 22 + 9} className="axis-tick" style={{ fontSize: 10 }}>
                    <title>{t.vn}</title>{label}
                  </text>
                </g>
              );
            })}
          </svg>
          {(() => {
            const spikeCount = (D.Q4_EVENTS || []).length;
            const topTrend = [...trends].sort((a, b) => b.points[b.points.length - 1] - a.points[a.points.length - 1])[0];
            const lastIdx = topTrend ? topTrend.points.length - 1 : 0;
            const first = topTrend?.points[0] || 0;
            const last  = topTrend?.points[lastIdx] || 0;
            const delta = first > 0 ? Math.round((last / first - 1) * 100) : 0;
            return (
              <window.Insight>
                Phát hiện <b>{spikeCount}</b> tuần có volume vượt 1.5× trung bình.
                {topTrend && <> Topic dẫn đầu tháng cuối: <b>{topTrend.vn}</b> ({last.toLocaleString()} Lượt Thảo Luận, {delta >= 0 ? '+' : ''}{delta}% so với tháng đầu).</>}
              </window.Insight>
            );
          })()}
        </div>
      </div>

      {tt.node}
    </div>
  );
}
window.Q4 = Q4;
