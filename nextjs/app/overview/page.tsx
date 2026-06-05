'use client'

import { useState, useEffect } from 'react'

const PRESETS = [
  { label: 'Q1 2026', start: '2026-01-01', end: '2026-03-31', slug: 'q1' },
  { label: 'April 2026', start: '2026-04-01', end: '2026-04-30', slug: 'april' },
]

interface Report {
  slug: string
  label: string
  start: string
  end: string
  total: number
  relevant: number
  createdAt: string
}

export default function OverviewPage() {
  const [start, setStart] = useState('2026-01-01')
  const [end, setEnd] = useState('2026-03-31')
  const [activeSlug, setActiveSlug] = useState('q1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reports, setReports] = useState<Report[]>([])

  // Load saved reports and restore last active on mount
  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then((saved: Report[]) => {
        setReports(saved)
        // Restore last active report
        const last = localStorage.getItem('overview-active-slug')
        if (last) setActiveSlug(last)
      })
      .catch(() => {})
  }, [])

  // Persist active slug to localStorage
  useEffect(() => {
    localStorage.setItem('overview-active-slug', activeSlug)
  }, [activeSlug])

  async function generate(s: string, e: string, slug: string) {
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: s, end: e, slug }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Generation failed')

      const report: Report = {
        slug, label: `${s} → ${e}`, start: s, end: e,
        total: data.total, relevant: data.relevant,
        createdAt: new Date().toISOString(),
      }

      // Save to persistent store
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      })

      setReports(prev => {
        const filtered = prev.filter(r => r.slug !== slug)
        return [report, ...filtered]
      })
      setActiveSlug(slug)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const iframeSrc = `/${activeSlug}.html`

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
      {/* Header */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '10px 16px 10px 64px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0, zIndex: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 13, marginRight: 4 }}>Overview</span>

        {/* Preset buttons */}
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => setActiveSlug(p.slug)}
            style={{ padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeSlug === p.slug ? '#3b82f6' : '#334155', color: '#fff' }}>
            {p.label}
          </button>
        ))}

        {/* Saved custom reports */}
        {reports.map(r => (
          <button key={r.slug} onClick={() => setActiveSlug(r.slug)}
            style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeSlug === r.slug ? '#8b5cf6' : '#334155', color: '#fff' }}>
            {r.label}
          </button>
        ))}

        {/* Date range generator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: 12 }} />
          <span style={{ color: '#64748b' }}>→</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: 12 }} />
          <button onClick={() => generate(start, end, `custom-${start}-${end}`)} disabled={loading}
            style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: loading ? 'default' : 'pointer', background: loading ? '#475569' : '#22c55e', color: '#fff' }}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {error && <span style={{ fontSize: 11, color: '#f87171', marginLeft: 8 }}>{error}</span>}
      </div>

      {/* Dashboard iframe */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: 14 }}>
          Generating from database — this takes ~30 seconds...
        </div>
      ) : (
        <iframe key={iframeSrc} src={iframeSrc} style={{ flex: 1, border: 'none', width: '100%' }} />
      )}
    </div>
  )
}
