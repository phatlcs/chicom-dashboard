'use client'

import { useState, useEffect } from 'react'

export default function OverviewPage() {
  const [start, setStart] = useState('2026-01-01')
  const [end, setEnd] = useState('2026-05-31')
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ total: number; relevant: number } | null>(null)

  // Restore last used report on mount
  useEffect(() => {
    const saved = localStorage.getItem('overview-active-slug')
    const savedStart = localStorage.getItem('overview-start')
    const savedEnd = localStorage.getItem('overview-end')
    if (saved) setActiveSlug(saved)
    if (savedStart) setStart(savedStart)
    if (savedEnd) setEnd(savedEnd)
  }, [])

  async function generate() {
    const slug = `custom-${start}-${end}`
    setLoading(true)
    setError('')
    setStats(null)
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, slug }),
      })
      const text = await r.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch { throw new Error(text.slice(0, 200)) }
      if (!r.ok) throw new Error(data.error ?? 'Generation failed')
      setActiveSlug(slug)
      setStats({ total: data.total, relevant: data.relevant })
      // Persist to localStorage
      localStorage.setItem('overview-active-slug', slug)
      localStorage.setItem('overview-start', start)
      localStorage.setItem('overview-end', end)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const iframeSrc = activeSlug ? `/${activeSlug}.html` : null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', zIndex: 1 }}>
      {/* Header */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flexShrink: 0, zIndex: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 13, marginRight: 4 }}>Overview</span>

        {/* Date range controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" value={start} onChange={e => setStart(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: 12 }} />
          <span style={{ color: '#64748b' }}>→</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: 12 }} />
          <button onClick={generate} disabled={loading}
            style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: loading ? 'default' : 'pointer', background: loading ? '#475569' : '#22c55e', color: '#fff' }}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {stats && (
          <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
            {stats.relevant.toLocaleString()} relevant / {stats.total.toLocaleString()} total posts
          </span>
        )}

        {error && <span style={{ fontSize: 11, color: '#f87171', marginLeft: 8 }}>{error}</span>}
      </div>

      {/* Dashboard iframe */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: 14 }}>
          Generating dashboard from database — this takes ~30-60 seconds...
        </div>
      ) : activeSlug && iframeSrc ? (
        <iframe key={iframeSrc} src={iframeSrc} style={{ flex: 1, border: 'none', width: '100%' }} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8', fontSize: 14 }}>
          Select a date range and click Generate to create a custom report
        </div>
      )}
    </div>
  )
}
