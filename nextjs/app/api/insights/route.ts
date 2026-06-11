import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chicom_dashboard',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
})

export async function GET(req: NextRequest) {
  const pageSlug = req.nextUrl.searchParams.get('page_slug') || req.nextUrl.searchParams.get('slug')

  if (!pageSlug) {
    return NextResponse.json({})
  }

  try {
    const rows = await sql`
      SELECT insights FROM page_insights WHERE page_slug = ${pageSlug}
    `
    if (rows.length > 0) {
      return NextResponse.json(rows[0].insights || {})
    }
    return NextResponse.json({})
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json({})
  }
}
