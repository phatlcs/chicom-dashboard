// Sample data for ChiCom dashboard. User will replace with real data later.

// 9 master topic category colors — harmonized oklch
window.TOPIC_COLORS = [
  'oklch(0.62 0.15 260)', // indigo
  'oklch(0.62 0.15 25)',  // red
  'oklch(0.62 0.15 155)', // green
  'oklch(0.62 0.15 60)',  // amber
  'oklch(0.62 0.15 320)', // magenta
  'oklch(0.62 0.15 200)', // teal
  'oklch(0.62 0.15 90)',  // olive
  'oklch(0.62 0.15 290)', // purple
  'oklch(0.62 0.15 0)',   // crimson
];

window.ChiComData = (() => {
  const TC = window.TOPIC_COLORS;

  const SOA_GROUPS = [
    { id: 'soa1', name: 'Amazon Sellers Viet Nam', short: 'Amazon Sellers VN', type: 'SOA' },
    { id: 'soa2', name: 'Cộng đồng Amazon Sellers VN', short: 'CĐ Amazon Sellers', type: 'SOA' },
    { id: 'soa3', name: 'Cộng Đồng MMO', short: 'MMO', type: 'SOA' },
  ];
  const EC_GROUPS = [
    { id: 'ec1', name: 'Cuồng Phong Hội (CBEC)', short: 'Cuồng Phong Hội', type: 'EC' },
    { id: 'ec2', name: 'Cộng Đồng Dropshipping & Shopify VN', short: 'Dropship & Shopify', type: 'EC' },
    { id: 'ec3', name: 'Chuyện Nhà Bán (Shopee/TikTok)', short: 'Chuyện Nhà Bán', type: 'EC' },
  ];
  const ALL_GROUPS = [...SOA_GROUPS, ...EC_GROUPS];

  const MASTER_TOPICS = [
    { id: 'mt1', vn: 'Chiến lược, kinh nghiệm & hỗ trợ cộng đồng bán hàng', en: 'Strategy, experience & community support' },
    { id: 'mt2', vn: 'Cảnh báo rủi ro & lừa đảo khi kinh doanh Amazon', en: 'Risk warnings & fraud' },
    { id: 'mt3', vn: 'Vận hành và quản lý tài khoản Amazon Seller', en: 'Account operations & management' },
    { id: 'mt4', vn: 'Dịch vụ & giải pháp pháp lý, thương hiệu', en: 'Legal, branding & services' },
    { id: 'mt5', vn: 'Vận chuyển, logistics và fulfillment', en: 'Shipping, logistics & fulfillment' },
    { id: 'mt6', vn: 'Thanh toán, tài khoản và tài chính quốc tế', en: 'Payment, accounts & int\'l finance' },
    { id: 'mt7', vn: 'Kinh doanh xuất nhập khẩu & TMĐT xuyên biên giới', en: 'Import-export & cross-border' },
    { id: 'mt8', vn: 'Kinh doanh, vận hành và tối ưu hóa bán hàng Amazon', en: 'Business, ops & Amazon optimization' },
    { id: 'mt9', vn: 'Khóa học và thách thức kinh doanh Amazon', en: 'Courses & Amazon challenges' },
  ];

  const Q1_WEIGHTS = {
    mt1: { soa1: 42, soa2: 38, soa3: 18, ec1: 22, ec2: 15, ec3: 28 },
    mt2: { soa1: 31, soa2: 34, soa3: 12, ec1: 14, ec2: 9, ec3: 22 },
    mt3: { soa1: 28, soa2: 25, soa3: 8, ec1: 6, ec2: 4, ec3: 7 },
    mt4: { soa1: 18, soa2: 16, soa3: 5, ec1: 9, ec2: 7, ec3: 10 },
    mt5: { soa1: 15, soa2: 14, soa3: 22, ec1: 34, ec2: 28, ec3: 19 },
    mt6: { soa1: 12, soa2: 13, soa3: 14, ec1: 18, ec2: 11, ec3: 9 },
    mt7: { soa1: 9, soa2: 11, soa3: 16, ec1: 41, ec2: 24, ec3: 12 },
    mt8: { soa1: 22, soa2: 20, soa3: 6, ec1: 8, ec2: 6, ec3: 11 },
    mt9: { soa1: 8, soa2: 7, soa3: 28, ec1: 5, ec2: 38, ec3: 6 },
  };

  const Q1_MASTER = MASTER_TOPICS.map((mt, i) => {
    const vals = Object.values(Q1_WEIGHTS[mt.id]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { ...mt, weight: +avg.toFixed(1), color: TC[i] };
  }).sort((a, b) => b.weight - a.weight);

  const SUBTOPICS = {
    mt1: ['Chia sẻ chiến lược Amazon', 'Kinh nghiệm launch SP mới', 'Hỗ trợ seller mới bắt đầu', 'Networking seller VN'],
    mt2: ['Cảnh báo scam Amazon', 'Lừa đảo PPC agency', 'Rủi ro suspension', 'Phishing & hijack'],
    mt3: ['Tạo & verify tài khoản', 'Health score & metrics', 'Tool quản lý listing', 'Xử lý A-Z claim'],
    mt4: ['Brand registry', 'Kế toán US', 'Pháp lý LLC', 'Trademark & IP'],
    mt5: ['FBA vs FBM', 'Forwarder VN→US', 'Cước vận chuyển', 'Kho 3PL ở Mỹ'],
    mt6: ['Payoneer & tài khoản US', 'Thẻ Visa virtual', 'Quy đổi USD→VND', 'Hoàn thuế VAT EU'],
    mt7: ['TMĐT xuyên biên giới', 'Dropshipping CBEC', 'Nguồn hàng TQ', 'Thủ tục XNK'],
    mt8: ['PPC optimization', 'SEO listing', 'A/B test main image', 'Tối ưu CVR'],
    mt9: ['Khóa học mentor', 'Thử thách 30 ngày', 'Bootcamp PPC', 'Coaching 1-1'],
  };

  const PERSONAS = [
    { id: 'p_seller_az', short: 'Seller', segment: 'Amazon', vn: 'Seller (Amazon)' },
    { id: 'p_prospect_az', short: 'Prospect', segment: 'Amazon', vn: 'Prospect (Amazon)' },
    { id: 'p_svc_az', short: 'Service Provider', segment: 'Amazon', vn: 'Service Provider (Amazon)' },
    { id: 'p_svc_cbec', short: 'Service Provider', segment: 'CBEC', vn: 'Service Provider (CBEC)' },
    { id: 'p_prospect_ot', short: 'Prospect', segment: 'Others', vn: 'Prospect (Others)' },
    { id: 'p_seller_ot', short: 'Seller', segment: 'Others', vn: 'Seller (Others)' },
  ];

  const Q2_MATRIX = {
    mt1: { p_seller_az: 620, p_prospect_az: 380, p_svc_az: 95, p_svc_cbec: 60, p_prospect_ot: 210, p_seller_ot: 140 },
    mt2: { p_seller_az: 510, p_prospect_az: 290, p_svc_az: 40, p_svc_cbec: 35, p_prospect_ot: 180, p_seller_ot: 120 },
    mt3: { p_seller_az: 380, p_prospect_az: 95, p_svc_az: 135, p_svc_cbec: 25, p_prospect_ot: 40, p_seller_ot: 60 },
    mt4: { p_seller_az: 210, p_prospect_az: 105, p_svc_az: 280, p_svc_cbec: 95, p_prospect_ot: 55, p_seller_ot: 70 },
    mt5: { p_seller_az: 250, p_prospect_az: 160, p_svc_az: 220, p_svc_cbec: 175, p_prospect_ot: 140, p_seller_ot: 180 },
    mt6: { p_seller_az: 180, p_prospect_az: 140, p_svc_az: 90, p_svc_cbec: 110, p_prospect_ot: 95, p_seller_ot: 75 },
    mt7: { p_seller_az: 130, p_prospect_az: 90, p_svc_az: 75, p_svc_cbec: 320, p_prospect_ot: 210, p_seller_ot: 145 },
    mt8: { p_seller_az: 430, p_prospect_az: 185, p_svc_az: 105, p_svc_cbec: 50, p_prospect_ot: 95, p_seller_ot: 115 },
    mt9: { p_seller_az: 120, p_prospect_az: 340, p_svc_az: 45, p_svc_cbec: 30, p_prospect_ot: 280, p_seller_ot: 75 },
  };

  const Q3_SELLER_PROSPECT = MASTER_TOPICS.map(mt => {
    const seller = Q2_MATRIX[mt.id].p_seller_az + Q2_MATRIX[mt.id].p_seller_ot;
    const prospect = Q2_MATRIX[mt.id].p_prospect_az + Q2_MATRIX[mt.id].p_prospect_ot;
    return { id: mt.id, vn: mt.vn, en: mt.en, seller, prospect };
  });
  const sellerTotal = Q3_SELLER_PROSPECT.reduce((a, b) => a + b.seller, 0);
  const prospectTotal = Q3_SELLER_PROSPECT.reduce((a, b) => a + b.prospect, 0);
  Q3_SELLER_PROSPECT.forEach(r => {
    r.sellerPct = +(r.seller / sellerTotal * 100).toFixed(1);
    r.prospectPct = +(r.prospect / prospectTotal * 100).toFixed(1);
    r.diff = +(r.sellerPct - r.prospectPct).toFixed(1);
  });

  const SUBTOPIC_FLAT = [
    'Cảnh báo rủi ro & lừa đảo khi kinh doanh Amazon',
    'Kinh nghiệm & chiến lược bán hàng trên Amazon',
    'Dịch vụ & giải pháp pháp lý, thương hiệu',
    'Thuế và chi phí kinh doanh trên Amazon',
    'Khó khăn & thách thức khi bán hàng Amazon',
    'Dịch vụ hỗ trợ & tối ưu tài khoản',
    'Hợp tác, hỗ trợ & vận hành bán hàng',
    'Vấn đề xác minh, khoá, rủi ro tài khoản',
    'Sự kiện, đào tạo và kết nối cộng đồng',
    'Kinh doanh xuất nhập khẩu & quốc tế',
    'Dịch vụ vận chuyển và fulfillment',
    'Chia sẻ, học hỏi và hợp tác kinh nghiệm',
    'Hướng dẫn & hỗ trợ người mới bắt đầu',
    'Kinh doanh Amazon FBA và FBM',
    'Vấn đề & thủ tục thanh toán, mở OTP',
    'Bán hàng và vận hành Amazon',
    'Thanh toán Amazon qua Payoneer',
    'Vấn đề thanh toán quốc tế',
    'Ưu đãi Helium 10, tool seller Amazon',
  ];
  const Q3_SUBS = SUBTOPIC_FLAT.map((vn, i) => {
    const seed = (i * 13 + 7) % 17;
    const seller = +(6 + Math.sin(i * 1.3) * 4 + seed * 0.3).toFixed(1);
    const prospect = +(4 + Math.cos(i * 0.9) * 3 + seed * 0.25).toFixed(1);
    return { vn, seller: Math.max(0.2, seller), prospect: Math.max(0.2, prospect), diff: +(seller - prospect).toFixed(1) };
  });

  const MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'];
  const Q4_TRENDS = MASTER_TOPICS.map((mt, i) => {
    const baseArr = [120, 160, 200, 280, 240, 180, 140, 210, 90];
    const base = baseArr[i];
    const pts = MONTHS.map((m, j) => {
      const v = base * (0.7 + Math.sin((i + j) * 0.8) * 0.25 + j * 0.04);
      const spike = (mt.id === 'mt1' && j === 2) ? base * 0.8 : 0;
      return Math.max(10, Math.round(v + spike));
    });
    return { id: mt.id, vn: mt.vn, points: pts, color: TC[i] };
  });

  const WEEKS = Array.from({ length: 14 }, (_, i) => `W${i + 40}`);
  const Q4_EVENTS = [
    { week: 2, label: 'Prime Big Deal' },
    { week: 6, label: 'Black Friday' },
    { week: 7, label: 'Cyber Monday' },
    { week: 10, label: 'Boxing Day' },
  ];
  const Q4_WEEKLY = [
    { id: 'mt1', vn: 'Chiến lược & hỗ trợ', color: TC[0], points: [30, 35, 45, 80, 120, 180, 310, 290, 180, 120, 240, 120, 80, 70] },
    { id: 'mt2', vn: 'Cảnh báo rủi ro', color: TC[1], points: [20, 25, 30, 60, 90, 130, 230, 210, 130, 90, 180, 110, 60, 50] },
    { id: 'mt8', vn: 'Tối ưu bán hàng', color: TC[2], points: [15, 18, 22, 45, 70, 95, 150, 140, 95, 70, 130, 80, 50, 40] },
    { id: 'mt5', vn: 'Logistics', color: TC[3], points: [10, 12, 15, 30, 50, 70, 110, 100, 70, 50, 95, 60, 35, 28] },
  ];

  const DAYS_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // seeded pseudo-random so layout is stable on reload
  let seed = 42;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  const Q56_HEATMAP = DAYS_VN.map((d, dIdx) => {
    return Array.from({ length: 24 }, (_, h) => {
      let v = 0;
      if (dIdx <= 4 && h >= 2 && h <= 6) v = 55 + rand() * 35;
      else if (dIdx <= 4 && h >= 20 && h <= 23) v = 28 + rand() * 22;
      else if (h >= 8 && h <= 11) v = 12 + rand() * 18;
      else if (dIdx === 5 && h >= 3 && h <= 7) v = 20 + rand() * 15;
      else v = rand() * 12;
      return Math.round(v);
    });
  });

  const Q5_BY_DAY = DAYS_VN.map((d, i) => ({
    day: d, en: DAYS_EN[i], count: Q56_HEATMAP[i].reduce((a, b) => a + b, 0)
  }));

  const Q6_BY_HOUR = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: Q56_HEATMAP.reduce((sum, row) => sum + row[h], 0)
  }));

  const Q5_TOP_NEG = [
    { vn: 'Cảnh báo rủi ro và lừa đảo', count: 428 },
    { vn: 'Kinh nghiệm & chiến lược bán hàng', count: 165 },
    { vn: 'Khó khăn & thách thức bán hàng', count: 120 },
    { vn: 'Dịch vụ hỗ trợ & tối ưu tài khoản', count: 88 },
    { vn: 'Dịch vụ & giải pháp pháp lý', count: 62 },
    { vn: 'Thuế và chi phí kinh doanh', count: 41 },
  ];

  const Q5_EARLY_DIST = Q5_TOP_NEG.map((t, i) => ({
    ...t, slot: Math.round(t.count * (0.35 + (i % 3) * 0.08))
  }));

  // ============ Q7 — Join triggers & benefits ============
  const Q7_TRIGGERS = [
    { vn: 'Kinh nghiệm & chiến lược', en: 'Experience & strategy', count: 612 },
    { vn: 'Sự kiện, đào tạo & kết nối', en: 'Events & training', count: 240 },
    { vn: 'Hợp tác, hỗ trợ & vận hành', en: 'Collaboration & ops', count: 310 },
    { vn: 'Chia sẻ, học hỏi & trợ giúp', en: 'Sharing & learning', count: 180 },
    { vn: 'Bán hàng và vận hành', en: 'Selling & ops', count: 160 },
    { vn: 'Tăng thu nhập thụ động', en: 'Passive income', count: 110 },
  ];
  const Q7_BENEFITS = [
    { vn: 'Cơ hội thị trường', en: 'Market opportunity', count: 92 },
    { vn: 'Hỗ trợ đào tạo', en: 'Training support', count: 178 },
    { vn: 'Thành công', en: 'Success stories', count: 88 },
    { vn: 'Dễ bắt đầu', en: 'Easy to start', count: 140 },
    { vn: 'Passive income', en: 'Passive income', count: 54 },
  ];
  const Q7_SENTIMENT = { positive: 1840, neutral: 2210, negative: 380 };

  // ============ Q8 — Abandon signals ============
  const Q8_TRIGGERS = [
    { vn: 'Tài khoản bị khoá', en: 'Account suspension', count: 220, color: 'oklch(0.60 0.20 25)' },
    { vn: 'Thua lỗ / Chi phí cao', en: 'Losses / high cost', count: 165, color: 'oklch(0.68 0.17 55)' },
    { vn: 'Chính sách phức tạp', en: 'Complex policies', count: 95, color: 'oklch(0.70 0.16 85)' },
    { vn: 'Kiệt sức / Mất động lực', en: 'Burnout', count: 70, color: 'oklch(0.62 0.15 155)' },
    { vn: 'Cạnh tranh khốc liệt', en: 'Fierce competition', count: 58, color: 'oklch(0.65 0.14 200)' },
    { vn: 'Lừa đảo / Rủi ro lừa', en: 'Fraud / scam risk', count: 45, color: 'oklch(0.58 0.17 260)' },
    { vn: 'Khác', en: 'Other', count: 40, color: 'oklch(0.65 0.06 290)' },
    { vn: 'Con đường nhập ngành sai', en: 'Wrong entry path', count: 28, color: 'oklch(0.70 0.12 320)' },
    { vn: 'Thiếu kinh nghiệm / kỹ năng', en: 'Lack of experience', count: 22, color: 'oklch(0.72 0.10 20)' },
  ];
  const Q8_PERSONA = [
    { id: 'p_seller_az', vn: 'Seller (Amazon)', count: 520, color: 'oklch(0.60 0.20 25)' },
    { id: 'p_prospect_az', vn: 'Prospect (Amazon)', count: 180, color: 'oklch(0.68 0.17 55)' },
    { id: 'p_seller_ot', vn: 'Seller (Others)', count: 50, color: 'oklch(0.72 0.12 90)' },
    { id: 'p_svc_az', vn: 'Service Provider (Amazon)', count: 25, color: 'oklch(0.62 0.15 155)' },
    { id: 'p_prospect_ot', vn: 'Prospect (Others)', count: 18, color: 'oklch(0.58 0.17 260)' },
  ];
  const Q8_TREND = MONTHS.map((m, i) => ({
    m, topicA: Math.round(30 + Math.sin(i * 0.8) * 15 + i * 8),
    topicB: Math.round(20 + Math.cos(i * 0.7) * 10 + i * 3),
    topicC: Math.round(15 + Math.sin(i * 1.2) * 8),
    topicD: Math.round(10 + Math.cos(i * 0.9) * 5),
  }));
  const Q8_TOP_MT = [
    { vn: 'Cảnh báo rủi ro & lừa đảo', count: 180, color: 'oklch(0.60 0.20 25)' },
    { vn: 'Chi phí & thuế kinh doanh', count: 95, color: 'oklch(0.68 0.17 55)' },
    { vn: 'Vận hành tài khoản Amazon', count: 55, color: 'oklch(0.70 0.16 85)' },
    { vn: 'Vận chuyển & logistics', count: 40, color: 'oklch(0.62 0.15 155)' },
    { vn: 'Thanh toán quốc tế', count: 28, color: 'oklch(0.65 0.14 200)' },
    { vn: 'Pháp lý, thương hiệu', count: 22, color: 'oklch(0.58 0.17 260)' },
    { vn: 'Khóa học, đào tạo', count: 18, color: 'oklch(0.65 0.06 290)' },
    { vn: 'Chiến lược cộng đồng', count: 14, color: 'oklch(0.70 0.12 320)' },
  ];

  // ============ Q10 — Product categories ============
  const Q10_CATEGORIES = [
    { vn: 'Health & Beauty', count: 38, color: 'oklch(0.60 0.20 15)' },
    { vn: 'Apparel', count: 26, color: 'oklch(0.70 0.17 55)' },
    { vn: 'Home', count: 22, color: 'oklch(0.75 0.16 90)' },
    { vn: 'Groceries', count: 15, color: 'oklch(0.65 0.15 155)' },
    { vn: 'Furniture', count: 13, color: 'oklch(0.60 0.14 195)' },
    { vn: 'Health & Beauty / Supplements', count: 12, color: 'oklch(0.55 0.17 260)' },
    { vn: 'Coffee', count: 10, color: 'oklch(0.58 0.17 295)' },
    { vn: 'Toys', count: 9, color: 'oklch(0.65 0.17 340)' },
    { vn: 'Major Appliances', count: 7, color: 'oklch(0.70 0.10 30)' },
    { vn: 'Luggage', count: 5, color: 'oklch(0.60 0.14 230)' },
  ];
  const Q10_TREND = Array.from({ length: 12 }, (_, i) => ({
    w: `2025-W${40 + i}`,
    // map 8 categories to points
    series: Q10_CATEGORIES.slice(0, 8).map((c, ci) => ({
      name: c.vn, color: c.color,
      v: Math.max(0, Math.round(2 + Math.sin(i * 0.6 + ci) * 3 + (ci === 0 && i > 6 ? 10 : 0)))
    }))
  }));

  // ============ Q11 — Tool adoption ============
  const Q11_TOOLS = [
    { vn: 'FBA', use: 185, sat: 3, iss: 5 },
    { vn: 'Amazon Support', use: 148, sat: 1, iss: 8 },
    { vn: 'PPC/Ads', use: 128, sat: 2, iss: 5 },
    { vn: 'FBM', use: 92, sat: 1, iss: 1 },
    { vn: 'Brand Registry', use: 60, sat: 2, iss: 1 },
    { vn: 'Inventory Mgmt', use: 38, sat: 0, iss: 2 },
    { vn: 'Lightning Deal', use: 32, sat: 1, iss: 2 },
    { vn: 'Seller Central', use: 26, sat: 1, iss: 1 },
    { vn: 'Amazon Vine', use: 12, sat: 0, iss: 1 },
    { vn: 'Subscribe & Save', use: 8, sat: 0, iss: 0 },
  ];
  const Q11_ISSUES = [
    { vn: 'Claim A&Z lỗi', count: 38 },
    { vn: 'Support bot reply', count: 32 },
    { vn: 'PPC ngốn tiền', count: 28 },
    { vn: 'Lỗi listing', count: 22 },
    { vn: 'Rating trả lời sai', count: 15 },
    { vn: 'FBA pending long', count: 12 },
    { vn: 'Inbound error', count: 9 },
    { vn: 'Suspend oan', count: 6 },
  ];
  const Q11_SAT = [
    { vn: 'Dễ set up', count: 56 },
    { vn: 'Tracking tốt sẵn', count: 48 },
    { vn: 'Ổn định', count: 22 },
    { vn: 'Tăng doanh số', count: 14 },
  ];

  // ============ Q12 — 3rd-party services ============
  const Q12_SERVICES = [
    { vn: 'Accountant / Tax', mentions: 171, need: 45, sat: 88, demand: 28 },
    { vn: 'Legal / Trademark', mentions: 108, need: 32, sat: 91, demand: 32 },
    { vn: 'Listing Optimization', mentions: 107, need: 48, sat: 72, demand: 42 },
    { vn: 'Product Sourcing', mentions: 95, need: 62, sat: 65, demand: 54 },
    { vn: 'Software / Tools', mentions: 75, need: 38, sat: 70, demand: 53 },
    { vn: 'Freight Forwarder', mentions: 60, need: 24, sat: 68, demand: 35 },
  ];

  // ============ Q13 — Courses ============
  const Q13_COURSES = [
    { vn: 'Mentorship / Coaching', mentions: 220, seeking: 110, sentPos: 150, sentNeg: 25 },
    { vn: 'General Training', mentions: 180, seeking: 85, sentPos: 108, sentNeg: 18 },
    { vn: 'Listing Optimization', mentions: 110, seeking: 60, sentPos: 70, sentNeg: 8 },
    { vn: 'Amazon Course', mentions: 42, seeking: 22, sentPos: 18, sentNeg: 10 },
  ];

  // ============ Q14 — Growth topics ============
  const Q14_GROWTH = [
    { vn: 'Scaling Operations', count: 182, color: 'oklch(0.55 0.19 250)' },
    { vn: 'Marketing & Ads', count: 148, color: 'oklch(0.62 0.15 155)' },
    { vn: 'Automation & Tools', count: 120, color: 'oklch(0.72 0.16 85)' },
    { vn: 'Revenue Growth', count: 105, color: 'oklch(0.60 0.18 30)' },
    { vn: 'Team Building', count: 88, color: 'oklch(0.55 0.19 290)' },
    { vn: 'Market Expansion', count: 62, color: 'oklch(0.58 0.15 200)' },
  ];
  // sentiment breakdown (seeking help / positive / mixed / negative)
  const Q14_SENT = Q14_GROWTH.map(g => {
    const total = g.count;
    return {
      vn: g.vn,
      seeking: Math.round(total * 0.55),
      positive: Math.round(total * 0.18),
      mixed: Math.round(total * 0.17),
      negative: Math.round(total * 0.10),
    };
  });

  return {
    SOA_GROUPS, EC_GROUPS, ALL_GROUPS,
    MASTER_TOPICS, Q1_MASTER, Q1_WEIGHTS, SUBTOPICS,
    PERSONAS, Q2_MATRIX,
    Q3_SELLER_PROSPECT, Q3_SUBS,
    MONTHS, Q4_TRENDS, WEEKS, Q4_EVENTS, Q4_WEEKLY,
    DAYS_VN, DAYS_EN, Q56_HEATMAP, Q5_BY_DAY, Q6_BY_HOUR, Q5_TOP_NEG, Q5_EARLY_DIST,
    Q7_TRIGGERS, Q7_BENEFITS, Q7_SENTIMENT,
    Q8_TRIGGERS, Q8_PERSONA, Q8_TREND, Q8_TOP_MT,
    Q10_CATEGORIES, Q10_TREND,
    Q11_TOOLS, Q11_ISSUES, Q11_SAT,
    Q12_SERVICES,
    Q13_COURSES,
    Q14_GROWTH, Q14_SENT,
  };
})();
