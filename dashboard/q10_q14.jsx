/* global React, window */
const D2b = window.ChiComData2;

// ── Q10 — Top Product Categories (SOA / EC / Total) ─────────────────────────
// Source: AGS_Q1_2026_Top_Product_Categories.html. The CSV's `Product Category`
// column is null for 100% of rows, so this view is *inferred* — Q4 2025 PPTX
// benchmark for SOA + sub-group composition weighting for EC. Counts here are
// re-scaled from the analyst's pre-filter numbers (6,068 SOA / 40,568 EC /
// 46,636 grand) to the dashboard's post-filter totals (5,468 / 34,790 / 40,258).
// Percentages preserved. EC categories overlap (multi-classification) so the
// EC column-sum exceeds 100% by ~6.6% — methodology note explains.

const Q10_SOA_TOTAL = 5468;
const Q10_EC_TOTAL  = 34790;
const Q10_ALL_TOTAL = 40258;

const Q10_SOA = [
  { cat: 'Health & Beauty / Supplements', n: 1105, pct: 20.2, color: '#D85A30', sent: 'mix', sentL: 'Mixed',        ex: 'Skincare, supplements, collagen, essential oils' },
  { cat: 'Private Label (undisclosed)',   n: 820,  pct: 15.0, color: '#888780', sent: 'pos', sentL: 'Positive',     ex: 'Helium10-researched niches, kept confidential' },
  { cat: 'Apparel & Fashion',             n: 738,  pct: 13.5, color: '#7F77DD', sent: 'mix', sentL: 'Mixed',        ex: 'Private label clothing, Merch by Amazon' },
  { cat: 'Home & Garden',                 n: 569,  pct: 10.4, color: '#1D9E75', sent: 'mix', sentL: 'Mixed',        ex: 'Garden tools, organizers, small home items' },
  { cat: 'Electronics (China-sourced)',   n: 454,  pct: 8.3,  color: '#E24B4A', sent: 'mix', sentL: 'Mixed (risk)', ex: 'Bluetooth earphones, cables, phone accessories' },
  { cat: 'Other / Undisclosed',           n: 470,  pct: 8.6,  color: '#B4B2A9', sent: 'na',  sentL: '—',            ex: 'Various unidentified niches' },
  { cat: 'Toys & Games',                  n: 333,  pct: 6.1,  color: '#BA7517', sent: 'mix', sentL: 'Mixed',        ex: 'Educational toys, STEM kits, fidget products' },
  { cat: 'Kitchen & Home Goods',          n: 317,  pct: 5.8,  color: '#378ADD', sent: 'neu', sentL: 'Neutral',      ex: 'Kitchen gadgets, storage, small appliances' },
  { cat: 'Jewelry & Accessories',         n: 273,  pct: 5.0,  color: '#D4537E', sent: 'pos', sentL: 'Positive',     ex: 'Silver jewelry, watches, sunglasses' },
  { cat: 'Pet Products',                  n: 224,  pct: 4.1,  color: '#9F84D8', sent: 'pos', sentL: 'Positive',     ex: 'Pet accessories, toys, grooming, beds' },
  { cat: 'USDA Agricultural Products',    n: 164,  pct: 3.0,  color: '#639922', sent: 'em',  sentL: 'Emerging',     ex: 'Vietnamese coffee, cashews, spices, tea' },
];

const Q10_EC = [
  { cat: 'Handmade & Print-on-Demand', n: 8163, pct: 23.5, color: '#378ADD', sent: 'pos', sentL: 'Positive', ex: 'Embroidered caps, stickers, UV print, laser cut' },
  { cat: 'Apparel & Fashion',          n: 6201, pct: 17.8, color: '#7F77DD', sent: 'mix', sentL: 'Mixed',    ex: 'POD tees, hoodies, TikTok fashion, dropship' },
  { cat: 'Home Décor & Wall Art',      n: 5060, pct: 14.5, color: '#1D9E75', sent: 'mix', sentL: 'Mixed',    ex: 'Canvas prints, candles, macramé, wall art' },
  { cat: 'Jewelry & Accessories',      n: 4659, pct: 13.4, color: '#D4537E', sent: 'pos', sentL: 'Positive', ex: 'Personalized rings, memorial jewelry, wedding sets' },
  { cat: 'Health & Beauty',            n: 4250, pct: 12.2, color: '#D85A30', sent: 'mix', sentL: 'Mixed',    ex: 'Natural skincare, organic beauty, essential oils' },
  { cat: 'Personalized Gifts',         n: 2629, pct: 7.6,  color: '#BA7517', sent: 'pos', sentL: 'Positive', ex: 'Baby gifts, wedding gifts, name-engraved items' },
  { cat: 'Mother & Baby Products',     n: 2199, pct: 6.3,  color: '#639922', sent: 'pos', sentL: 'Positive', ex: 'Baby gift sets, newborn outfits, nursery décor' },
  { cat: 'Other / Undisclosed',        n: 1739, pct: 5.0,  color: '#B4B2A9', sent: 'na',  sentL: '—',        ex: 'Various unidentified categories' },
  { cat: 'Food & Beverages (CBEC)',    n: 1234, pct: 3.5,  color: '#63C5A0', sent: 'em',  sentL: 'Emerging', ex: 'Vietnamese coffee, specialty food, dried fruits' },
  { cat: 'Electronics & Tech Acc.',    n: 959,  pct: 2.8,  color: '#E24B4A', sent: 'mix', sentL: 'Mixed',    ex: 'Phone cases, cables, wireless accessories' },
];

const Q10_ALL = [
  { cat: 'Handmade & Print-on-Demand', n: 8218, pct: 20.4, color: '#378ADD', sent: 'pos', sentL: 'Positive', ex: 'EC-dominant. Etsy VN sellers — embroidered POD, custom print' },
  { cat: 'Apparel & Fashion',          n: 6950, pct: 17.3, color: '#7F77DD', sent: 'mix', sentL: 'Mixed',    ex: 'POD apparel (EC) + private label clothing (SOA)' },
  { cat: 'Health & Beauty',            n: 5337, pct: 13.3, color: '#D85A30', sent: 'mix', sentL: 'Mixed',    ex: 'Present in both groups — was Q4 2025 #1 overall' },
  { cat: 'Home Décor & Wall Art',      n: 5093, pct: 12.7, color: '#1D9E75', sent: 'mix', sentL: 'Mixed',    ex: 'EC-dominant — Etsy/Shopify canvas prints, candles' },
  { cat: 'Jewelry & Accessories',      n: 4951, pct: 12.3, color: '#D4537E', sent: 'pos', sentL: 'Positive', ex: 'Strong in both — Etsy jewelry (EC) + Amazon PL (SOA)' },
  { cat: 'Personalized Gifts',         n: 2646, pct: 6.6,  color: '#BA7517', sent: 'pos', sentL: 'Positive', ex: 'EC-dominant — Etsy baby/wedding/memorial gifts' },
  { cat: 'Mother & Baby Products',     n: 2213, pct: 5.5,  color: '#639922', sent: 'pos', sentL: 'Positive', ex: 'EC growing — Etsy baby + Shopee/TikTok baby category' },
  { cat: 'Other / Undisclosed',        n: 2202, pct: 5.5,  color: '#B4B2A9', sent: 'na',  sentL: '—',        ex: 'Various categories not specifically identified' },
  { cat: 'Food & Beverages (CBEC)',    n: 1242, pct: 3.1,  color: '#63C5A0', sent: 'em',  sentL: 'Emerging', ex: 'Vietnamese coffee, specialty foods, USDA items' },
  { cat: 'Electronics & Tech',         n: 965,  pct: 2.4,  color: '#E24B4A', sent: 'mix', sentL: 'Mixed',    ex: 'SOA China-sourced + EC dropship electronics' },
  { cat: 'Private Label (SOA only)',   n: 786,  pct: 2.0,  color: '#888780', sent: 'pos', sentL: 'Positive', ex: 'SOA-exclusive — sellers protect niche specifics' },
];

function Q10SentBadge({ sent, label }) {
  const styles = {
    pos: { background: 'oklch(0.92 0.06 155)', color: 'oklch(0.42 0.13 155)' },
    mix: { background: 'oklch(0.94 0.07 70)',  color: 'oklch(0.42 0.13 50)' },
    neg: { background: 'oklch(0.94 0.06 25)',  color: 'oklch(0.42 0.16 25)' },
    neu: { background: 'var(--panel-2)',       color: 'var(--text-2)' },
    em:  { background: 'oklch(0.94 0.06 250)', color: 'oklch(0.45 0.16 260)' },
    na:  { background: 'var(--panel-2)',       color: 'var(--text-3)' },
  };
  return (
    <span className="q10-sent" style={{
      ...styles[sent],
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
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
        gridTemplateColumns: '28px 1fr 1fr 64px 78px 92px',
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
        <span style={{ textAlign: 'right' }}>Sentiment</span>
      </div>
      <div>
        {data.map((d, i) => (
          <div key={d.cat} style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 1fr 64px 78px 92px',
            gap: 12, alignItems: 'center',
            padding: '11px 18px',
            borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? 'var(--text)' : 'var(--text-3)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }}></span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.cat}</span>
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.ex}
              </div>
            </div>
            <div className="rowbar-track" style={{ height: 6 }}>
              <div className="rowbar-fill" style={{ width: `${Math.max(2, Math.round(d.n / top * 100))}%`, background: d.color, height: '100%' }}></div>
            </div>
            <span className="mono" style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.pct}%</span>
            <span className="mono" style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-2)' }}>~{d.n.toLocaleString()}</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Q10SentBadge sent={d.sent} label={d.sentL} />
            </div>
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

const Q10_INSIGHTS_SOA = [
  { icon: '🏆', title: 'Health & Beauty leads (#1 — 20.2%)',     body: 'Carries over from Q4 2025 benchmark where it ranked #1. SOA sellers active in supplements (TPCN), skincare private label, and organic beauty. FDA compliance complexity is slowing entry for new sellers but existing players are growing.' },
  { icon: '🔒', title: 'Private Label at 15% — hidden signal',   body: 'Sellers use <strong>Helium10</strong> (104+ positive mentions in SOA) for product research but deliberately protect niche information publicly. The 15% Private Label estimate captures this intentional opacity — a positive signal for seller sophistication.' },
  { icon: '⚡', title: 'Electronics: high risk, still active',    body: 'China-sourced electronics (8.3%) discussed with concern in SOA group 1 — sellers ask about compliance risk with VN LLC accounts. Amazon IP and safety certification scrutiny is a recurring frustration driving mixed sentiment.' },
  { icon: '🌱', title: 'USDA Nông sản — Blue Ocean emerging',    body: 'Only 3.0% (~164 mentions) but <strong>fastest growing signal</strong> in SOA content text. Sellers researching Vietnamese coffee, cashew nuts, spices for US export. Very few active sellers = first-mover advantage window still open.' },
  { icon: '📦', title: 'Home & Garden stable at 10.4%',          body: '4th-largest SOA category. Sellers discuss Amazon FBM for large/heavy items vs FBA cost tradeoffs. Category cooling slightly vs Q4 due to higher storage fees in Q1 non-peak season.' },
  { icon: '💎', title: 'Jewelry: small but positive',            body: '5.0% (~273 mentions) with <strong>positive sentiment</strong> in SOA — sellers who crack jewelry find strong margins with Brand Registry protection. Low return rates compared to apparel. Growing interest in fine jewelry private label.' },
];

const Q10_INSIGHTS_EC = [
  { icon: '🏆', title: 'Handmade & POD dominates (#1 — 23.5%)',  body: 'Driven by Etsy Vietnam Community + Etsy To Go. VN sellers\' competitive advantage: low-cost embroidery workshops + light/small products ideal for ePacket. Fastest-growing category vs Q4.' },
  { icon: '👗', title: 'Apparel at 17.8% — TikTok/Shopee driven', body: 'Chuyện Nhà Bán (Shopee/TikTok) group drives the apparel discussion. Mix of domestic-first sellers transitioning to cross-border. Sentiment is mixed — competition from China sellers is a recurring frustration.' },
  { icon: '🪞', title: 'Home Décor #3 at 14.5%',                 body: 'Canvas prints, scented candles, macramé — products that overlap heavily with Etsy\'s US buyer demand for artisanal home goods. <strong>Pain point:</strong> large/fragile items complicate ePacket. Candles and small décor objects perform best.' },
  { icon: '💍', title: 'Jewelry #4 at 13.4% — strong positive',   body: '~4,659 mentions with <strong>positive sentiment</strong>. Etsy sellers find jewelry personalization (memorial, wedding, name-engraved) generates high repeat purchase rates and premium pricing. US buyers accept $40–$150 price points comfortably.' },
  { icon: '🎁', title: 'Personalized Gifts #6 at 7.6%',           body: 'Baby shower gifts (quà sơ sinh), wedding gifts, and memorial keepsakes dominate. Peak demand follows US seasonal calendar (Mother\'s Day, graduation, Christmas). VN sellers have strong customization capability and fast turnaround.' },
  { icon: '🌿', title: 'Food & Beverages emerging at 3.5%',       body: 'Vietnamese coffee, specialty snacks, dried fruits entering CBEC discussion. Driven by Cuồng Phong Hội (CBEC) and MMO groups researching USDA/FDA pathways. <strong>Opportunity:</strong> Made-in-Vietnam authenticity story resonates with US buyers.' },
];

const Q10_INSIGHTS_ALL = [
  { icon: '🥇', title: 'Handmade & POD leads total (20.4%)',     body: 'EC-exclusive — Etsy VN sellers drive ~8,218 mentions. Virtually absent in SOA. This is the most discussed product category by a clear margin, reflecting the dominant Etsy composition of EC groups.' },
  { icon: '🔁', title: '3 categories bridge both ecosystems',     body: '<strong>Health & Beauty</strong> (SOA #1, EC #5), <strong>Jewelry</strong> (SOA #9, EC #4), and <strong>Apparel</strong> (SOA #3, EC #2) are high-priority for both seller types — indicating cross-platform buyer demand that Amazon can leverage with targeted programs.' },
  { icon: '📊', title: 'EC dominates due to 6.4× volume',         body: 'With EC at 34,790 mentions vs SOA at 5,468, the Total ranking is EC-weighted. SOA-exclusive categories (Private Label, USDA Nông sản, Electronics-specific) appear at the bottom despite significant SOA-relative importance.' },
];

const Q10_METHODOLOGY = {
  soa: '',
  ec:  '<strong>⚠️ Methodology:</strong> EC product distribution weighted by sub-group composition — Etsy groups (50.4% of EC volume): ~45% Handmade/POD, ~25% Jewelry, ~20% Home/Gifts; Shopee/TikTok (30%): ~35% Apparel, ~25% Beauty; Dropshipping/Shopify (16%): ~30% Apparel, ~25% Home, ~20% Beauty. "Product Category" field is null across all 34,790 post-filter EC records. EC categories overlap by ~6.6% (multi-classified posts).',
  all: '<strong>⚠️ Methodology:</strong> "Product Category" field is null for all 40,258 post-filter records in Q1 2026. All figures are inferred estimates based on: (1) EC sub-group composition (Etsy 50.4%, Shopee/TikTok 30%, Shopify/Drop 16%); (2) Q4 2025 PPTX benchmark for SOA categories; (3) content-text keyword patterns; (4) SP partner-seeking posts mentioning specific product types. Figures represent estimated product-discussion mentions, not sales volume. Activating structured "Product Category" tagging from Q2 2026 is strongly recommended.',
};

function Q10InsightsGrid({ items, fullLastItem }) {
  return (
    <div className="grid-3" style={{ gap: 14, marginTop: 18 }}>
      {items.map((it, i) => (
        <div key={i} className="card" style={{
          padding: '16px 18px',
          gridColumn: fullLastItem && i === items.length - 1 ? '1 / -1' : 'auto',
        }}>
          <div style={{ fontSize: 16, marginBottom: 6 }}>{it.icon}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{it.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: it.body }} />
        </div>
      ))}
    </div>
  );
}

function Q10MethodologyNote({ text }) {
  if (!text) return null;
  return (
    <div style={{
      marginTop: 18, padding: '12px 16px',
      background: 'oklch(0.96 0.04 70 / 0.4)',
      border: '1px solid oklch(0.80 0.10 70)',
      borderRadius: 8, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6,
    }} dangerouslySetInnerHTML={{ __html: text }} />
  );
}

function Q10TabNav({ tab, setTab }) {
  const tabs = [
    { id: 'soa', label: 'SOA Groups', sub: '5,468', accent: 'oklch(0.55 0.17 25)' },
    { id: 'ec',  label: 'EC Groups',  sub: '34,790', accent: 'oklch(0.45 0.14 155)' },
    { id: 'all', label: 'Total',      sub: '40,258', accent: 'var(--accent)' },
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
            }}>{t.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function Q10() {
  const tt = window.useTooltip();
  const [tab, setTab] = React.useState('soa');

  const PANELS = {
    soa: {
      data: Q10_SOA, total: Q10_SOA_TOTAL,
      title: 'SOA Groups — Top Product Categories',
      subtitle: 'Amazon Sellers Viet Nam + Cộng đồng Amazon Sellers VN. Categories benchmarked from Q4 2025 PPTX report applied to Q1 SOA volume. Private Label (~15%) reflects Helium10 research activity without disclosed product names.',
      kpiTopLabel: 'Top Category', kpiTopVal: '20.2%', kpiTopSub: 'Health & Beauty',
      tableHeader: 'Ranked by % share of SOA mentions',
      donutHeader: 'Distribution (SOA)',
      insights: Q10_INSIGHTS_SOA,
    },
    ec: {
      data: Q10_EC, total: Q10_EC_TOTAL,
      title: 'EC Groups — Top Product Categories',
      subtitle: '7 groups weighted by composition: Etsy-focused (50.4%) skews handmade/POD/jewelry; Shopee/TikTok (30%) skews apparel/beauty; Dropshipping/Shopify (16%) spreads across home/fashion/electronics; CBEC/MMO (3.6%) cross-border general.',
      kpiTopLabel: 'Top Category', kpiTopVal: '23.5%', kpiTopSub: 'Handmade & POD',
      tableHeader: 'Ranked by % share of EC mentions',
      donutHeader: 'Distribution (EC)',
      insights: Q10_INSIGHTS_EC,
    },
    all: {
      data: Q10_ALL, total: Q10_ALL_TOTAL,
      title: 'Total Combined — Top Product Categories',
      subtitle: 'All 9 groups aggregated. EC (34,790) dominates the ranking due to 6.4× larger volume vs SOA (5,468). Three categories appear strongly in both groups: Health & Beauty, Jewelry, and Apparel — indicating genuine cross-platform demand.',
      kpiTopLabel: 'Cross-group cats', kpiTopVal: '3', kpiTopSub: 'Health · Jewelry · Apparel',
      tableHeader: 'Ranked by % share of all 40,258 mentions',
      donutHeader: 'Distribution (Total)',
      insights: Q10_INSIGHTS_ALL,
    },
  };
  const p = PANELS[tab];
  const totalAccent = tab === 'soa' ? 'oklch(0.55 0.17 25)'
                    : tab === 'ec'  ? 'oklch(0.45 0.14 155)'
                    : 'var(--accent)';

  return (
    <>
      <Q10TabNav tab={tab} setTab={setTab} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px', minWidth: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4, letterSpacing: '-0.3px' }}>{p.title}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', maxWidth: 640, lineHeight: 1.55, margin: 0 }}>{p.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div className="card" style={{ padding: '10px 14px', minWidth: 110, textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>
              {tab === 'all' ? 'Grand Total' : `${tab.toUpperCase()} Total`}
            </div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: totalAccent, lineHeight: 1 }}>{p.total.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>mentions</div>
          </div>
          <div className="card" style={{ padding: '10px 14px', minWidth: 130, textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>{p.kpiTopLabel}</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: totalAccent, lineHeight: 1 }}>{p.kpiTopVal}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{p.kpiTopSub}</div>
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
                <div className="card-head" style={{ padding: '12px 16px', color: 'oklch(0.55 0.17 25)' }}>
                  <div className="card-title">SOA Top 5 — Amazon Sellers</div>
                </div>
                <Q10MiniRows data={Q10_SOA} />
              </div>
            </div>
            <div className="col-6">
              <div className="card" style={{ padding: 0 }}>
                <div className="card-head" style={{ padding: '12px 16px', color: 'oklch(0.45 0.14 155)' }}>
                  <div className="card-title">EC Top 5 — Multi-platform Sellers</div>
                </div>
                <Q10MiniRows data={Q10_EC} />
              </div>
            </div>
          </>
        )}

        <div style={{ gridColumn: '1 / -1' }}>
          <Q10InsightsGrid items={p.insights} fullLastItem={tab === 'all'} />
          <Q10MethodologyNote text={Q10_METHODOLOGY[tab]} />
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
