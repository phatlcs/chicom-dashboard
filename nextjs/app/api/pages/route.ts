'use server'

import { sql } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const pages = await sql`
      SELECT id, page_slug, page_name, time_range_start, time_range_end, page_type, total_posts, relevant_posts, status
      FROM pages
      ORDER BY created_at DESC
    `

    return Response.json({
      status: 'success',
      pages: pages.map((page) => ({
        id: page.id,
        slug: page.page_slug,
        name: page.page_name,
        timeStart: page.time_range_start,
        timeEnd: page.time_range_end,
        type: page.page_type,
        totalPosts: page.total_posts,
        relevantPosts: page.relevant_posts,
        status: page.status,
      })),
    })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return Response.json(
      { status: 'error', message: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}
