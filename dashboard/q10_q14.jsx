/* global React, window */
const D2b = window.ChiComData2;

// Q10 — Product categories
function Q10() {
  const tt = window.useTooltip();
  const { Q10_TOP, Q10_WEEKS, Q10_WEEKLY } = D2b;
  const maxTop = Math.max(...Q10_TOP.map(c => c.count));
  const WW = 720, WH = 260, wpad = { t: 20, r: 120, b: 30, l: 40 };
  const wPlotW = WW - wpad.l - wpad.r, wPlotH = WH - wpad.t - wpad.b;
  const maxWeek = Math.max(...Q10_WEEKLY.flatMap(w => w.points));

  return (
    <div className="grid-12">
      <div className="col-5">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Top 10 Ngành Hàng — Q4 2025</div>
          </div>
          <HBars items={Q10_TOP} labelKey="name" valueKey="count" tooltip={tt} />
        </div>
      </div>
      <div className="col-7">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Xu hướng theo Tuần — Top 8 ngành hàng</div>
          </div>
          <svg width="100%" viewBox={`0 0 ${WW} ${WH}`}>
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={wpad.l} y1={wpad.t + wPlotH * f} x2={WW - wpad.r} y2={wpad.t + wPlotH * f} className="grid-line" />
            ))}
            {Q10_WEEKLY.map((t, ti) => {
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
        </div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <window.Insight qId="Q10">
          Ngành hàng dẫn đầu: <b>{Q10_TOP[0]?.name || '—'}</b> ({Q10_TOP[0]?.count.toLocaleString() || 0} Lượt Thảo Luận) ·
          Top-3: {Q10_TOP.slice(0, 3).map(c => c.name).join(', ')}.
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
          <div className="card-head"><div className="card-title">Mức sử dụng Tools</div></div>
          <HBars items={Q11_TOOLS.map(t => ({ ...t, color: 'var(--accent)' }))} labelKey="name" valueKey="use" tooltip={tt} />
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Hài lòng vs Vấn đề (theo tool)</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: green }}></span>Hài lòng</span>
              <span><span className="dot" style={{ background: red }}></span>Vấn đề</span>
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
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Top vấn đề phổ biến</div></div>
          <HBars items={Q11_ISSUES.map(t => ({ ...t, color: red }))} labelKey="name" valueKey="count" tooltip={tt} />
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Top yếu tố hài lòng</div></div>
          <HBars items={Q11_SATISFACTION.map(t => ({ ...t, color: green }))} labelKey="name" valueKey="count" tooltip={tt} />
        </div>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <window.Insight qId="Q11">
          Tool được dùng nhiều nhất: <b>{Q11_TOOLS[0]?.name || '—'}</b> (use {Q11_TOOLS[0]?.use.toLocaleString() || 0}, satisfied {Q11_TOOLS[0]?.satisfied || 0}, issues {Q11_TOOLS[0]?.issues || 0}) ·
          Vấn đề hàng đầu: <b>{Q11_ISSUES[0]?.name || '—'}</b> ({Q11_ISSUES[0]?.count.toLocaleString() || 0}) ·
          Yếu tố hài lòng hàng đầu: <b>{Q11_SATISFACTION[0]?.name || '—'}</b> ({Q11_SATISFACTION[0]?.count.toLocaleString() || 0}).
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
  const maxM = Math.max(...Q12_SERVICES.flatMap(s => [s.mentions, s.need]));
  const W = 640, H = 260, pad = { t: 20, r: 20, b: 50, l: 30 };
  const cellW = (W - pad.l - pad.r) / Q12_SERVICES.length;
  const blue = 'oklch(0.58 0.14 190)', red = 'oklch(0.60 0.20 25)';

  return (
    <div className="grid-12">
      <div className="col-12">
        <div className="card">
          <div className="card-head"><div className="card-title">Dịch vụ bên thứ ba — Tổng quan</div></div>
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
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Đề cập vs Nhu cầu</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: blue }}></span>Tổng đề cập</span>
              <span><span className="dot" style={{ background: red }}></span>Đang tìm</span>
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
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">% Nhu cầu theo dịch vụ</div></div>
          <HBars items={Q12_SERVICES.map(s => ({ name: s.name, count: s.demand, color: 'oklch(0.75 0.17 75)' }))} tooltip={tt} />
        </div>
      </div>
      {(() => {
        const topDemand = [...Q12_SERVICES].sort((a, b) => b.demand - a.demand)[0];
        const topMent = Q12_SERVICES[0];
        const topSat = [...Q12_SERVICES].sort((a, b) => b.satisfaction - a.satisfaction)[0];
        return (
          <div style={{ gridColumn: '1 / -1' }}>
            <window.Insight qId="Q12">
              Dịch vụ được đề cập nhiều nhất: <b>{topMent?.name || '—'}</b> ({topMent?.mentions.toLocaleString() || 0} Lượt Thảo Luận) ·
              Cầu cao nhất: <b>{topDemand?.name || '—'}</b> ({topDemand?.demand || 0}% demand) ·
              Hài lòng nhất: <b>{topSat?.name || '—'}</b> ({topSat?.satisfaction || 0}%).
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
  const maxMS = Math.max(...Q13_COURSES.flatMap(c => [c.mentions, c.seeking]));
  const blue = 'oklch(0.58 0.14 190)', green = 'oklch(0.62 0.15 155)', red = 'oklch(0.60 0.20 25)';
  const W = 520, H = 240, pad = { t: 20, r: 20, b: 70, l: 30 };
  const cellW = (W - pad.l - pad.r) / Q13_COURSES.length;

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
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Đề cập vs Tìm kiếm</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: blue }}></span>Đề cập</span>
              <span><span className="dot" style={{ background: green }}></span>Tìm kiếm</span>
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
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">% Mức độ quan tâm</div></div>
          <HBars items={Q13_COURSES.map(c => ({ name: c.name, count: c.interest, color: 'oklch(0.75 0.17 75)' }))} tooltip={tt} />
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Phân tích Sentiment</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: green }}></span>Tích cực</span>
              <span><span className="dot" style={{ background: red }}></span>Tiêu cực</span>
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
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Phân loại khóa học</div></div>
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
        </div>
      </div>
      {(() => {
        const topCourse = Q13_COURSES[0];
        const topSeeking = [...Q13_COURSES].sort((a, b) => b.seeking - a.seeking)[0];
        const topPositive = [...Q13_COURSES].sort((a, b) => b.positive - a.positive)[0];
        return (
          <div style={{ gridColumn: '1 / -1' }}>
            <window.Insight qId="Q13">
              Khóa được nhắc nhiều nhất: <b>{topCourse?.name || '—'}</b> ({topCourse?.mentions.toLocaleString() || 0}) ·
              Tìm kiếm nhiều nhất: <b>{topSeeking?.name || '—'}</b> ({topSeeking?.seeking || 0} Lượt Thảo Luận chủ động hỏi) ·
              Sentiment tích cực nhất: <b>{topPositive?.name || '—'}</b> (+{topPositive?.positive || 0}).
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
  const total = Q14_GROWTH.reduce((a, b) => a + b.count, 0);
  const maxG = Math.max(...Q14_GROWTH.map(g => g.count));
  let acc = 0;
  const seg = Q14_GROWTH.map(g => {
    const start = acc; acc += g.count / total;
    return { ...g, start, end: acc };
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

  const red = 'oklch(0.60 0.20 25)', green = 'oklch(0.62 0.15 155)',
        yellow = 'oklch(0.75 0.17 75)', gray = 'oklch(0.70 0.02 260)';

  return (
    <div className="grid-12">
      <div className="col-5">
        <div className="card">
          <div className="card-head"><div className="card-title">Phân bố chủ đề Tăng trưởng</div></div>
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
        </div>
      </div>
      <div className="col-7">
        <div className="card">
          <div className="card-head"><div className="card-title">So sánh Top 6 chủ đề</div></div>
          <HBars items={Q14_GROWTH.map(g => ({ name: g.name, count: g.count, color: 'var(--accent)' }))} tooltip={tt} />
        </div>
      </div>
      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Sentiment theo chủ đề tăng trưởng</div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: red }}></span>Cần hỗ trợ</span>
              <span><span className="dot" style={{ background: green }}></span>Tích cực</span>
              <span><span className="dot" style={{ background: yellow }}></span>Trung tính</span>
              <span><span className="dot" style={{ background: gray }}></span>Tiêu cực</span>
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
        </div>
      </div>
      {(() => {
        const topGrowth = Q14_GROWTH[0];
        const mostPositive = [...Q14_GROWTH].sort((a, b) => b.positive - a.positive)[0];
        const mostSeeking = [...Q14_GROWTH].sort((a, b) => b.seeking - a.seeking)[0];
        return (
          <div style={{ gridColumn: '1 / -1' }}>
            <window.Insight qId="Q14">
              Chủ đề tăng trưởng dẫn đầu: <b>{topGrowth?.name || '—'}</b> ({topGrowth?.count.toLocaleString() || 0} Lượt Thảo Luận) ·
              Sentiment tích cực nhất: <b>{mostPositive?.name || '—'}</b> (+{mostPositive?.positive || 0}) ·
              Seller cần hỗ trợ nhiều nhất về: <b>{mostSeeking?.name || '—'}</b> ({mostSeeking?.seeking || 0} Lượt Thảo Luận chủ động hỏi).
            </window.Insight>
          </div>
        );
      })()}
      {tt.node}
    </div>
  );
}
window.Q14 = Q14;
