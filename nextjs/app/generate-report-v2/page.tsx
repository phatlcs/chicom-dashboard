'use client'

import { useEffect, useState } from 'react'

interface StoredReport {
  slug: string
  report_name: string | null
  time_start: string | null
  time_end: string | null
  total_posts: number | null
  relevant_posts: number | null
  updated_at: string | null
}

interface GenResult {
  ok: boolean
  slug?: string
  id?: number
  totalPosts?: number
  relevantPosts?: number
  insights?: number
  viewUrl?: string
  error?: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function GenerateReportV2Page() {
  const [form, setForm] = useState({ name: '', timeStart: '', timeEnd: '', slug: '' })
  const [insights, setInsights] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GenResult | null>(null)

  const [stored, setStored] = useState<StoredReport[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [viewerSlug, setViewerSlug] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/report-data')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
      .then((rows: StoredReport[]) => setStored(rows))
      .catch(e => setLoadError((e as Error).message))
  }, [result])

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setError(null)
    setResult(null)
    const slug = form.slug.trim() || slugify(form.name)
    try {
      const res = await fetch('/api/report-data/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: form.timeStart,
          end: form.timeEnd,
          slug,
          reportName: form.name,
          insights,
        }),
      })
      const data: GenResult = await res.json()
      if (!res.ok) {
        setError(data.error || 'Generation failed')
      } else {
        setResult(data)
        setViewerSlug(data.slug ?? null)
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const card = 'bg-white rounded-lg shadow border border-gray-200 p-6'

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generate Report v2</h1>
          <p className="text-gray-600 mt-1">
            Experimental — generate → store in DB → new slug → render from DB. Old system untouched.
          </p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 underline">
          Log out
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Generate */}
        <div className={card}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Generate report</h2>
          <p className="text-sm text-gray-500 mb-4">
            Computes Q1–Q14 aggregates into <code className="bg-gray-100 px-1 rounded">report_data</code> as one row,
            exposes it at <code className="bg-gray-100 px-1 rounded">/report-v2/{'{'}slug{'}'}</code>. No static HTML is written.
          </p>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4 text-sm">{error}</div>}
          {result?.ok && (
            <div className="bg-green-50 text-green-800 p-4 rounded mb-4 text-sm">
              Stored — slug <strong>{result.slug}</strong> · id {result.id} · {result.totalPosts?.toLocaleString()} posts /{' '}
              {result.relevantPosts?.toLocaleString()} relevant · insights {result.insights}
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. August 2026 (v2)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.timeStart}
                  onChange={e => setForm({ ...form, timeStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.timeEnd}
                  onChange={e => setForm({ ...form, timeEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  onBlur={() => setForm(f => ({ ...f, slug: f.slug.trim() || slugify(f.name) }))}
                  placeholder={slugify(form.name) || 'aug-2026-v2'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={insights} onChange={e => setInsights(e.target.checked)} />
              Generate LLM insights (adds ~1–2 min; uncheck for fast compute-only)
            </label>
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating... (~1–2 min)' : 'Generate Report'}
            </button>
          </form>
        </div>

        {/* Stored reports */}
        <div className={card}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Stored reports</h2>
          <p className="text-sm text-gray-500 mb-4">Rows in report_data — click one to view it from the DB.</p>

          {loadError && <div className="bg-red-50 text-red-700 p-4 rounded mb-4 text-sm">Failed to load: {loadError}</div>}
          {!loadError && stored.length === 0 && (
            <p className="text-sm text-gray-400">No reports stored yet.</p>
          )}

          <div className="flex flex-col gap-2">
            {stored.map(r => (
              <button
                key={r.slug}
                onClick={() => setViewerSlug(r.slug)}
                className={`flex items-center justify-between px-4 py-2 rounded-lg border text-left transition ${
                  viewerSlug === r.slug
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900">{r.report_name || r.slug}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {r.slug} · {r.time_start} → {r.time_end} · {r.total_posts?.toLocaleString()} posts /{' '}
                    {r.relevant_posts?.toLocaleString()} relevant
                  </div>
                </div>
                <span className="text-sm text-blue-600">View →</span>
              </button>
            ))}
          </div>
        </div>

        {/* Viewer */}
        {viewerSlug && (
          <div className={card}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Viewer — {viewerSlug}</h2>
              <a
                href={`/report-v2/${viewerSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 underline"
              >
                Open full page ↗
              </a>
            </div>
            <iframe
              src={`/report-v2/${viewerSlug}`}
              title={`Report ${viewerSlug}`}
              className="w-full border border-gray-200 rounded-lg bg-white"
              style={{ height: 1200 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}