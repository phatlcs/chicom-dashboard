'use client'

import { useState, useRef, useEffect } from 'react'

export default function GenerateReportPage() {
  const [formData, setFormData] = useState({ name: '', timeStart: '', timeEnd: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ inserted: number; skipped: number; total: number; errors: number } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [exportData, setExportData] = useState({ name: '', timeStart: '', timeEnd: '' })
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<{ rows: number; filename: string } | null>(null)

  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)

    try {
      const res = await fetch('/api/pages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, timeStart: formData.timeStart, timeEnd: formData.timeEnd, filters: {} }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        window.location.href = `/api/report/${data.slug}`
      } else {
        setCreateError(data.message || 'Failed to create report')
      }
    } catch (err) {
      setCreateError('Error: ' + (err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    setUploadError(null)

    const form = new FormData()
    form.append('file', file)
    form.append('batchLabel', file.name.replace(/\.[^.]+$/, ''))

    try {
      const res = await fetch('/api/upload-data', { method: 'POST', body: form })
      const data = await res.json()
      if (data.status === 'success') {
        setUploadResult(data)
        if (fileRef.current) fileRef.current.value = ''
      } else {
        setUploadError(data.error || 'Upload failed')
      }
    } catch (err) {
      setUploadError('Upload error: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleExport(e: React.FormEvent) {
    e.preventDefault()
    setExporting(true)
    setExportError(null)
    setExportResult(null)

    try {
      const res = await fetch('/api/export-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: exportData.name, timeStart: exportData.timeStart, timeEnd: exportData.timeEnd }),
      })

      if (!res.ok) {
        const data = await res.json()
        setExportError(data.error || 'Export failed')
        return
      }

      const rows = parseInt(res.headers.get('X-Row-Count') ?? '0')
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'export.xlsx'

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)

      setExportResult({ rows, filename })
    } catch (err) {
      setExportError('Export error: ' + (err as Error).message)
    } finally {
      setExporting(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
          <p className="text-gray-600 mt-1">Reports · Export · Data</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 underline">
          Log out
        </button>
      </div>

      <div className="flex flex-col gap-6">

        {/* Create Custom Report */}
        <div className={card}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Create Custom Report</h2>
          <p className="text-sm text-gray-500 mb-4">Select a date range — AI insights included (~1–2 min)</p>

          {createError && <div className="bg-red-50 text-red-700 p-4 rounded mb-4 text-sm">{createError}</div>}

          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. June 2026, Q2 Custom..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.timeStart}
                  onChange={e => setFormData({ ...formData, timeStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.timeEnd}
                  onChange={e => setFormData({ ...formData, timeEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating report... (1–2 min)' : 'Create Report'}
            </button>
          </form>
        </div>

        {/* Export Raw Data */}
        <div className={card}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Export Raw Data</h2>
          <p className="text-sm text-gray-500 mb-4">
            Download all posts in a date range as an XLSX file — same format as the classified input files.
          </p>

          <form onSubmit={handleExport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
              <input
                type="text"
                value={exportData.name}
                onChange={e => setExportData({ ...exportData, name: e.target.value })}
                placeholder="e.g. July 2026 Raw"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={exportData.timeStart}
                  onChange={e => setExportData({ ...exportData, timeStart: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={exportData.timeEnd}
                  onChange={e => setExportData({ ...exportData, timeEnd: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={exporting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Generating...' : '↓ Download XLSX'}
            </button>
          </form>

          {exporting && (
            <div className="mt-3">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{animation:'indeterminate 1.5s ease-in-out infinite'}} />
              </div>
              <p className="text-xs text-gray-400 mt-1">Querying database...</p>
            </div>
          )}
          {exportError && <div className="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm">{exportError}</div>}
          {exportResult && (
            <div className="mt-3 p-3 bg-indigo-50 text-indigo-800 rounded text-sm">
              Downloaded <strong>{exportResult.filename}</strong> — <strong>{exportResult.rows.toLocaleString()}</strong> rows
            </div>
          )}
        </div>

        {/* Upload Data */}
        <div className={card}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Upload Data</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload a CSV or XLSX file to add new records to the database.
            Duplicate <code className="bg-gray-100 px-1 rounded">post_id</code> entries are skipped automatically.
            Required columns: <code className="bg-gray-100 px-1 rounded">post_id, group_id, created_date, content</code>.
          </p>

          <form onSubmit={handleUpload} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select file (.csv or .xlsx)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                required
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? 'Uploading...' : 'Upload Data'}
            </button>
          </form>

          {uploadError && <div className="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm">{uploadError}</div>}
          {uploadResult && (
            <div className="mt-3 p-3 bg-green-50 text-green-800 rounded text-sm">
              Done — Inserted: <strong>{uploadResult.inserted.toLocaleString()}</strong>,
              skipped (duplicates): <strong>{uploadResult.skipped.toLocaleString()}</strong>,
              total processed: <strong>{uploadResult.total.toLocaleString()}</strong>
              {uploadResult.errors > 0 && (
                <span className="text-red-600 ml-1">· {uploadResult.errors} errors</span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
