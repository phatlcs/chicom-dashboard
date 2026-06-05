'use client'

import { useState, useEffect } from 'react'

const PRESETS = [
  { label: 'Q1 2026', start: '2026-01-01', end: '2026-03-31', slug: 'q1' },
  { label: 'April 2026', start: '2026-04-01', end: '2026-04-30', slug: 'april' },
]

interface Report { slug: string; label: string; start: string; end: string; total: number; relevant: number }

export default function OverviewPage() {
  const [start, setStart] = useState('2026-01-01')
  const [end, setEnd] = useState('2026-03-31')
  const [activeSlug, setActiveSlug] = useState('q1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then((saved: Report[]) => {
      setReports(saved)
      const last = localStorage.getItem('overview-active-slug')
      if (last) setActiveSlug(last)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem('overview-active-slug', activeSlug)
  }, [activeSlug])

  async function generate() {
    const slug = `custom-${start}-${end}`
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, slug }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Failed')
      const report: Report = { slug, label: `${start} → ${end}`, start, end, total: data.total, relevant: data.relevant }
      await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) })
      setReports(prev => [report, ...prev.filter(r => r.slug !== slug)])
      setActiveSlug(slug)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Presets */}
          {PRESETS.map(p => (
            <button key={p.slug} onClick={() => setActiveSlug(p.slug)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${activeSlug === p.slug ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
              {p.label}
            </button>
          ))}
          {/* Saved custom reports */}
          {reports.map(r => (
            <button key={r.slug} onClick={() => setActiveSlug(r.slug)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${activeSlug === r.slug ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
              {r.label}
            </button>
          ))}
          {/* Date range */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span className="text-gray-400">→</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={generate} disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${loading ? 'bg-gray-400 cursor-default' : 'bg-green-600 hover:bg-green-700'}`}>
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {loading && <p className="text-gray-400 text-sm mt-2">Generating from database — ~30 seconds...</p>}
      </div>

      {/* Dashboard iframe */}
      {!loading && (
        <div style={{ height: 'calc(100vh - 160px)' }}>
          <iframe key={`/${activeSlug}.html`} src={`/${activeSlug}.html`} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }} />
        </div>
      )}
    </div>
  )
}
