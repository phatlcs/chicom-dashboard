import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/report-data/<slug> — read a stored dynamic report from report_data.
// Returns the per-question precomputed data + questions + insights + snapshot
// without re-running any aggregation over pooled_posts_all.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  try {
    const rows = await sql`
      SELECT slug, report_name, time_start, time_end, total_posts, relevant_posts,
             months, groups, questions, queries, insights, snapshot, created_at, updated_at
      FROM report_data
      WHERE slug = ${slug}
    `
    if (!rows.length) {
      return NextResponse.json({ error: 'report not found in report_data' }, { status: 404 })
    }

    const r = rows[0]
    return NextResponse.json({
      slug: r.slug,
      reportName: r.report_name,
      timeStart: r.time_start,
      timeEnd: r.time_end,
      totalPosts: r.total_posts,
      relevantPosts: r.relevant_posts,
      months: r.months,
      groups: r.groups,
      questions: r.questions,
      queries: r.queries,
      insights: r.insights,
      snapshot: r.snapshot,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })
  } catch (error) {
    console.error('report-data error:', error)
    return NextResponse.json({ error: 'db error' }, { status: 500 })
  }
}

export async function HEAD(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    return new NextResponse(null, { status: 400 })
  }
  try {
    const rows = await sql`
      SELECT 1 FROM report_data WHERE slug = ${slug} LIMIT 1
    `
    return new NextResponse(null, { status: rows.length ? 200 : 404 })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}