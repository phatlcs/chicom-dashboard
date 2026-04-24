/* global React, D, window */

// ============ Shared helpers ============

// SVG donut-arc path — used by the Q6 peak-hour breakdown.
function _arc(cx, cy, r, r2, a0, a1) {
  const large = a1 - a0 > 0.5 ? 1 : 0;
  const sx  = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r;
  const sy  = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r;
  const ex  = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r;
  const ey  = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r;
  const sx2 = cx + Math.cos(a1 * Math.PI * 2 - Math.PI / 2) * r2;
  const sy2 = cy + Math.sin(a1 * Math.PI * 2 - Math.PI / 2) * r2;
  const ex2 = cx + Math.cos(a0 * Math.PI * 2 - Math.PI / 2) * r2;
  const ey2 = cy + Math.sin(a0 * Math.PI * 2 - Math.PI / 2) * r2;
  return `M${sx},${sy} A${r},${r} 0 ${large} 1 ${ex},${ey} L${sx2},${sy2} A${r2},${r2} 0 ${large} 0 ${ex2},${ey2} Z`;
}

// ============ Q5 — Negative by day-of-week ============

// Single weekday bar chart — used for SOA, EC, or global view.
function DayBar({ daily, title, badge, chartId, tt }) {
  const maxDay = Math.max(1, ...daily.map(d => d.count));
  const topDay = [...daily].sort((a, b) => b.count - a.count)[0] || { day: '—', en: '—', count: 0 };
  return (
    <div className="card">
      <div className="card-head">
        <div><div className="card-title">{title} {badge}</div></div>
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
        Cao điểm: <b style={{ color: 'var(--text)' }}>{topDay.day} / {topDay.en}</b> ({topDay.count.toLocaleString()})
      </div>
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );
}

// Single top-neg-topics row-bar list.
function TopNegTopics({ items, title, badge, chartId, tt }) {
  const maxTop = Math.max(1, ...items.map(t => t.count));
  return (
    <div className="card">
      <div className="card-head">
        <div><div className="card-title">{title} {badge}</div></div>
      </div>
      <div>
        {items.map(t => (
          <div key={t.vn} className="rowbar" style={{ gridTemplateColumns: '1fr 60px' }}
            onMouseEnter={e => tt.show(e, `<b>${t.vn}</b><br/>${t.count} mentions tiêu cực`)}
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
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );
}

function Q5() {
  const tt = window.useTooltip();
  const hasSplit = D.Q5_BY_DAY_SOA && D.Q5_BY_DAY_EC && D.Q5_TOP_NEG_SOA && D.Q5_TOP_NEG_EC;

  const daily  = D.Q5_BY_DAY;
  const topDay = [...daily].sort((a, b) => b.count - a.count)[0] || { day: '—', count: 0 };
  const topNeg = D.Q5_TOP_NEG[0] || { vn: '—', count: 0 };

  const soaBadge = <span className="badge soa">SOA</span>;
  const ecBadge  = <span className="badge ec">EC</span>;

  return (
    <div className="grid-12">
      {hasSplit ? (
        <>
          <div className="col-6">
            <DayBar daily={D.Q5_BY_DAY_SOA} title="Ngày Trong Tuần" badge={soaBadge} chartId="Q5_1" tt={tt} />
          </div>
          <div className="col-6">
            <DayBar daily={D.Q5_BY_DAY_EC} title="Ngày Trong Tuần" badge={ecBadge} chartId="Q5_3" tt={tt} />
          </div>
          <div className="col-6">
            <TopNegTopics items={D.Q5_TOP_NEG_SOA} title="Top Chủ Đề Tiêu Cực" badge={soaBadge} chartId="Q5_2" tt={tt} />
          </div>
          <div className="col-6">
            <TopNegTopics items={D.Q5_TOP_NEG_EC} title="Top Chủ Đề Tiêu Cực" badge={ecBadge} chartId="Q5_4" tt={tt} />
          </div>
        </>
      ) : (
        <>
          <div className="col-6">
            <DayBar daily={daily} title="Phân Bố Theo Ngày Trong Tuần" chartId="Q5_1" tt={tt} />
          </div>
          <div className="col-6">
            <TopNegTopics items={D.Q5_TOP_NEG} title="Top 6 Chủ Đề Tiêu Cực" chartId="Q5_2" tt={tt} />
          </div>
        </>
      )}

      <div style={{ marginTop: 12, gridColumn: '1 / -1' }}>
        <window.Insight qId="Q5">
          Ngày cao nhất: <b>{topDay.day}</b> ({topDay.count.toLocaleString()} mentions tiêu cực) ·
          Topic tiêu cực hàng đầu: <b>{topNeg.vn}</b> ({topNeg.count.toLocaleString()}).
        </window.Insight>
      </div>

      {tt.node}
    </div>
  );
}
window.Q5 = Q5;


// ============ Q6 — Negative by hour-of-day ============

// Single hour-line chart — used for SOA, EC, or global view. Peak-window
// band comes from the global `peakWindow` (shared band across all segments).
function HourLine({ hourly, title, badge, chartId, peakWindow, tt }) {
  const maxHour = Math.max(1, ...hourly.map(d => d.count));
  const pw = peakWindow;
  return (
    <div className="card">
      <div className="card-head">
        <div><div className="card-title">{title} {badge}</div></div>
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
              onMouseEnter={e => tt.show(e, `<b>${d.hour}h</b><br/>${d.count} bài`)}
              onMouseMove={tt.move} onMouseLeave={tt.hide} style={{ cursor: 'pointer' }} />
          );
        })}
        {[0, 4, 8, 12, 16, 20, 23].map(h => (
          <text key={h} x={30 + (h / 23) * 630} y={200} textAnchor="middle" className="axis-tick">{h}h</text>
        ))}
        {pw && pw.windowSize > 0 && (() => {
          const bands = [];
          if (pw.startHour + pw.windowSize <= 24) {
            bands.push([pw.startHour, pw.windowSize]);
          } else {
            bands.push([pw.startHour, 24 - pw.startHour]);
            bands.push([0, pw.windowSize - (24 - pw.startHour)]);
          }
          return (
            <>
              {bands.map(([s, w], i) => (
                <rect key={i} x={30 + (s / 23) * 630} y={30} width={(w / 23) * 630} height={150} fill="var(--neg)" opacity={0.06} />
              ))}
              <text x={30 + ((pw.startHour + pw.windowSize / 2) / 23) * 630} y={26} textAnchor="middle" className="axis-tick" style={{ fill: 'var(--neg)', fontSize: 10 }}>
                {pw.startHour}h–{pw.endHour}h cao điểm
              </text>
            </>
          );
        })()}
      </svg>
      {chartId && <window.CardComments chartId={chartId} />}
    </div>
  );
}

function Q6() {
  const tt = window.useTooltip();
  const heatmap = D.Q56_HEATMAP;
  const maxHeat = Math.max(1, ...heatmap.flat());
  const hourly  = D.Q6_BY_HOUR;
  const topHour = [...hourly].sort((a, b) => b.count - a.count)[0] || { hour: 0, count: 0 };
  const pw      = D.Q5_PEAK_WINDOW;

  const hasSplit = D.Q6_BY_HOUR_SOA && D.Q6_BY_HOUR_EC;

  // Donut for peak-window distribution (stays cross-cutting / combined)
  const earlyTotal = D.Q5_EARLY_DIST.reduce((a, b) => a + b.slot, 0);
  let donutAcc = 0;
  const donutSeg = D.Q5_EARLY_DIST.map((t, i) => {
    const frac = t.slot / earlyTotal;
    const start = donutAcc;
    donutAcc += frac;
    return { ...t, start, end: donutAcc, color: `oklch(0.${65 - i * 5} 0.14 ${25 + i * 8})` };
  });

  const soaBadge = <span className="badge soa">SOA</span>;
  const ecBadge  = <span className="badge ec">EC</span>;

  return (
    <div className="grid-12">
      {hasSplit ? (
        <>
          <div className="col-6">
            <HourLine hourly={D.Q6_BY_HOUR_SOA} title="Giờ Trong Ngày" badge={soaBadge} chartId="Q6_1" peakWindow={pw} tt={tt} />
          </div>
          <div className="col-6">
            <HourLine hourly={D.Q6_BY_HOUR_EC}  title="Giờ Trong Ngày" badge={ecBadge}  chartId="Q6_4" peakWindow={pw} tt={tt} />
          </div>
        </>
      ) : (
        <div className="col-12">
          <HourLine hourly={hourly} title="Phân Bố Theo Giờ (Giờ VN)" chartId="Q6_1" peakWindow={pw} tt={tt} />
        </div>
      )}

      {/* Heatmap day × hour */}
      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Bản Đồ Nhiệt — Ngày × Giờ</div>
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
                    onMouseEnter={e => tt.show(e, `<b>${d} · ${h}h</b><br/>${v} bài`)}
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
            {pw && pw.windowSize > 0
              ? <>Khung cao điểm: <b style={{ color: 'var(--text)' }}>T2–CN, {pw.startHour}h–{pw.endHour}h</b> — {pw.totalMentions.toLocaleString()} mentions tiêu cực trong {pw.windowSize} giờ này.</>
              : <>Chưa đủ dữ liệu để phát hiện khung cao điểm.</>}
          </div>
        
        <window.CardComments chartId="Q6_2" />
      </div>
      </div>

      {/* Donut — peak window distribution */}
      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">
                Khung giờ cao điểm tiêu cực (T2–CN, {pw ? `${pw.startHour}h–${pw.endHour}h` : '—'}) — phân bố chủ đề
              </div>
            </div>
            <span className="card-meta mono">
              {(pw && pw.totalMentions) || earlyTotal} mentions trong khung cao điểm
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
            <svg width={220} height={220}>
              {donutSeg.map((s) => (
                <path key={s.vn}
                  d={_arc(110, 110, 90, 60, s.start, s.end)}
                  fill={s.color}
                  onMouseEnter={e => tt.show(e, `<b>${s.vn}</b><br/>${s.slot} mentions · ${Math.round((s.slot / earlyTotal) * 100)}%`)}
                  onMouseMove={tt.move} onMouseLeave={tt.hide}
                  style={{ cursor: 'pointer' }}
                />
              ))}
              <text x={110} y={106} textAnchor="middle" className="mono" style={{ fontSize: 22, fontWeight: 600, fill: 'var(--text)' }}>{earlyTotal}</text>
              <text x={110} y={124} textAnchor="middle" className="axis-tick" style={{ fontSize: 10 }}>khung cao điểm</text>
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
        
        <window.CardComments chartId="Q6_3" />
      </div>
      </div>

      <div style={{ marginTop: 12, gridColumn: '1 / -1' }}>
        <window.Insight qId="Q6">
          Giờ cao nhất: <b>{topHour.hour}h</b> ({topHour.count.toLocaleString()} mentions tiêu cực).
          {pw && pw.windowSize > 0 && <> Khung cao điểm auto-detect: <b>{pw.startHour}h–{pw.endHour}h</b> ({pw.totalMentions.toLocaleString()} mentions).</>}
        </window.Insight>
      </div>

      {tt.node}
    </div>
  );
}
window.Q6 = Q6;
