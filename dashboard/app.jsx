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

  const Q1 = window.Q1, Q2 = window.Q2, Q3 = window.Q3, Q4 = window.Q4;
  const Q5 = window.Q5, Q6 = window.Q6;
  const Q7 = window.Q7, Q8 = window.Q8, Q9 = window.Q9, Q10 = window.Q10;
  const Q11 = window.Q11, Q12 = window.Q12, Q13 = window.Q13, Q14 = window.Q14;

  return (
    <>
      <window.TopBar />
      <div className="page">
        <div className="page-header">
          <h1>ChiCom — Community Insights Dashboard</h1>
          <p>Content analysis across 2 SOA (Selling on Amazon) communities and 7 EC (cross-border e-commerce) communities — answering 14 research questions.</p>
          <window.TimeRangeBadge />
        </div>

        <window.KpiStrip />

        {/* ── Section 1: Overview ─────────────────────────── */}
        <window.SectionBanner label="Section 1 — Overview" sublabel="Overview · SOV community · Persona distribution" />
        <section id="overview"><window.OverviewPanel /></section>

        {/* ── Section 2: Detailed insights (14 questions) ─────────── */}
        <window.SectionBanner label="Section 2 — Detailed insights" sublabel="14 research questions" />

        <window.AnchorRail />

        <window.Section id="Q1" num="Q1"
          title="Most-discussed topics across SOA and EC groups — weight per group"><Q1 /></window.Section>
        <window.Section id="Q2" num="Q2"
          title="Topic split by target persona — per group and total"><Q2 /></window.Section>
        <window.Section id="Q3" num="Q3"
          title="Seller vs Prospect differences — Master Topics & sub-topics"><Q3 /></window.Section>
        <window.Section id="Q4" num="Q4"
          title="Master Topic trends across months"><Q4 /></window.Section>
        <window.Section id="Q5" num="Q5"
          title="Negative discussion — peak day of the week"><Q5 /></window.Section>
        <window.Section id="Q6" num="Q6"
          title="Negative discussion — peak hour of the day"><Q6 /></window.Section>
        <window.Section id="Q7" num="Q7"
          title="Topics encouraging sellers to join Amazon — benefits mentioned"><Q7 /></window.Section>
        <window.Section id="Q8" num="Q8" soaOnly
          title="Topics signalling Amazon abandonment — key indicators"><Q8 /></window.Section>
        <window.Section id="Q9" num="Q9"
          title="Active participants of Q7 & Q8 — KOLs mentioned"><Q9 /></window.Section>
        <window.Section id="Q10" num="Q10"
          title="Most-discussed product categories of the quarter"><Q10 /></window.Section>
        <window.Section id="Q11" num="Q11" soaOnly
          title="Amazon product / program adoption — usage and satisfaction"><Q11 /></window.Section>
        <window.Section id="Q12" num="Q12"
          title="3rd-party outsourcing services sellers need"><Q12 /></window.Section>
        <window.Section id="Q13" num="Q13"
          title="Amazon courses — what sellers are interested in"><Q13 /></window.Section>
        <window.Section id="Q14" num="Q14"
          title="Business growth & P&L discussion — positive and negative"><Q14 /></window.Section>

        <div style={{ padding: '24px 0', borderTop: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span>ChiCom Insights · data from {(window.ChiComData && window.ChiComData.KPI && window.ChiComData.KPI.totalPosts.toLocaleString()) || '—'} mentions</span>
          <span className="mono">14 questions · {(window.ChiComData && window.ChiComData.ALL_GROUPS && window.ChiComData.ALL_GROUPS.length) || 9} communities</span>
        </div>
      </div>

      <TweaksPanel theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} />
      <window.UploadPanel />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
