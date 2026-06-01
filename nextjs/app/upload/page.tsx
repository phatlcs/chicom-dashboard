'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UploadResponse {
  status: string
  batch_id: number
  stats: {
    total_posts: number
    posts_classified: number
    posts_relevant: number
  }
}

export default function UploadPage() {
  const router = useRouter()
  const [month, setMonth] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<UploadResponse | null>(null)

  const currentYear = new Date().getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i, 1)
    return {
      value: date.toISOString().split('T')[0].slice(0, 7),
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  })

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (!file || !month) {
      setError('Please select a file and month')
      return
    }

    if (!file.name.endsWith('.xlsx')) {
      setError('File must be .xlsx format')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('month', month)

      const res = await fetch('/api/admin/upload/xlsx', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Upload failed')
        return
      }

      setSuccess(data)
      setFile(null)
      setMonth('')

      // Redirect to batch details after 2 seconds
      setTimeout(() => {
        router.push(`/batch/${data.batch_id}`)
      }, 2000)
    } catch (err) {
      setError('Upload failed: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Data</h1>
        <p className="text-gray-600 mt-2">Import XLSX files for monthly data pooling</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleUpload} className="bg-white rounded-lg shadow p-8">
          {/* Month Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a month --</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload XLSX File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition cursor-pointer"
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
                const files = e.dataTransfer.files
                if (files.length > 0) {
                  setFile(files[0])
                }
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="hidden"
              />
              <p className="text-gray-600">
                {file ? (
                  <span className="text-green-600 font-medium">✓ {file.name}</span>
                ) : (
                  <>
                    <span className="block mb-2">Drag and drop your XLSX file here</span>
                    <span className="text-sm text-gray-500">or click to browse</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Expected Columns Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Expected XLSX Columns:</h3>
            <ul className="text-sm text-blue-800 grid grid-cols-2 gap-2">
              <li>• group_id</li>
              <li>• author_name</li>
              <li>• author_id</li>
              <li>• created_date</li>
              <li>• content</li>
              <li>• master_topic</li>
              <li>• sub_topic</li>
              <li>• sentiment</li>
              <li>• persona</li>
              <li>• product_category</li>
              <li>• relevant</li>
              <li>• more...</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <p className="font-semibold">✓ Upload successful!</p>
              <p className="text-sm mt-1">
                Batch #{success.batch_id} • {success.stats.total_posts} posts • {success.stats.posts_relevant} relevant
              </p>
              <p className="text-sm mt-2">Redirecting to batch details...</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !file || !month}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'Uploading...' : 'Upload & Process'}
          </button>
        </form>

        {/* Data Sources Info */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h3 className="font-bold text-gray-900 mb-4">Other Data Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Esuit Integration</h4>
              <p className="text-sm text-gray-600">Coming soon - Direct API connection to Esuit</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Automa Integration</h4>
              <p className="text-sm text-gray-600">Coming soon - Webhook integration with Automa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
