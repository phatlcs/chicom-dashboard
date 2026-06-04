'use client'

import { useState, useEffect } from 'react'

const PRESETS = [
  { label: 'Q1 2026', start: '2026-01-01', end: '2026-03-31' },
  { label: 'April 2026', start: '2026-04-01', end: '2026-04-30' },
  { label: 'All Data', start: '2026-01-01', end: '2026-04-30' },
]

export default function OverviewPage() {
  const [start, setStart] = useState('2026-01-01')
  const [end, setEnd] = useState('2026-03-31')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load(s: string, e: string) {
    setLoading(true); setError('')
    try {
      const r = await fetch(`/api/overview?start=${s}&end=${e}`)
      if (!r.ok) throw new Error((await r.json()).error ?? 'Error')
      setData(await r.json())
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(start, end) }, [])

  const total = parseInt(data?.kpi?.total ?? '0')
  const relevant = parseInt(data?.kpi?.relevant ?? '0')
  const sc: Record<string, string> = { positive: '#22c55e', negative: '#ef4444', neutral: '#94a3b8', mixed: '#f59e0b' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Community Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Live aggregation from pooled posts database</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.label}
                onClick={() => { setStart(p.start); setEnd(p.end); load(p.start, p.end) }}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${start === p.start && end === p.end ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center ml-auto flex-wrap">
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <span className="text-gray-400">→</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => load(start, end)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Apply</button>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>}
      {loading && <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Posts', value: Number(total).toLocaleString() },
              { label: 'Relevant Posts', value: Number(relevant).toLocaleString() },
              { label: 'Relevance Rate', value: total ? `${Math.round(relevant / total * 100)}%` : '—' },
              { label: 'Days Covered', value: data.kpi.days },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{k.label}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{k.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topics */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Top Topics</h2>
              <div className="space-y-3">
                {data.topics.map((t: any) => {
                  const pct = relevant ? Math.round(parseInt(t.count) / relevant * 100) : 0
                  return (
                    <div key={t.master_topic}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate">{t.master_topic}</span>
                        <span className="text-gray-400 font-mono ml-4">{pct}% · {Number(t.count).toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-5">
              {/* Sentiment */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">Sentiment</h2>
                <div className="flex gap-3 flex-wrap">
                  {data.sentiment.map((s: any) => {
                    const pct = relevant ? Math.round(parseInt(s.count) / relevant * 100) : 0
                    const color = sc[s.sentiment?.toLowerCase()] ?? '#94a3b8'
                    return (
                      <div key={s.sentiment} className="flex-1 min-w-[80px] text-center p-3 rounded-lg border border-gray-100"
                        style={{ borderTopColor: color, borderTopWidth: 3 }}>
                        <div className="text-lg font-bold" style={{ color }}>{pct}%</div>
                        <div className="text-xs text-gray-500 capitalize mt-1">{s.sentiment}</div>
                        <div className="text-xs text-gray-400">{Number(s.count).toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Personas */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">Personas</h2>
                <div className="space-y-2">
                  {data.personas.slice(0, 5).map((p: any) => {
                    const pct = relevant ? Math.round(parseInt(p.count) / relevant * 100) : 0
                    return (
                      <div key={p.persona} className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600 w-40 truncate">{p.persona}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-gray-400 font-mono w-9 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Daily volume */}
          {data.daily.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Daily Post Volume</h2>
              <div className="flex items-end gap-px h-28">
                {(() => {
                  const max = Math.max(...data.daily.map((d: any) => parseInt(d.count)))
                  return data.daily.map((d: any) => (
                    <div key={d.date} className="flex-1 bg-blue-400 rounded-t hover:bg-blue-500 transition"
                      style={{ height: `${Math.round(parseInt(d.count) / max * 100)}%` }}
                      title={`${d.date}: ${Number(d.count).toLocaleString()}`} />
                  ))
                })()}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{data.daily[0]?.date}</span>
                <span>{data.daily[data.daily.length - 1]?.date}</span>
              </div>
            </div>
          )}

          {/* Full report links */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Full Reports</h2>
            <div className="flex gap-3 flex-wrap">
              <a href="/q1" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700">Q1 2026 Full Report →</a>
              <a href="/april" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700">April 2026 Full Report →</a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
