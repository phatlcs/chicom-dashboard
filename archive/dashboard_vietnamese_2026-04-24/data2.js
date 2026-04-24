/* Q7–Q14 sample data */
window.ChiComData2 = (() => {
  // Q7 — Topics that encourage sellers to join + benefits + sentiment
  const Q7_TOPICS = [
    { vn: 'Kinh nghiệm & chiến lược', count: 612 },
    { vn: 'Sự kiện, đào tạo & kết nối', count: 340 },
    { vn: 'Hợp tác, hỗ trợ & vận hành', count: 295 },
    { vn: 'Chia sẻ, học hỏi & trợ giúp', count: 240 },
    { vn: 'Bán hàng & vận hành', count: 195 },
    { vn: 'Thách thức 30 ngày launch', count: 120 },
  ];
  const Q7_BENEFITS = [
    { vn: 'Cơ hội thị trường', en: 'Market opportunity', count: 180 },
    { vn: 'Hỗ trợ & đào tạo', en: 'Training & support', count: 210 },
    { vn: 'Thành công', en: 'Success stories', count: 125 },
    { vn: 'Dễ bắt đầu', en: 'Easy to start', count: 165 },
    { vn: 'Passive income', en: 'Passive income', count: 55 },
  ];
  const Q7_SENTIMENT = { positive: 62, neutral: 28, negative: 10 };

  // Q8 — abandonment signals
  const Q8_TRIGGERS = [
    { vn: 'Tài khoản bị khóa', count: 210, color: 'oklch(0.60 0.20 25)' },
    { vn: 'Thua lỗ / chi phí cao', count: 168, color: 'oklch(0.70 0.17 60)' },
    { vn: 'Chính sách phức tạp', count: 95, color: 'oklch(0.70 0.17 60)' },
    { vn: 'Kiệt sức / mất động lực', count: 72, color: 'oklch(0.62 0.15 155)' },
    { vn: 'Cạnh tranh khốc liệt', count: 58, color: 'oklch(0.60 0.20 25)' },
    { vn: 'Lừa đảo / rủi ro tổ lừa', count: 40, color: 'oklch(0.60 0.20 25)' },
    { vn: 'Khác', count: 28, color: 'oklch(0.75 0.05 260)' },
    { vn: 'Con đường nhật hàng', count: 22, color: 'oklch(0.55 0.17 260)' },
    { vn: 'Thiếu kinh nghiệm', count: 18, color: 'oklch(0.55 0.17 260)' },
  ];
  const Q8_PERSONA = [
    { label: 'Seller (Amazon)', count: 410, color: 'oklch(0.60 0.20 25)' },
    { label: 'Prospect (Amazon)', count: 120, color: 'oklch(0.70 0.17 60)' },
    { label: 'Seller (Others)', count: 45, color: 'oklch(0.62 0.15 260)' },
    { label: 'Service Provider (Amazon)', count: 30, color: 'oklch(0.62 0.15 155)' },
    { label: 'Prospect (Others)', count: 18, color: 'oklch(0.62 0.15 320)' },
  ];
  const Q8_TREND = [18, 28, 52, 95, 140, 175, 165, 130, 85, 55, 42]; // months

  // Q9 — entry barriers (inferred)
  const Q9_BARRIERS = [
    { vn: 'Vốn ban đầu', en: 'Capital', count: 240 },
    { vn: 'Xác minh tài khoản', en: 'Account verification', count: 205 },
    { vn: 'Thiếu kiến thức', en: 'Knowledge gap', count: 185 },
    { vn: 'Tiếng Anh / giao tiếp', en: 'English barrier', count: 140 },
    { vn: 'Vận chuyển quốc tế', en: 'Int\'l shipping', count: 125 },
    { vn: 'Thuế & pháp lý', en: 'Tax & legal', count: 95 },
    { vn: 'Chọn sản phẩm', en: 'Product selection', count: 82 },
    { vn: 'Thanh toán quốc tế', en: 'Payment', count: 60 },
  ];

  // Q10 — Product categories Q4 2025
  const Q10_TOP = [
    { name: 'Health & Beauty', count: 38, color: 'oklch(0.60 0.20 25)' },
    { name: 'Apparel', count: 26, color: 'oklch(0.68 0.17 50)' },
    { name: 'Home', count: 22, color: 'oklch(0.75 0.17 90)' },
    { name: 'Groceries', count: 15, color: 'oklch(0.62 0.15 155)' },
    { name: 'Furniture', count: 12, color: 'oklch(0.58 0.14 190)' },
    { name: 'Coffee', count: 10, color: 'oklch(0.55 0.17 290)' },
    { name: 'Toys', count: 9, color: 'oklch(0.60 0.20 320)' },
    { name: 'Major Appliances', count: 7, color: 'oklch(0.55 0.15 230)' },
    { name: 'Luggage', count: 5, color: 'oklch(0.55 0.17 260)' },
  ];
  const Q10_WEEKS = Array.from({ length: 16 }, (_, i) => `W${i + 40}`);
  const Q10_WEEKLY = Q10_TOP.slice(0, 7).map((c, ci) => ({
    name: c.name, color: c.color,
    points: Array.from({ length: 16 }, (_, i) => {
      return Math.max(0.5, Math.sin((i + ci * 2) * 0.6) * 4 + c.count * 0.2 + Math.cos(i * 0.4) * 2);
    }),
  }));

  // Q11 — Tool usage
  const Q11_TOOLS = [
    { name: 'FBA', use: 180, satisfied: 1.2, issues: 5 },
    { name: 'Amazon Support', use: 145, satisfied: 0.5, issues: 8 },
    { name: 'PPC/Ads', use: 130, satisfied: 3.5, issues: 5 },
    { name: 'FBM', use: 110, satisfied: 1, issues: 0.5 },
    { name: 'Brand Registry', use: 85, satisfied: 0.5, issues: 2 },
    { name: 'Inventory Mgmt', use: 55, satisfied: 0.4, issues: 0.3 },
    { name: 'Lightning Deal', use: 42, satisfied: 0.3, issues: 2 },
    { name: 'Seller Central', use: 38, satisfied: 0.2, issues: 0.5 },
    { name: 'Amazon Vine', use: 18, satisfied: 0.1, issues: 0 },
    { name: 'Subscribe & Save', use: 12, satisfied: 0.1, issues: 0 },
  ];
  const Q11_ISSUES = [
    { name: 'Claim A-to-Z', count: 55 },
    { name: 'Suspended account', count: 42 },
    { name: 'PPC inefficiency', count: 38 },
    { name: 'Listing errors', count: 28 },
    { name: 'Inventory issue', count: 22 },
    { name: 'FBA fee', count: 18 },
    { name: 'A9 ranking', count: 14 },
    { name: 'Bugs', count: 10 },
  ];
  const Q11_SATISFACTION = [
    { name: 'Ease of setup', count: 42 },
    { name: 'Reach & traffic', count: 58 },
    { name: 'Scale', count: 18 },
    { name: 'Tăng doanh số', count: 12 },
  ];

  // Q12 — 3rd party services
  const Q12_SERVICES = [
    { name: 'Accountant/Tax', mentions: 177, need: 35, satisfaction: 80, demand: 29 },
    { name: 'Legal/Trademark', mentions: 108, need: 40, satisfaction: 75, demand: 32 },
    { name: 'Listing Optimization', mentions: 107, need: 58, satisfaction: 68, demand: 42 },
    { name: 'Product Sourcing', mentions: 62, need: 48, satisfaction: 82, demand: 52 },
    { name: 'Software/Tools', mentions: 55, need: 32, satisfaction: 85, demand: 50 },
    { name: 'Freight Forwarder', mentions: 42, need: 18, satisfaction: 70, demand: 40 },
  ];

  // Q13 — Courses
  const Q13_COURSES = [
    { name: 'Mentorship/Coaching', mentions: 45, seeking: 32, interest: 82, positive: 38, negative: 6 },
    { name: 'General Training', mentions: 22, seeking: 15, interest: 68, positive: 18, negative: 4 },
    { name: 'Listing Optimization', mentions: 14, seeking: 8, interest: 72, positive: 11, negative: 2 },
    { name: 'Amazon Course', mentions: 6, seeking: 4, interest: 70, positive: 5, negative: 1 },
  ];

  // Q14 — Growth / P&L
  const Q14_GROWTH = [
    { name: 'Scaling Operations', count: 180, color: 'oklch(0.55 0.17 260)', seeking: 140, positive: 20, mixed: 15, negative: 5 },
    { name: 'Marketing & Ads', count: 150, color: 'oklch(0.62 0.15 155)', seeking: 115, positive: 18, mixed: 12, negative: 5 },
    { name: 'Automation & Tools', count: 120, color: 'oklch(0.75 0.17 60)', seeking: 90, positive: 15, mixed: 10, negative: 5 },
    { name: 'Revenue Growth', count: 95, color: 'oklch(0.62 0.15 200)', seeking: 70, positive: 12, mixed: 8, negative: 5 },
    { name: 'Team Building', count: 72, color: 'oklch(0.55 0.17 290)', seeking: 55, positive: 10, mixed: 5, negative: 2 },
    { name: 'Market Expansion', count: 48, color: 'oklch(0.60 0.20 25)', seeking: 38, positive: 6, mixed: 3, negative: 1 },
  ];

  return { Q7_TOPICS, Q7_BENEFITS, Q7_SENTIMENT,
    Q8_TRIGGERS, Q8_PERSONA, Q8_TREND,
    Q9_BARRIERS,
    Q10_TOP, Q10_WEEKS, Q10_WEEKLY,
    Q11_TOOLS, Q11_ISSUES, Q11_SATISFACTION,
    Q12_SERVICES, Q13_COURSES, Q14_GROWTH };
})();
