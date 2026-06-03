'use client'

import Link from 'next/link'

export default function AdminPanel() {
  const reports = [
    { slug: 'q1', name: 'Q1 2026', description: 'January - March 2026' },
    { slug: 'april', name: 'April 2026', description: 'April 2026' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Boost Dashboard</h1>
          <p className="text-xl text-gray-600">Select a report to view</p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <Link key={report.slug} href={`/${report.slug}`}>
              <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition cursor-pointer p-8 border-l-4 border-blue-500">
                <h2 className="text-2xl font-bold text-blue-600 mb-2">{report.name}</h2>
                <p className="text-gray-600 mb-4">{report.description}</p>
                <div className="flex items-center text-blue-500 font-semibold hover:text-blue-700">
                  View Report →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Select any report above to view detailed analytics</p>
        </div>
      </div>
    </div>
  )
}
