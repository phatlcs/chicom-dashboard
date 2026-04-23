/* global React, D, window */

// Small horizontal bar list
function BarList({ rows, color, max, format = v => v }) {
  const m = max ?? Math.max(...rows.map(r => r.count || r.v || 0));
  return (
    <div>
      {rows.map((r, i) => {
        const val = r.count ?? r.v ?? 0;
        const c = color ?? r.color ?? 'var(--accent)';
        return (
          <div key={i} className="rowbar" style={{ gridTemplateColumns: '180px 1fr 48px' }}>
            <div className="rowbar-label" title={r.vn}>{r.vn}</div>
            <div className="rowbar-track">
              <div className="rowbar-fill" style={{ width: `${(val / m) * 100}%`, background: c }}></div>
            </div>
            <div className="rowbar-value">{format(val)}</div>
          </div>
        );
      })}
    </div>
  );
}
window.BarList = BarList;

function Donut({ data, valueKey = 'count', size = 200, inner = 60 }) {
  const total = data.reduce((a, b) => a + (b[valueKey] || 0), 0);
  let acc = 0;
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 6;
  const arc = (a0, a1) => {
    const large = a1 - a0 > 0.5 ? 1 : 0;
    const sx = cx + Math.cos(a0 * 2 * Math.PI - Math.PI / 2) * r;
    const sy = cy + Math.sin(a0 * 2 * Math.PI - Math.PI / 2) * r;
    const ex = cx + Math.cos(a1 * 2 * Math.PI - Math.PI / 2) * r;
    const ey = cy + Math.sin(a1 * 2 * Math.PI - Math.PI / 2) * r;
    const sx2 = cx + Math.cos(a1 * 2 * Math.PI - Math.PI / 2) * inner;
    const sy2 = cy + Math.sin(a1 * 2 * Math.PI - Math.PI / 2) * inner;
    const ex2 = cx + Math.cos(a0 * 2 * Math.PI - Math.PI / 2) * inner;
    const ey2 = cy + Math.sin(a0 * 2 * Math.PI - Math.PI / 2) * inner;
    return `M${sx},${sy} A${r},${r} 0 ${large} 1 ${ex},${ey} L${sx2},${sy2} A${inner},${inner} 0 ${large} 0 ${ex2},${ey2} Z`;
  };
  return (
    <svg width={size} height={size}>
      {data.map((d, i) => {
        const v = d[valueKey] || 0;
        const start = acc;
        acc += v / total;
        return <path key={i} d={arc(start, acc)} fill={d.color || 'var(--accent)'} />;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" className="mono" style={{ fontSize: 20, fontWeight: 600, fill: 'var(--text)' }}>{total}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="axis-tick" style={{ fontSize: 10 }}>total</text>
    </svg>
  );
}
window.Donut = Donut;

// ============ Q7 ============
function Q7() {
  const t = D.Q7_SENTIMENT;
  const sentData = [
    { vn: 'Positive', count: t.positive, color: 'oklch(0.62 0.15 155)' },
    { vn: 'Neutral', count: t.neutral, color: 'oklch(0.72 0.02 260)' },
    { vn: 'Negative', count: t.negative, color: 'oklch(0.60 0.20 25)' },
  ];
  return (
    <div className="grid-12">
      <div className="col-4">
        <div className="card">
          <div className="card-head"><div className="card-title">Top Chủ Đề Kêu Gọi / Hỗ Trợ <span className="en">join triggers</span></div></div>
          <BarList rows={D.Q7_TRIGGERS} color="oklch(0.62 0.15 155)" />
        </div>
      </div>
      <div className="col-4">
        <div className="card">
          <div className="card-head"><div className="card-title">Benefit Được Nhắc Nhiều <span className="en">top benefits</span></div></div>
          <BarList rows={D.Q7_BENEFITS} color="oklch(0.62 0.15 155)" />
        </div>
      </div>
      <div className="col-4">
        <div className="card">
          <div className="card-head"><div className="card-title">Phân Bố Sentiment <span className="en">of join-related posts</span></div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '10px 0' }}>
            <Donut data={sentData} size={180} inner={54} />
            <div style={{ flex: 1 }}>
              {sentData.map(s => (
                <div key={s.vn} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 }}>
                  <span style={{ width: 10, height: 10, background: s.color, borderRadius: 2 }}></span>
                  <span style={{ flex: 1 }}>{s.vn}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Q7 = Q7;

// ============ Q8 ============
function Q8() {
  const trend = D.Q8_TREND;
  const W = 640, H = 220, pad = { t: 16, r: 16, b: 28, l: 36 };
  const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;
  const max = Math.max(...trend.flatMap(d => [d.topicA, d.topicB, d.topicC, d.topicD]));
  const line = (key, color) => {
    const d = trend.map((p, i) => {
      const x = pad.l + (i / (trend.length - 1)) * pW;
      const y = pad.t + pH - (p[key] / max) * pH;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
    return <path d={d} fill="none" stroke={color} strokeWidth={1.8} />;
  };
  return (
    <div className="grid-12">
      <div className="col-5">
        <div className="card">
          <div className="card-head"><div className="card-title">Top Triggers rời Amazon <span className="en">top abandon triggers</span></div></div>
          <BarList rows={D.Q8_TRIGGERS} />
        </div>
      </div>
      <div className="col-4">
        <div className="card">
          <div className="card-head"><div className="card-title">Phân bố Persona <span className="en">abandoners by persona</span></div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
            <Donut data={D.Q8_PERSONA} size={180} inner={0} />
            <div style={{ flex: 1 }}>
              {D.Q8_PERSONA.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 5 }}>
                  <span style={{ width: 9, height: 9, background: p.color, borderRadius: 2 }}></span>
                  <span style={{ flex: 1 }}>{p.vn}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="col-3">
        <div className="card" style={{ padding: '14px 16px' }}>
          <div className="card-head"><div className="card-title">Xu hướng theo tháng</div></div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={pad.l} y1={pad.t + pH * f} x2={W - pad.r} y2={pad.t + pH * f} className="grid-line" />
            ))}
            {line('topicA', 'oklch(0.60 0.20 25)')}
            {line('topicB', 'oklch(0.68 0.17 55)')}
            {line('topicC', 'oklch(0.70 0.16 85)')}
            {line('topicD', 'oklch(0.62 0.15 155)')}
            {trend.map((p, i) => (
              <text key={i} x={pad.l + (i / (trend.length - 1)) * pW} y={H - 8} textAnchor="middle" className="axis-tick">{p.m.slice(5)}</text>
            ))}
          </svg>
        </div>
      </div>
      <div className="col-12">
        <div className="card">
          <div className="card-head"><div className="card-title">Top 8 Master Topics — Mentions rời bỏ Amazon</div></div>
          <svg width="100%" viewBox="0 0 900 240">
            {D.Q8_TOP_MT.map((t, i) => {
              const maxV = Math.max(...D.Q8_TOP_MT.map(x => x.count));
              const bw = 80, gap = 20, x0 = 30 + i * (bw + gap);
              const h = (t.count / maxV) * 160;
              return (
                <g key={i}>
                  <rect x={x0} y={190 - h} width={bw} height={h} fill={t.color} rx={3} />
                  <text x={x0 + bw / 2} y={190 - h - 6} textAnchor="middle" className="mono" style={{ fontSize: 11, fill: 'var(--text-2)' }}>{t.count}</text>
                  <text x={x0 + bw / 2} y={200} textAnchor="end" className="axis-tick" transform={`rotate(-35 ${x0 + bw / 2} 200)`}>{t.vn}</text>
                </g>
              );
            })}
            <line x1={20} y1={190} x2={880} y2={190} className="axis-line" />
          </svg>
        </div>
      </div>
    </div>
  );
}
window.Q8 = Q8;

// ============ Q9 placeholder ============
function Q9() {
  return (
    <div className="grid-12">
      <div className="col-12">
        <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
          <div className="card-title" style={{ marginBottom: 8, color: 'var(--text-2)' }}>Q9 placeholder</div>
          <div style={{ fontSize: 12 }}>Question & data not yet provided — graph will render here when available.</div>
        </div>
      </div>
    </div>
  );
}
window.Q9 = Q9;

// ============ Q10 — product categories ============
function Q10() {
  const cats = D.Q10_CATEGORIES;
  const maxC = Math.max(...cats.map(c => c.count));
  const trend = D.Q10_TREND;
  const W = 720, H = 240, pad = { t: 20, r: 20, b: 40, l: 30 };
  const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;
  const maxV = Math.max(...trend.flatMap(t => t.series.map(s => s.v)));
  return (
    <div className="grid-12">
      <div className="col-5">
        <div className="card">
          <div className="card-head"><div className="card-title">Top 10 Ngành hàng — Q4 2025 <span className="en">most-discussed product categories</span></div></div>
          <div>
            {cats.map((c, i) => (
              <div key={i} className="rowbar" style={{ gridTemplateColumns: '220px 1fr 42px' }}>
                <div className="rowbar-label">{c.vn}</div>
                <div className="rowbar-track"><div className="rowbar-fill" style={{ width: `${(c.count / maxC) * 100}%`, background: c.color }}></div></div>
                <div className="rowbar-value">{c.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-7">
        <div className="card">
          <div className="card-head"><div className="card-title">Xu hướng theo Tuần — Top 8 Ngành hàng <span className="en">weekly trend, top 8</span></div></div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={pad.l} y1={pad.t + pH * f} x2={W - pad.r} y2={pad.t + pH * f} className="grid-line" />
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7].map(si => {
              const pts = trend.map((tp, i) => {
                const x = pad.l + (i / (trend.length - 1)) * pW;
                const y = pad.t + pH - (tp.series[si].v / maxV) * pH;
                return [x, y];
              });
              const color = trend[0].series[si].color;
              const name = trend[0].series[si].name;
              const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
              // area under line
              const areaD = d + ` L${pts[pts.length - 1][0]},${pad.t + pH} L${pts[0][0]},${pad.t + pH} Z`;
              return (
                <g key={si}>
                  <path d={areaD} fill={color} opacity={0.12} />
                  <path d={d} stroke={color} fill="none" strokeWidth={1.5} />
                </g>
              );
            })}
            {trend.map((tp, i) => i % 2 === 0 && (
              <text key={i} x={pad.l + (i / (trend.length - 1)) * pW} y={H - 12} textAnchor="middle" className="axis-tick">{tp.w.slice(5)}</text>
            ))}
          </svg>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, fontSize: 10, marginTop: 6 }}>
            {trend[0].series.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-2)' }}>
                <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }}></span>
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.Q10 = Q10;
