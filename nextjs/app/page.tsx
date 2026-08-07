'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CustomReport {
  id: string
  slug: string
  name: string
  type: string
  totalPosts: number | null
  relevantPosts: number | null
  status: string
  timeStart: string | null
  timeEnd: string | null
  createdAt: string | null
}

const OFFICIAL_REPORTS = [
  { slug: 'q1',         label: 'Q1 2026 (Jan – Mar)', period: 'Jan 2026 – Mar 2026',       url: '/api/report/q1' },
  { slug: 'april',      label: 'April 2026',           period: 'Apr 1 – Apr 30, 2026',      url: '/api/report/april' },
  { slug: 'may',        label: 'May 2026',             period: 'May 1 – May 31, 2026',      url: '/api/report/may' },
  { slug: 'june-2026',  label: 'June 2026',            period: 'Jun 1 – Jun 30, 2026',      url: '/api/report/june-2026' },
  { slug: 'july-2026',  label: 'July 2026',            period: 'Jul 1 – Jul 31, 2026',      url: '/api/report/july-2026' },
]

export default function HomePage() {
  const [tab, setTab] = useState<'official' | 'custom'>('official')
  const [customReports, setCustomReports] = useState<CustomReport[]>([])
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.role)).catch(() => {})
  }, [])

  function loadCustomReports() {
    setLoading(true)
    fetch('/api/pages')
      .then(r => r.json())
      .then(d => setCustomReports(d.pages ?? []))
      .catch(() => setCustomReports([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadCustomReports() }, [])

  async function deleteReport(slug: string, name: string) {
    if (!confirm(`Delete custom report "${name}"? This cannot be undone.`)) return
    await fetch('/api/pages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
    loadCustomReports()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Community Insights Reports</p>
        </div>
        {role === 'admin' && (
          <Link href="/generate-report">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
              + Create Custom Report
            </span>
          </Link>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('official')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
            tab === 'official'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Official
        </button>
        <button
          onClick={() => setTab('custom')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition ${
            tab === 'custom'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Official tab */}
      {tab === 'official' && (
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {OFFICIAL_REPORTS.map(r => (
            <a key={r.slug} href={r.url} className="block px-6 py-5 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-600">{r.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{r.period}</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  OFFICIAL
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Custom tab */}
      {tab === 'custom' && (
        <div>
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading...</div>
          ) : customReports.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <p>No custom reports yet.</p>
              {role === 'admin' && (
                <Link href="/generate-report">
                  <span className="mt-3 inline-block text-blue-600 hover:underline text-sm">
                    Create custom report →
                  </span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {customReports.map(r => (
                <div key={r.slug} className="flex items-center hover:bg-gray-50 transition">
                  <a href={`/api/report/${r.slug}`} className="flex-1 block px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-600">{r.name}</h3>
                        {r.timeStart && r.timeEnd && (
                          <p className="text-sm text-gray-500 mt-0.5">{r.timeStart} → {r.timeEnd}</p>
                        )}
                        {r.createdAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Created: {new Date(r.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <div>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            CUSTOM
                          </span>
                        </div>
                        {r.totalPosts != null && (
                          <p className="text-xs text-gray-500">
                            {r.relevantPosts?.toLocaleString()} / {r.totalPosts?.toLocaleString()} posts
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                  {role === 'admin' && (
                    <button
                      onClick={() => deleteReport(r.slug, r.name)}
                      title="Delete report"
                      className="px-4 py-2 text-red-400 hover:text-red-600 transition text-sm shrink-0"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
