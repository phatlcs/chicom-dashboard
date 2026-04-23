/* global React, D, window */
const { useState, useRef } = React;

// ============ Q1 ============
function Q1() {
  const tt = window.useTooltip();
  const q1 = D.Q1_MASTER;
  const maxW = Math.max(...q1.map(m => m.weight));
  const soaOrder = D.SOA_GROUPS;
  const ecOrder = D.EC_GROUPS;

  const TopicBars = () => (
    <div className="card" style={{ minHeight: 440 }}>
      <div className="card-head">
        <div>
          <div className="card-title">Trọng số chủ đề tổng thể</div>
        </div>
        <span className="card-meta">% đề cập · trung bình qua các nhóm</span>
      </div>
      <div>
        {q1.map((m, i) => (
          <div key={m.id} className="rowbar"
            onMouseEnter={e => tt.show(e, `<b>${m.vn}</b><br/>${m.en} · ${m.weight}%`)}
            onMouseMove={tt.move} onMouseLeave={tt.hide}
            style={{ gridTemplateColumns: '280px 1fr 48px' }}>
            <div className="rowbar-label" title={m.vn}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: m.color, marginRight: 8, verticalAlign: 'middle' }}></span>
              {m.vn}
            </div>
            <div className="rowbar-track">
              <div className="rowbar-fill" style={{ width: `${(m.weight / maxW) * 100}%`, background: m.color }}></div>
            </div>
            <div className="rowbar-value">{m.weight}%</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)' }}>
        {D.MASTER_TOPICS.length} chủ đề chính · {(D.KPI && D.KPI.subTopics) || 0} chủ đề phụ
      </div>
    </div>
  );

  const HeatGrid = ({ title, groups, accent }) => {
    const bins = [5, 10, 20, 30, 50];
    // Orientation: Master Topics as ROWS (full names, left), groups as COLUMNS (labels rotated at top)
    const cellW = 76;
    const cellH = 40;
    const rowGap = 4;
    const leftPad = 320;    // space for MT full names on the left
    const topPad = 140;     // space for rotated group labels at top
    const mts = D.MASTER_TOPICS;
    const svgHeight = topPad + mts.length * (cellH + rowGap) + 20;
    const svgWidth  = leftPad + groups.length * (cellW + 4) + 20;
    const cardMinHeight = svgHeight + 80;
    return (
      <div className="card" style={{ minHeight: cardMinHeight }}>
        <div className="card-head">
          <div>
            <div className="card-title">{title}</div>
          </div>
          <div className="legend legend-bins">
            {['0-5%', '5-10%', '10-20%', '20-30%', '30-50%'].map((label, i) => (
              <span key={label} className="legend">
                <span className="legend-swatch" style={{ background: window.heatColor((i + 1) / 5, accent) }}></span>
                {label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
            {/* Master Topic full names on the left (one row per MT) */}
            {mts.map((mt, mi) => {
              const y = topPad + mi * (cellH + rowGap) + cellH / 2 + 4;
              const label = mt.vn.length > 46 ? mt.vn.slice(0, 44) + '…' : mt.vn;
              return (
                <text key={mt.id} x={leftPad - 10} y={y}
                  textAnchor="end" className="axis-tick"
                  style={{ fontSize: 11, fill: 'var(--text-2)' }}>
                  <title>{mt.vn}</title>{label}
                </text>
              );
            })}
            {/* Group labels — rotated at the top, one per column */}
            {groups.map((g, gi) => {
              const x = leftPad + gi * (cellW + 4) + cellW / 2;
              const anchorY = topPad - 12;
              return (
                <text key={g.id} x={x} y={anchorY}
                  textAnchor="start" className="axis-tick"
                  style={{ fontSize: 11 }}
                  transform={`rotate(-45 ${x} ${anchorY})`}>
                  <title>{g.name}</title>{g.short}
                </text>
              );
            })}
            {/* Cells: MT × Group */}
            {mts.map((mt, mi) => (
              groups.map((g, gi) => {
                const v = D.Q1_WEIGHTS[mt.id][g.id];
                const fill = window.binColor(v, bins, accent);
                const x0 = leftPad + gi * (cellW + 4);
                const y0 = topPad + mi * (cellH + rowGap);
                return (
                  <g key={g.id + mt.id}
                    onMouseEnter={e => tt.show(e, `<b>${g.short}</b><br/>${mt.vn}<br/>${v}% đề cập`)}
                    onMouseMove={tt.move} onMouseLeave={tt.hide}
                    style={{ cursor: 'pointer' }}>
                    <rect x={x0} y={y0} width={cellW} height={cellH} fill={fill} rx={3} />
                    <text x={x0 + cellW / 2} y={y0 + cellH / 2 + 4}
                      textAnchor="middle" className="axis-tick"
                      pointerEvents="none"
                      style={{ fill: v > 20 ? 'white' : 'var(--text-2)', fontSize: 11, fontWeight: 500 }}>
                      {v}%
                    </text>
                  </g>
                );
              })
            ))}
          </svg>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
          {mts.length} chủ đề chính × {groups.length} nhóm · di chuột lên ô để xem chi tiết
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid-12">
        <div className="col-12"><TopicBars /></div>
      </div>
      <div className="grid-12" style={{ marginTop: 16, display: 'grid', gap: 16 }}>
        <div className="col-12">
          <HeatGrid
            title={<>Nhóm SOA — Trọng số chủ đề <span className="badge soa">{D.SOA_GROUPS.length} nhóm</span></>}
            groups={D.SOA_GROUPS}
            accent="rose"
          />
        </div>
        <div className="col-12">
          <HeatGrid
            title={<>Nhóm EC — Trọng số chủ đề <span className="badge ec">{D.EC_GROUPS.length} nhóm</span></>}
            groups={D.EC_GROUPS}
            accent="teal"
          />
        </div>
      </div>
      {tt.node}
    </>
  );
}
window.Q1 = Q1;

// ============ Q2 — Persona × Master Topic heatmap ============
function Q2() {
  const tt = window.useTooltip();
  const personas = D.PERSONAS;
  const mts = D.MASTER_TOPICS;
  const max = Math.max(...mts.flatMap(mt => personas.map(p => D.Q2_MATRIX[mt.id][p.id])));

  const cellW = 96, cellH = 42;
  const leftPad = 340;
  const topPad = 120;  // extra room for rotated persona labels
  const w = leftPad + personas.length * cellW + 20;
  const h = topPad + mts.length * cellH + 20;

  const bins = ['0–50', '51–150', '151–300', '301–500', '500+'];

  return (
    <div className="grid-12">
      <div className="col-12">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Master Topics theo Persona</div>
            </div>
            <div className="legend legend-bins">
              {bins.map((label, i) => (
                <span key={label} className="legend">
                  <span className="legend-swatch" style={{ background: window.heatColor((i + 1) / 5, 'indigo') }}></span>
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <svg width={w} height={h} style={{ display: 'block' }}>
              {personas.map((p, pi) => {
                const x = leftPad + pi * cellW + cellW / 2;
                // Steeper rotation + bigger anchor offset so the rotated label
                // doesn't overlap the first row of cells
                const anchorY = topPad - 14;
                const label = p.vn.length > 22 ? p.vn.slice(0, 21) + '…' : p.vn;
                return (
                  <g key={p.id}>
                    <text x={x} y={anchorY}
                      textAnchor="start" className="axis-tick"
                      style={{ fontSize: 11 }}
                      transform={`rotate(-45 ${x} ${anchorY})`}>
                      <title>{p.vn}</title>{label}
                    </text>
                  </g>
                );
              })}
              {mts.map((mt, mi) => (
                <g key={mt.id}>
                  <text x={leftPad - 12} y={topPad + mi * cellH + cellH / 2 + 4}
                    textAnchor="end" className="axis-tick" style={{ fontSize: 11, fill: 'var(--text-2)' }}>
                    {mt.vn.length > 48 ? mt.vn.slice(0, 46) + '…' : mt.vn}
                  </text>
                  {personas.map((p, pi) => {
                    const v = D.Q2_MATRIX[mt.id][p.id];
                    const intensity = Math.pow(v / max, 0.7);
                    return (
                      <g key={p.id}>
                        <rect
                          x={leftPad + pi * cellW + 3}
                          y={topPad + mi * cellH + 3}
                          width={cellW - 6} height={cellH - 6}
                          fill={window.heatColor(intensity, 'indigo')}
                          rx={3}
                          onMouseEnter={e => tt.show(e, `<b>${p.vn}</b> × ${mt.vn.slice(0, 36)}…<br/>${v} mentions`)}
                          onMouseMove={tt.move} onMouseLeave={tt.hide}
                          style={{ cursor: 'pointer' }}
                        />
                        <text
                          x={leftPad + pi * cellW + cellW / 2}
                          y={topPad + mi * cellH + cellH / 2 + 4}
                          textAnchor="middle"
                          className="mono"
                          style={{ fontSize: 11, fill: intensity > 0.45 ? 'white' : 'var(--text-2)' }}>
                          {v}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
      {tt.node}
    </div>
  );
}
window.Q2 = Q2;
