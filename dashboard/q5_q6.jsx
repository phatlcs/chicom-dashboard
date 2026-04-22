/* global React, D, window */

// ============ Q5 + Q6 — Negative subtopics by day-of-week × hour-of-day ============
function Q56() {
  const tt = window.useTooltip();
  const daily = D.Q5_BY_DAY;
  const hourly = D.Q6_BY_HOUR;
  const heatmap = D.Q56_HEATMAP;
  const maxHeat = Math.max(...heatmap.flat());
  const maxDay = Math.max(...daily.map(d => d.count));
  const maxHour = Math.max(...hourly.map(d => d.count));
  const maxTop = Math.max(...D.Q5_TOP_NEG.map(t => t.count));

  // Donut for Q5 early-morning distribution
  const earlyTotal = D.Q5_EARLY_DIST.reduce((a, b) => a + b.slot, 0);
  let donutAcc = 0;
  const donutSeg = D.Q5_EARLY_DIST.map((t, i) => {
    const frac = t.slot / earlyTotal;
    const start = donutAcc;
    donutAcc += frac;
    return { ...t, start, end: donutAcc, color: `oklch(0.${65 - i * 5} 0.14 ${25 + i * 8})` };
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
      {/* Day of week bar */}
      <div className="col-4">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Phân Bố Theo Ngày Trong Tuần <span className="en">— by day of week</span></div>
            </div>
            <span className="card-meta mono">Q5</span>
          </div>
          <svg width="100%" viewBox="0 0 320 220">
            {daily.map((d, i) => {
              const x = 32 + i * 38;
              const barH = (d.count / maxDay) * 160;
              return (
                <g key={d.day}
                  onMouseEnter={e => tt.show(e, `<b>${d.day}</b> (${d.en})<br/>${d.count} negative mentions`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }}>
                  <rect x={x} y={180 - barH} width={28} height={barH} fill="var(--neg)" rx={2} opacity={0.85} />
                  <text x={x + 14} y={195} textAnchor="middle" className="axis-tick">{d.day}</text>
                  <text x={x + 14} y={180 - barH - 4} textAnchor="middle" className="mono" style={{ fontSize: 10, fill: 'var(--text-2)' }}>{d.count}</text>
                </g>
              );
            })}
            <line x1={20} y1={180} x2={300} y2={180} className="axis-line" />
          </svg>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            Peak: <b style={{ color: 'var(--text)' }}>{daily.slice().sort((a, b) => b.count - a.count)[0].day} / {daily.slice().sort((a, b) => b.count - a.count)[0].en}</b>
          </div>
        </div>
      </div>

      {/* Hour of day */}
      <div className="col-8">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Phân Bố Theo Giờ (Giờ VN) <span className="en">— by hour of day</span></div>
            </div>
            <span className="card-meta mono">Q6</span>
          </div>
          <svg width="100%" viewBox="0 0 680 220">
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={30} y1={30 + 150 * f} x2={660} y2={30 + 150 * f} className="grid-line" />
            ))}
            <path
              d={hourly.map((d, i) => {
                const x = 30 + (i / 23) * 630;
                const y = 180 - (d.count / maxHour) * 150;
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
              }).join(' ')}
              fill="none" stroke="var(--neg)" strokeWidth={1.8}
            />
            <path
              d={
                hourly.map((d, i) => {
                  const x = 30 + (i / 23) * 630;
                  const y = 180 - (d.count / maxHour) * 150;
                  return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                }).join(' ') + ` L${30 + 630},180 L30,180 Z`
              }
              fill="var(--neg)" opacity={0.1}
            />
            {hourly.map((d, i) => {
              const x = 30 + (i / 23) * 630;
              const y = 180 - (d.count / maxHour) * 150;
              return (
                <circle key={i} cx={x} cy={y} r={3} fill="var(--neg)"
                  onMouseEnter={e => tt.show(e, `<b>${d.hour}h</b><br/>${d.count} mentions`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
              );
            })}
            {[0, 4, 8, 12, 16, 20, 23].map(h => (
              <text key={h} x={30 + (h / 23) * 630} y={200} textAnchor="middle" className="axis-tick">{h}h</text>
            ))}
            {/* highlight peak band 2–6am */}
            <rect x={30 + (2 / 23) * 630} y={30} width={(4 / 23) * 630} height={150} fill="var(--neg)" opacity={0.06} />
            <text x={30 + (4 / 23) * 630} y={26} textAnchor="middle" className="axis-tick" style={{ fill: 'var(--neg)', fontSize: 10 }}>
              2h–6h peak
            </text>
          </svg>
        </div>
      </div>

      {/* Heatmap day × hour */}
      <div className="col-8">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Bản Đồ Nhiệt — Ngày × Giờ <span className="en">day-of-week × hour</span></div>
            </div>
            <div className="legend legend-bins">
              {['Thấp', 'Trung bình', 'Cao'].map((l, i) => (
                <span key={l} className="legend">
                  <span className="legend-swatch" style={{ background: window.heatColor((i + 1) / 3, 'rose') }}></span>
                  {l}
                </span>
              ))}
            </div>
          </div>
          <svg width="100%" viewBox="0 0 680 230">
            {D.DAYS_VN.map((d, di) => (
              <text key={d} x={24} y={38 + di * 26} textAnchor="end" className="axis-tick">{d}</text>
            ))}
            {D.DAYS_VN.map((d, di) => (
              Array.from({ length: 24 }, (_, h) => {
                const v = heatmap[di][h];
                const intensity = Math.pow(v / maxHeat, 0.6);
                return (
                  <rect key={`${d}-${h}`}
                    x={34 + h * 26} y={28 + di * 26}
                    width={24} height={22}
                    fill={window.heatColor(intensity, 'rose')}
                    rx={2}
                    onMouseEnter={e => tt.show(e, `<b>${d} · ${h}h</b><br/>${v} mentions`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })
            ))}
            {[0, 4, 8, 12, 16, 20, 23].map(h => (
              <text key={h} x={34 + h * 26 + 12} y={220} textAnchor="middle" className="axis-tick">{h}</text>
            ))}
          </svg>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            Highest concentration: <b style={{ color: 'var(--text)' }}>Mon–Fri, 2h–6h</b> — matches US business-day when sellers find account issues overnight VN time.
          </div>
        </div>
      </div>

      {/* Top 6 negative topics */}
      <div className="col-4">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Top 6 Chủ Đề Tiêu Cực <span className="en">— most frequent negative topics</span></div>
            </div>
          </div>
          <div>
            {D.Q5_TOP_NEG.map(t => (
              <div key={t.vn} className="rowbar" style={{ gridTemplateColumns: '1fr 60px' }}
                onMouseEnter={e => tt.show(e, `<b>${t.vn}</b><br/>${t.count} negative mentions`)}
                onMouseMove={tt.move} onMouseLeave={tt.hide}>
                <div>
                  <div style={{ fontSize: 11, marginBottom: 4, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.vn}</div>
                  <div className="rowbar-track">
                    <div className="rowbar-fill" style={{ width: `${(t.count / maxTop) * 100}%`, background: 'var(--neg)' }}></div>
                  </div>
                </div>
                <div className="rowbar-value">{t.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Donut — Mon-Fri 2-6 AM distribution */}
      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Mon–Fri 2h–6h: Topic Distribution <span className="en">negative mentions in peak window</span></div>
            </div>
            <span className="card-meta mono">{earlyTotal} mentions in peak window</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
            <svg width={220} height={220}>
              {donutSeg.map((s, i) => (
                <path key={s.vn}
                  d={arc(110, 110, 90, 60, s.start, s.end)}
                  fill={s.color}
                  onMouseEnter={e => tt.show(e, `<b>${s.vn}</b><br/>${s.slot} mentions · ${Math.round((s.slot / earlyTotal) * 100)}%`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide}
                  style={{ cursor: 'pointer' }}
                />
              ))}
              <text x={110} y={106} textAnchor="middle" className="mono" style={{ fontSize: 22, fontWeight: 600, fill: 'var(--text)' }}>{earlyTotal}</text>
              <text x={110} y={124} textAnchor="middle" className="axis-tick" style={{ fontSize: 10 }}>peak window</text>
            </svg>
            <div style={{ flex: 1 }}>
              {donutSeg.map(s => (
                <div key={s.vn} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }}></span>
                  <span style={{ flex: 1 }}>{s.vn}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{s.slot}</span>
                  <span className="mono" style={{ width: 42, textAlign: 'right', color: 'var(--text-2)' }}>{Math.round((s.slot / earlyTotal) * 100)}%</span>
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
window.Q56 = Q56;
