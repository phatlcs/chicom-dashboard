'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatsCard from '@/components/StatsCard'
import RecentBatches from '@/components/RecentBatches'

interface DashboardStats {
  total_batches: number
  total_posts: number
  total_relevant: number
  batches_by_status: {
    completed: number
    processing: number
    failed: number
  }
  latest_batches: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data.stats)
    } catch (err) {
      setError('Failed to load dashboard stats')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (error) {
    return <div className="text-red-600 text-center py-12">{error}</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Monthly data pooling and reporting system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Batches"
          value={stats?.total_batches || 0}
          color="blue"
        />
        <StatsCard
          title="Total Posts"
          value={stats?.total_posts || 0}
          color="green"
        />
        <StatsCard
          title="Relevant Posts"
          value={stats?.total_relevant || 0}
          color="purple"
        />
        <StatsCard
          title="Completed"
          value={stats?.batches_by_status.completed || 0}
          color="emerald"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/upload">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500">
            <h3 className="font-semibold text-gray-900 mb-2">Upload Data</h3>
            <p className="text-gray-600 text-sm">Import XLSX files or connect Esuit/Automa</p>
          </div>
        </Link>

        <Link href="/months/q1-2026">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 border-green-500">
            <h3 className="font-semibold text-gray-900 mb-2">Q1 2026</h3>
            <p className="text-gray-600 text-sm">View January - March 2026 report</p>
          </div>
        </Link>

        <Link href="/months/april-2026">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 border-purple-500">
            <h3 className="font-semibold text-gray-900 mb-2">April 2026</h3>
            <p className="text-gray-600 text-sm">View April 2026 report</p>
          </div>
        </Link>
      </div>

      {/* Recent Batches */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Batches</h2>
        </div>
        <RecentBatches batches={stats?.latest_batches || []} />
      </div>
    </div>
  )
}
