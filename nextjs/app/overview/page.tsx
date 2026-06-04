'use client'

import { useState } from 'react'

const PRESETS = [
  { label: 'Q1 2026', start: '2026-01-01', end: '2026-03-31', slug: 'q1' },
  { label: 'April 2026', start: '2026-04-01', end: '2026-04-30', slug: 'april' },
]

export default function OverviewPage() {
  const [start, setStart] = useState('2026-01-01')
  const [end, setEnd] = useState('2026-03-31')
  const [activeSlug, setActiveSlug] = useState('q1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ total: number; relevant: number } | null>(null)

  async function generate(s: string, e: string, slug: string) {
    setLoading(true)
    setError('')
    setStats(null)
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: s, end: e, slug }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Generation failed')
      setActiveSlug(slug)
      setStats({ total: data.total, relevant: data.relevant })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function applyPreset(p: typeof PRESETS[0]) {
    setStart(p.start)
    setEnd(p.end)
    setActiveSlug(p.slug)
    setStats(null)
  }

  const iframeSrc = `/${activeSlug}.html`

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
      {/* Header bar */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0, zIndex: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', marginRight: 8 }}>Overview</span>

        {/* Presets */}
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeSlug === p.slug && !loading ? '#3b82f6' : '#334155',
              color: '#fff', transition: '0.15s',
            }}>
            {p.label}
          </button>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: 12 }} />
          <span style={{ color: '#64748b' }}>→</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: 12 }} />
          <button onClick={() => generate(start, end, `custom-${start}-${end}`)}
            disabled={loading}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: loading ? 'default' : 'pointer',
              background: loading ? '#475569' : '#22c55e', color: '#fff',
            }}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {stats && (
          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
            {stats.relevant.toLocaleString()} relevant / {stats.total.toLocaleString()} total posts
          </span>
        )}

        {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
      </div>

      {/* Dashboard iframe */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: 14 }}>
          Generating dashboard from database... this takes ~30 seconds
        </div>
      ) : (
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          style={{ flex: 1, border: 'none', width: '100%' }}
        />
      )}
    </div>
  )
}
