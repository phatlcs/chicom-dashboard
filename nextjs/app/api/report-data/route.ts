import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/report-data — list all reports stored in report_data (no aggregation).
export async function GET() {
  try {
    const rows = await sql`
      SELECT slug, report_name, time_start, time_end, total_posts, relevant_posts, updated_at
      FROM report_data
      ORDER BY time_start DESC, updated_at DESC
    `
    return NextResponse.json({ reports: rows })
  } catch (error) {
    console.error('report-data list error:', error)
    return NextResponse.json({ reports: [] }, { status: 500 })
  }
}