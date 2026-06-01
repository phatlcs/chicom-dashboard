'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MonthlyReport {
  batch_id: number
  month: string
  total_posts: number
  relevant_posts: number
  status: string
}

export default function AprilPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMonthlyReport('2026-04')
  }, [])

  async function fetchMonthlyReport(month: string) {
    try {
      const res = await fetch(`/api/admin/batches?month=${month}`)
      const data = await res.json()

      if (data.batches && data.batches.length > 0) {
        // Use the first/latest batch for this month
        const batch = data.batches[0]
        setReport({
          batch_id: batch.id,
          month: batch.month,
          total_posts: batch.total,
          relevant_posts: batch.relevant,
          status: batch.status,
        })
      } else {
        setError('No data available for this month')
      }
    } catch (err) {
      setError('Failed to load report: ' + (err as Error).message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <h2 className="font-bold mb-2">Error Loading Report</h2>
        <p>{error}</p>
        <Link href="/upload" className="text-red-600 hover:underline mt-4 inline-block">
          Upload data for April 2026 →
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">April 2026 Report</h1>
        <p className="text-gray-600 mt-2">Monthly data analysis and insights</p>
      </div>

      {!report ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">No Data Available</h3>
          <p className="text-yellow-800 mb-4">No data batch found for April 2026.</p>
          <Link href="/upload">
            <span className="text-yellow-600 hover:underline font-medium">Upload April data →</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Total Posts</p>
              <p className="text-3xl font-bold mt-2">{report.total_posts.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Relevant Posts</p>
              <p className="text-3xl font-bold mt-2">{report.relevant_posts.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-lg font-bold mt-2 ${
                report.status === 'COMPLETED' ? 'text-green-600' :
                report.status === 'PROCESSING' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {report.status}
              </p>
            </div>
          </div>

          {/* Placeholder for Q1-Q14 Reports */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Question Reports (Q1-Q14)</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 14 }, (_, i) => i + 1).map((q) => (
                <div key={q} className="p-6 border border-gray-200 rounded-lg hover:shadow transition">
                  <h3 className="font-semibold text-gray-900 mb-2">Question {q}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {q === 1 ? 'Master Topics & Personas' :
                     q === 2 ? 'Master Topics by Persona' :
                     q === 3 ? 'Sub-topics Distribution' :
                     q === 10 ? 'Product Categories (Q10)' :
                     'Analysis data...'}
                  </p>
                  <button className="text-blue-600 hover:underline text-sm font-medium">
                    View Details →
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-900">
                ℹ️ Report generation coming soon. Data batches are being processed and Q1-Q14 insights will be available shortly.
              </p>
            </div>
          </div>

          {/* Batch Info */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Batch Information</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-600">Batch ID</dt>
                <dd className="font-mono font-semibold text-gray-900">{report.batch_id}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Month</dt>
                <dd className="font-semibold text-gray-900">{report.month}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Total Posts</dt>
                <dd className="font-semibold text-gray-900">{report.total_posts}</dd>
              </div>
              <div>
                <dt className="text-gray-600">Relevant Posts</dt>
                <dd className="font-semibold text-gray-900">{report.relevant_posts}</dd>
              </div>
            </dl>
          </div>
        </>
      )}
    </div>
  )
}
