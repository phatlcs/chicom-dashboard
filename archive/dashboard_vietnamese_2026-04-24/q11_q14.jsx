/* global React, D, window */

// ============ Q11 — Tool adoption ============
function Q11() {
  const tools = D.Q11_TOOLS;
  const maxUse = Math.max(...tools.map(t => t.use));
  const maxIss = Math.max(...tools.map(t => Math.max(t.sat, t.iss)));
  const W = 720, H = 260, pad = { t: 20, r: 20, b: 80, l: 40 };
  const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;
  const bw = pW / tools.length;

  return (
    <div className="grid-12">
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Tool Usage Volume <span className="en">Amazon solutions adoption</span></div></div>
          <div>
            {tools.map((t, i) => (
              <div key={i} className="rowbar" style={{ gridTemplateColumns: '180px 1fr 48px' }}>
                <div className="rowbar-label">{t.vn}</div>
                <div className="rowbar-track"><div className="rowbar-fill" style={{ width: `${(t.use / maxUse) * 100}%`, background: 'oklch(0.58 0.15 240)' }}></div></div>
                <div className="rowbar-value">{t.use}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Satisfaction vs Issues <span className="en">per tool</span></div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: 'oklch(0.62 0.15 155)' }}></span>Satisfied</span>
              <span><span className="dot" style={{ background: 'oklch(0.60 0.20 25)' }}></span>Issues</span>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={pad.l} y1={pad.t + pH * f} x2={W - pad.r} y2={pad.t + pH * f} className="grid-line" />
            ))}
            {tools.map((t, i) => {
              const x0 = pad.l + i * bw + 4;
              const satH = (t.sat / maxIss) * pH;
              const issH = (t.iss / maxIss) * pH;
              const innerBw = (bw - 8) / 2 - 2;
              return (
                <g key={i}>
                  <rect x={x0} y={pad.t + pH - satH} width={innerBw} height={satH} fill="oklch(0.62 0.15 155)" rx={2} />
                  <rect x={x0 + innerBw + 2} y={pad.t + pH - issH} width={innerBw} height={issH} fill="oklch(0.60 0.20 25)" rx={2} />
                  <text x={x0 + innerBw + 1} y={pad.t + pH + 10} textAnchor="end" className="axis-tick"
                    transform={`rotate(-40 ${x0 + innerBw + 1} ${pad.t + pH + 10})`}>{t.vn}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Top Issues Across Tools <span className="en">pain points</span></div></div>
          <div>
            {D.Q11_ISSUES.map((r, i) => (
              <div key={i} className="rowbar" style={{ gridTemplateColumns: '180px 1fr 42px' }}>
                <div className="rowbar-label">{r.vn}</div>
                <div className="rowbar-track"><div className="rowbar-fill" style={{ width: `${(r.count / D.Q11_ISSUES[0].count) * 100}%`, background: 'oklch(0.60 0.20 25)' }}></div></div>
                <div className="rowbar-value">{r.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Top Satisfaction Factors <span className="en">positive drivers</span></div></div>
          <div>
            {D.Q11_SAT.map((r, i) => (
              <div key={i} className="rowbar" style={{ gridTemplateColumns: '180px 1fr 42px' }}>
                <div className="rowbar-label">{r.vn}</div>
                <div className="rowbar-track"><div className="rowbar-fill" style={{ width: `${(r.count / D.Q11_SAT[0].count) * 100}%`, background: 'oklch(0.62 0.15 155)' }}></div></div>
                <div className="rowbar-value">{r.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.Q11 = Q11;

// ============ Q12 — 3rd-party services ============
function Q12() {
  const svs = D.Q12_SERVICES;
  const maxM = Math.max(...svs.flatMap(s => [s.mentions, s.need]));
  const maxD = Math.max(...svs.map(s => s.demand));
  const W = 520, H = 260, pad = { t: 20, r: 20, b: 60, l: 30 };
  const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;
  const bw = pW / svs.length;
  // donut
  const donut = svs.map((s, i) => ({ vn: s.vn, count: s.demand, color: window.TOPIC_COLORS[i] }));

  return (
    <div className="grid-12">
      <div className="col-4">
        <div className="card" style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div className="card-head"><div className="card-title">Key Insights — 3rd Party Services</div></div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="badge" style={{ background: 'oklch(0.95 0.03 155)', color: 'oklch(0.45 0.14 155)', borderColor: 'oklch(0.85 0.06 155)' }}>Highest demand</span>
              <div style={{ marginTop: 4 }}>Review Service (91.8%), Product Sourcing (54.9%), Software/Tools (53.4%)</div>
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="badge">Most discussed</span>
              <div style={{ marginTop: 4 }}>Accountant/Tax (171), Legal/Trademark (108), Listing Optimization (107)</div>
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="badge" style={{ background: 'oklch(0.95 0.03 260)', color: 'oklch(0.45 0.14 260)', borderColor: 'oklch(0.85 0.06 260)' }}>Best satisfaction</span>
              <div style={{ marginTop: 4 }}>Photography (100%), Legal/Trademark (91.8%), Product Sourcing (78.9%)</div>
            </li>
            <li style={{ padding: '8px 0' }}>
              <span className="badge" style={{ background: 'oklch(0.97 0.02 25)', color: 'oklch(0.55 0.17 25)', borderColor: 'oklch(0.85 0.06 25)' }}>Common pain</span>
              <div style={{ marginTop: 4 }}>Slow / delay across all services</div>
            </li>
          </ul>
        </div>
      </div>
      <div className="col-4">
        <div className="card">
          <div className="card-head"><div className="card-title">Service Mentions vs Need <span className="en">demand vs discussion</span></div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: 'oklch(0.58 0.15 240)' }}></span>Mentions</span>
              <span><span className="dot" style={{ background: 'oklch(0.60 0.20 25)' }}></span>Need</span>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={pad.l} y1={pad.t + pH * f} x2={W - pad.r} y2={pad.t + pH * f} className="grid-line" />
            ))}
            {svs.map((s, i) => {
              const x0 = pad.l + i * bw + 4;
              const mH = (s.mentions / maxM) * pH;
              const nH = (s.need / maxM) * pH;
              const innerBw = (bw - 8) / 2 - 2;
              return (
                <g key={i}>
                  <rect x={x0} y={pad.t + pH - mH} width={innerBw} height={mH} fill="oklch(0.58 0.15 240)" rx={2} />
                  <rect x={x0 + innerBw + 2} y={pad.t + pH - nH} width={innerBw} height={nH} fill="oklch(0.60 0.20 25)" rx={2} />
                  <text x={x0 + innerBw + 1} y={pad.t + pH + 10} textAnchor="end" className="axis-tick"
                    transform={`rotate(-35 ${x0 + innerBw + 1} ${pad.t + pH + 10})`}>{s.vn}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="col-4">
        <div className="card">
          <div className="card-head"><div className="card-title">Demand % by Service</div></div>
          <div>
            {svs.map((s, i) => (
              <div key={i} className="rowbar" style={{ gridTemplateColumns: '160px 1fr 42px' }}>
                <div className="rowbar-label">{s.vn}</div>
                <div className="rowbar-track"><div className="rowbar-fill" style={{ width: `${(s.demand / maxD) * 100}%`, background: 'oklch(0.72 0.16 85)' }}></div></div>
                <div className="rowbar-value">{s.demand}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Satisfaction Scores</div></div>
          <div>
            {svs.map((s, i) => (
              <div key={i} className="rowbar" style={{ gridTemplateColumns: '160px 1fr 42px' }}>
                <div className="rowbar-label">{s.vn}</div>
                <div className="rowbar-track"><div className="rowbar-fill" style={{ width: `${s.sat}%`, background: 'oklch(0.62 0.15 155)' }}></div></div>
                <div className="rowbar-value">{s.sat}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">High Demand Services <span className="en">share of demand</span></div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0' }}>
            <window.Donut data={donut} size={180} inner={58} />
            <div style={{ flex: 1 }}>
              {donut.map(d => (
                <div key={d.vn} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 5 }}>
                  <span style={{ width: 9, height: 9, background: d.color, borderRadius: 2 }}></span>
                  <span style={{ flex: 1 }}>{d.vn}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{d.count}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Q12 = Q12;

// ============ Q13 — Courses ============
function Q13() {
  const c = D.Q13_COURSES;
  const maxMS = Math.max(...c.flatMap(x => [x.mentions, x.seeking]));
  const W = 420, H = 220, pad = { t: 20, r: 20, b: 60, l: 30 };
  const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;
  const bw = pW / c.length;
  const donut = c.map((x, i) => ({ vn: x.vn, count: x.mentions, color: window.TOPIC_COLORS[i] }));
  return (
    <div className="grid-12">
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Mentions vs Seeking <span className="en">courses discussion</span></div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: 'oklch(0.58 0.15 240)' }}></span>Mentions</span>
              <span><span className="dot" style={{ background: 'oklch(0.62 0.15 155)' }}></span>Seeking</span>
            </div>
          </div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
            {[0, 0.5, 1].map((f, i) => (
              <line key={i} x1={pad.l} y1={pad.t + pH * f} x2={W - pad.r} y2={pad.t + pH * f} className="grid-line" />
            ))}
            {c.map((x, i) => {
              const x0 = pad.l + i * bw + 6;
              const mH = (x.mentions / maxMS) * pH;
              const sH = (x.seeking / maxMS) * pH;
              const innerBw = (bw - 12) / 2 - 2;
              return (
                <g key={i}>
                  <rect x={x0} y={pad.t + pH - mH} width={innerBw} height={mH} fill="oklch(0.58 0.15 240)" rx={2} />
                  <rect x={x0 + innerBw + 2} y={pad.t + pH - sH} width={innerBw} height={sH} fill="oklch(0.62 0.15 155)" rx={2} />
                  <text x={x0 + innerBw} y={pad.t + pH + 10} textAnchor="end" className="axis-tick"
                    transform={`rotate(-30 ${x0 + innerBw} ${pad.t + pH + 10})`}>{x.vn}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Interest Level %</div></div>
          <div style={{ padding: '10px 0' }}>
            {c.map((x, i) => {
              const pct = Math.round((x.seeking / x.mentions) * 100);
              return (
                <div key={i} className="rowbar" style={{ gridTemplateColumns: '180px 1fr 42px' }}>
                  <div className="rowbar-label">{x.vn}</div>
                  <div className="rowbar-track"><div className="rowbar-fill" style={{ width: `${pct}%`, background: 'oklch(0.72 0.16 85)' }}></div></div>
                  <div className="rowbar-value">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Sentiment Analysis <span className="en">positive vs negative</span></div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: 'oklch(0.62 0.15 155)' }}></span>Positive</span>
              <span><span className="dot" style={{ background: 'oklch(0.60 0.20 25)' }}></span>Negative</span>
            </div>
          </div>
          <div style={{ padding: '10px 0' }}>
            {c.map((x, i) => {
              const total = x.sentPos + x.sentNeg;
              return (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{x.vn}</span>
                    <span className="mono" style={{ color: 'var(--text-3)' }}>+{x.sentPos} / −{x.sentNeg}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 3, overflow: 'hidden', display: 'flex', background: 'var(--panel-2)' }}>
                    <div style={{ width: `${(x.sentPos / total) * 100}%`, background: 'oklch(0.62 0.15 155)' }}></div>
                    <div style={{ width: `${(x.sentNeg / total) * 100}%`, background: 'oklch(0.60 0.20 25)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="col-6">
        <div className="card">
          <div className="card-head"><div className="card-title">Category Breakdown</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0' }}>
            <window.Donut data={donut} size={180} inner={56} />
            <div style={{ flex: 1 }}>
              {donut.map(d => (
                <div key={d.vn} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
                  <span style={{ width: 9, height: 9, background: d.color, borderRadius: 2 }}></span>
                  <span style={{ flex: 1 }}>{d.vn}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Q13 = Q13;

// ============ Q14 — Growth topics ============
function Q14() {
  const g = D.Q14_GROWTH;
  const sent = D.Q14_SENT;
  const maxSum = Math.max(...sent.map(s => s.seeking + s.positive + s.mixed + s.negative));
  const colors = {
    seeking: 'oklch(0.60 0.20 25)',
    positive: 'oklch(0.62 0.15 155)',
    mixed: 'oklch(0.72 0.16 85)',
    negative: 'oklch(0.55 0.04 260)',
  };
  return (
    <div className="grid-12">
      <div className="col-5">
        <div className="card">
          <div className="card-head"><div className="card-title">Growth Topics Distribution</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 0' }}>
            <window.Donut data={g} size={190} inner={60} />
            <div style={{ flex: 1 }}>
              {g.map(d => (
                <div key={d.vn} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
                  <span style={{ width: 9, height: 9, background: d.color, borderRadius: 2 }}></span>
                  <span style={{ flex: 1 }}>{d.vn}</span>
                  <span className="mono" style={{ color: 'var(--text-3)' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="col-7">
        <div className="card">
          <div className="card-head"><div className="card-title">Top 6 Topics Comparison</div></div>
          <div>
            {g.map((x, i) => (
              <div key={i} className="rowbar" style={{ gridTemplateColumns: '180px 1fr 42px' }}>
                <div className="rowbar-label">{x.vn}</div>
                <div className="rowbar-track"><div className="rowbar-fill" style={{ width: `${(x.count / g[0].count) * 100}%`, background: 'oklch(0.58 0.15 240)' }}></div></div>
                <div className="rowbar-value">{x.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Sentiment Breakdown by Growth Topic <span className="en">stacked: seeking / positive / mixed / negative</span></div>
            <div className="legend-inline">
              <span><span className="dot" style={{ background: colors.seeking }}></span>Seeking help</span>
              <span><span className="dot" style={{ background: colors.positive }}></span>Positive</span>
              <span><span className="dot" style={{ background: colors.mixed }}></span>Mixed</span>
              <span><span className="dot" style={{ background: colors.negative }}></span>Negative</span>
            </div>
          </div>
          <div style={{ padding: '10px 0' }}>
            {sent.map((s, i) => {
              const total = s.seeking + s.positive + s.mixed + s.negative;
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{s.vn}</span>
                    <span className="mono" style={{ color: 'var(--text-3)' }}>{total}</span>
                  </div>
                  <div style={{ height: 14, borderRadius: 3, overflow: 'hidden', display: 'flex', background: 'var(--panel-2)', width: `${(total / maxSum) * 100}%` }}>
                    <div style={{ width: `${(s.seeking / total) * 100}%`, background: colors.seeking }}></div>
                    <div style={{ width: `${(s.positive / total) * 100}%`, background: colors.positive }}></div>
                    <div style={{ width: `${(s.mixed / total) * 100}%`, background: colors.mixed }}></div>
                    <div style={{ width: `${(s.negative / total) * 100}%`, background: colors.negative }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
window.Q14 = Q14;
