import { NextResponse } from 'next/server'
import { getStats, getRecentBatches } from '@/lib/db'

export async function GET() {
  try {
    const stats = await getStats()
    const latestBatches = await getRecentBatches(5)

    const formattedBatches = latestBatches.map((batch: any) => ({
      id: batch.id,
      name: batch.batch_name,
      month: batch.month_year.toISOString().split('T')[0].slice(0, 7),
      source: batch.source,
      total: batch.total_posts,
      relevant: batch.posts_relevant,
      status: batch.status,
      uploaded: batch.uploaded_at.toISOString(),
    }))

    return NextResponse.json({
      status: 'success',
      stats: {
        total_batches: parseInt(stats.total_batches || '0'),
        total_posts: parseInt(stats.total_posts || '0'),
        total_relevant: parseInt(stats.total_relevant || '0'),
        batches_by_status: {
          completed: parseInt(stats.completed || '0'),
          processing: parseInt(stats.processing || '0'),
          failed: parseInt(stats.failed || '0'),
        },
        latest_batches: formattedBatches,
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { status: 'error', detail: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
