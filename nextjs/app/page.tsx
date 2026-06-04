'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Page {
  id: number
  slug: string
  name: string
  type: string
  totalPosts: number
  relevantPosts: number
  status: string
  timeStart: string
  timeEnd: string
}

export default function OverviewPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    timeStart: '',
    timeEnd: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    try {
      const res = await fetch('/api/pages')
      const data = await res.json()
      if (data.pages) {
        setPages(data.pages)
      }
    } catch (err) {
      console.error('Failed to fetch pages:', err)
      setError('Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/pages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          timeStart: formData.timeStart,
          timeEnd: formData.timeEnd,
          filters: {},
        }),
      })

      const data = await res.json()

      if (data.status === 'success') {
        setFormData({ name: '', timeStart: '', timeEnd: '' })
        setShowCreateForm(false)
        await fetchPages()
        // Optionally redirect to the new page
        window.location.href = `/${data.slug}`
      } else {
        setError(data.message || 'Failed to create report')
      }
    } catch (err) {
      setError('Error creating report: ' + (err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Manage all pages and create custom reports</p>
      </div>

      {/* Create Report Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {showCreateForm ? '✕ Cancel' : '+ Create New Report'}
        </button>
      </div>

      {/* Create Report Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create Custom Report</h2>
          {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{error}</div>}

          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q1 Analysis, April Custom Report"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                If duplicate, will auto-increment: Q1 → Q1(1) → Q1(2)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.timeStart}
                  onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.timeEnd}
                  onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Report'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            All Reports ({pages.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : pages.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No pages yet. Create your first report to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pages.map((page) => (
              <a key={page.id} href={`/${page.slug}`}>
                <div className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700">
                        {page.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {page.timeStart} to {page.timeEnd}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium mr-2">
                          {page.type}
                        </span>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            page.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {page.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {page.relevantPosts?.toLocaleString() || 0} / {page.totalPosts?.toLocaleString() || 0} posts
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
