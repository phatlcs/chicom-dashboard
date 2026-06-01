import Link from 'next/link'

interface Batch {
  id: number
  name: string
  month: string
  source: string
  total: number
  relevant: number
  status: string
  uploaded: string
}

interface RecentBatchesProps {
  batches: Batch[]
}

export default function RecentBatches({ batches }: RecentBatchesProps) {
  const statusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (batches.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No batches yet. <Link href="/upload" className="text-blue-600 hover:underline">Upload data</Link> to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Batch</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Month</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Source</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Posts</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {batches.map((batch) => (
            <tr key={batch.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">
                <p className="font-medium text-gray-900">{batch.name}</p>
              </td>
              <td className="px-6 py-4 text-gray-600">{batch.month}</td>
              <td className="px-6 py-4">
                <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {batch.source}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-600">
                {batch.relevant} / {batch.total}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColor(batch.status)}`}>
                  {batch.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <Link href={`/batch/${batch.id}`}>
                  <span className="text-blue-600 hover:underline text-sm font-medium">View</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
