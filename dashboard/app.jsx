/* global React, ReactDOM, window */
const { useState: useStateApp, useEffect: useEffectApp } = React;

function TweaksPanel({ theme, setTheme, accent, setAccent }) {
  const [visible, setVisible] = useStateApp(false);

  useEffectApp(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const swatches = [
    { name: 'indigo', color: 'oklch(0.55 0.19 265)' },
    { name: 'blue', color: 'oklch(0.55 0.19 230)' },
    { name: 'teal', color: 'oklch(0.58 0.14 190)' },
    { name: 'violet', color: 'oklch(0.55 0.19 290)' },
    { name: 'rose', color: 'oklch(0.60 0.20 10)' },
    { name: 'amber', color: 'oklch(0.68 0.17 60)' },
  ];

  if (!visible) return null;
  return (
    <div className="tweaks">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <label>Theme</label>
        <div className="seg">
          <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')} style={{ padding: '3px 8px', fontSize: 11 }}>Light</button>
          <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')} style={{ padding: '3px 8px', fontSize: 11 }}>Dark</button>
        </div>
      </div>
      <div className="tweak-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 6 }}>
        <label>Accent</label>
        <div className="swatch-row">
          {swatches.map(s => (
            <button key={s.name} className={accent === s.name ? 'on' : ''}
              onClick={() => setAccent(s.name)}
              style={{ background: s.color }}
              title={s.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const saved = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "accent": "indigo"
  }/*EDITMODE-END*/;
  const [theme, setTheme] = useStateApp(saved.theme);
  const [accent, setAccent] = useStateApp(saved.accent);

  useEffectApp(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const hueMap = { indigo: 265, blue: 230, teal: 190, violet: 290, rose: 10, amber: 60 };
    document.documentElement.style.setProperty('--accent', `oklch(0.55 0.19 ${hueMap[accent]})`);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { theme, accent } }, '*');
  }, [theme, accent]);

  const Q1 = window.Q1, Q2 = window.Q2, Q3 = window.Q3, Q4 = window.Q4, Q56 = window.Q56;
  const Q7 = window.Q7, Q8 = window.Q8, Q9 = window.Q9, Q10 = window.Q10;
  const Q11 = window.Q11, Q12 = window.Q12, Q13 = window.Q13, Q14 = window.Q14;

  return (
    <>
      <window.TopBar />
      <div className="page">
        <div className="page-header">
          <h1>ChiCom — Community Insights Dashboard</h1>
          <p>Phân tích nội dung từ 2 cộng đồng SOA (Selling on Amazon) và 7 cộng đồng EC (E-commerce xuyên biên giới) — trả lời 14 câu hỏi nghiên cứu.</p>
          <window.TimeRangeBadge />
        </div>

        <window.KpiStrip />

        {/* ── Section 1: Thông tin sơ bộ ─────────────────────────── */}
        <window.SectionBanner label="Phần 1 — Thông tin sơ bộ" sublabel="Overview · SOV community · Phân bố persona" />
        <window.OverviewPanel />

        {/* ── Section 2: Thông tin chi tiết (14 câu hỏi) ─────────── */}
        <window.SectionBanner label="Phần 2 — Thông tin chi tiết" sublabel="14 câu hỏi nghiên cứu" />

        <window.AnchorRail />

        <window.Section id="Q1" num="Q1"
          indication="Master Topics tổng thể (trung bình qua các nhóm) và phân bố theo từng community. AI học từ 40k+ Lượt Thảo Luận đã phân loại — nhóm Chi có thể cross-check bằng keyword sampling để tinh chỉnh taxonomy."><Q1 /></window.Section>
        <window.Section id="Q2" num="Q2"
          indication="Ma trận Master Topics × Persona cho từng nhóm target. Số liệu giúp xác định persona nào đang thảo luận chủ đề nào nhiều nhất → input cho content planning."><Q2 /></window.Section>
        <window.Section id="Q3" num="Q3"
          indication="Deep-dive vào 9 Master Topics + sub-topic, so sánh giữa Seller vs Prospect. Bar diff âm = prospect chiếm nhiều hơn → cơ hội mentorship / educational content."><Q3 /></window.Section>
        <window.Section id="Q4" num="Q4"
          indication="Xu hướng Master Topics qua các tháng + phát hiện tuần đỉnh (auto-detect). Dùng để lên content calendar và dự báo volume."><Q4 /></window.Section>
        <window.Section id="Q5" num="Q5 / Q6"
          indication="Khung giờ cao điểm phát hiện tự động từ dữ liệu (không cố định) — negative-sentiment Lượt Thảo Luận tập trung ở giờ nào. Input cho timing của support / moderation."><Q56 /></window.Section>
        <window.Section id="Q7" num="Q7"
          indication="Lý do + benefit khiến seller gia nhập Amazon. Data-driven keyword match — Chi có thể bổ sung VN slang để tăng recall."><Q7 /></window.Section>
        <window.Section id="Q8" num="Q8" soaOnly
          indication="Dấu hiệu rời bỏ + persona nào đang thảo luận rời bỏ nhiều nhất. Monthly trend để phát hiện spike sớm."><Q8 /></window.Section>
        <window.Section id="Q9" num="Q9"
          indication="Phân bố persona của những Lượt Thảo Luận Q7 (gia nhập) vs Q8 (rời bỏ) — xem nhóm nào đang lead từng hướng."><Q9 /></window.Section>
        <window.Section id="Q10" num="Q10"
          indication="Top ngành hàng thảo luận. Hiện đang keyword-based; sẽ tự nâng cấp khi LLM điền cột Product Category."><Q10 /></window.Section>
        <window.Section id="Q11" num="Q11" soaOnly
          indication="Mức adoption + hài lòng / vấn đề cho từng tool Amazon. Satisfied = pos-sentiment count, Issues = neg-sentiment count — cross-tab thật, không phải phân số giả."><Q11 /></window.Section>
        <window.Section id="Q12" num="Q12" soaOnly
          indication="Dịch vụ bên thứ 3 mà seller đang cần. 'Need' = Lượt Thảo Luận có kèm cụm 'cho hỏi/cần tìm' → input cho partnership/marketplace."><Q12 /></window.Section>
        <window.Section id="Q13" num="Q13" soaOnly
          indication="Khóa học seller quan tâm. Seeking = Lượt Thảo Luận chủ động hỏi — dùng để curate danh mục đào tạo."><Q13 /></window.Section>
        <window.Section id="Q14" num="Q14" soaOnly
          indication="Chủ đề tăng trưởng + P&L polarity. Phân chia seeking / positive / mixed / negative từ sentiment column — không phải tỉ lệ cố định."><Q14 /></window.Section>

        <div style={{ padding: '24px 0', borderTop: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span>ChiCom Insights · dữ liệu từ {(window.ChiComData && window.ChiComData.KPI && window.ChiComData.KPI.totalPosts.toLocaleString()) || '—'} Lượt Thảo Luận</span>
          <span className="mono">14 câu hỏi · {(window.ChiComData && window.ChiComData.ALL_GROUPS && window.ChiComData.ALL_GROUPS.length) || 9} cộng đồng</span>
        </div>
      </div>

      <TweaksPanel theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} />
      <window.UploadPanel />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
