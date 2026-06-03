import { NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chicom_dashboard',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'chicom2024',
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const month = url.searchParams.get('month')

    if (!month) {
      return NextResponse.json(
        { status: 'error', detail: 'month parameter required' },
        { status: 400 }
      )
    }

    const batches = await sql`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at
      FROM data_batches
      WHERE TO_CHAR(month_year, 'YYYY-MM') = ${month}
      ORDER BY uploaded_at DESC
    `

    return NextResponse.json({
      status: 'success',
      month,
      batches: batches.map((b: any) => ({
        id: b.id,
        batch_name: b.batch_name,
        month: b.month_year.toISOString().split('T')[0].slice(0, 7),
        source: b.source,
        total: b.total_posts,
        relevant: b.posts_relevant,
        status: b.status,
        uploaded_at: b.uploaded_at,
      })),
    })
  } catch (error) {
    console.error('Error fetching batches:', error)
    return NextResponse.json(
      { status: 'error', detail: 'Failed to fetch batches' },
      { status: 500 }
    )
  }
}
