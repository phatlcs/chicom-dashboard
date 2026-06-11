import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chicom_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
})

export async function GET(req: NextRequest) {
  const pageSlug = req.nextUrl.searchParams.get('page_slug') || req.nextUrl.searchParams.get('slug')

  if (!pageSlug) {
    return NextResponse.json({ Q1: null, Q2: null })
  }

  try {
    const client = await pool.connect()
    const res = await client.query(
      'SELECT insights FROM page_insights WHERE page_slug = $1',
      [pageSlug]
    )
    client.release()

    if (res.rows.length > 0) {
      const insights = res.rows[0].insights || {}
      return NextResponse.json(insights)
    }

    return NextResponse.json({})
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json({})
  }
}
