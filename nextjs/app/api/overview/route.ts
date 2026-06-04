import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres({
  host: 'localhost', port: 5432, database: 'chicom_dashboard', username: 'postgres', password: '',
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 })
  }

  try {
    const [kpi] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_relevant) as relevant,
        COUNT(DISTINCT created_date) as days,
        MIN(created_date) as date_start,
        MAX(created_date) as date_end
      FROM pooled_posts_all
      WHERE created_date BETWEEN ${start}::date AND ${end}::date
    `

    const topics = await sql`
      SELECT master_topic, COUNT(*) as count
      FROM pooled_posts_all
      WHERE is_relevant = true
        AND created_date BETWEEN ${start}::date AND ${end}::date
        AND master_topic IS NOT NULL
      GROUP BY master_topic
      ORDER BY count DESC
      LIMIT 10
    `

    const personas = await sql`
      SELECT persona, COUNT(*) as count
      FROM pooled_posts_all
      WHERE is_relevant = true
        AND created_date BETWEEN ${start}::date AND ${end}::date
        AND persona IS NOT NULL
      GROUP BY persona
      ORDER BY count DESC
    `

    const sentiment = await sql`
      SELECT sentiment, COUNT(*) as count
      FROM pooled_posts_all
      WHERE is_relevant = true
        AND created_date BETWEEN ${start}::date AND ${end}::date
        AND sentiment IS NOT NULL
      GROUP BY sentiment
      ORDER BY count DESC
    `

    const daily = await sql`
      SELECT created_date::text as date, COUNT(*) as count
      FROM pooled_posts_all
      WHERE is_relevant = true
        AND created_date BETWEEN ${start}::date AND ${end}::date
      GROUP BY created_date
      ORDER BY created_date
    `

    return NextResponse.json({ kpi, topics, personas, sentiment, daily })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
