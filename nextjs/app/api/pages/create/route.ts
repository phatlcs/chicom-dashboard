'use server'

import { sql } from '@/lib/db'
import { generatePageDataFile } from '@/lib/generate-data'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function getUniqueSlug(baseName: string): Promise<{ slug: string; finalName: string }> {
  const baseSlug = slugify(baseName)

  // Try to find existing page with this slug
  const existing = await sql`
    SELECT page_name FROM pages WHERE page_slug = ${baseSlug}
  `

  if (existing.length === 0) {
    // No conflict, use as-is
    return { slug: baseSlug, finalName: baseName }
  }

  // Conflict exists, use auto-increment
  let version = 1
  let newSlug = `${baseSlug}(${version})`
  let conflict = true

  while (conflict) {
    const found = await sql`
      SELECT id FROM pages WHERE page_slug = ${newSlug}
    `
    if (found.length === 0) {
      conflict = false
    } else {
      version++
      newSlug = `${baseSlug}(${version})`
    }
  }

  return { slug: newSlug, finalName: `${baseName}(${version})` }
}

export async function POST(req: Request) {
  try {
    const { name, timeStart, timeEnd, filters = {} } = await req.json()

    if (!name || !timeStart || !timeEnd) {
      return Response.json(
        { status: 'error', message: 'Missing required fields: name, timeStart, timeEnd' },
        { status: 400 }
      )
    }

    // Get unique slug
    const { slug, finalName } = await getUniqueSlug(name)

    // Count posts for this page
    const counts = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_relevant = true THEN 1 END) as relevant
      FROM pooled_posts_all
      WHERE created_date >= ${timeStart}::date AND created_date <= ${timeEnd}::date
    `

    const postCount = counts[0] || { total: 0, relevant: 0 }

    // Create page record
    const pages = await sql`
      INSERT INTO pages
        (page_slug, page_name, time_range_start, time_range_end, filters, page_type, total_posts, relevant_posts, status)
      VALUES (${slug}, ${finalName}, ${timeStart}::date, ${timeEnd}::date, ${JSON.stringify(filters)}::jsonb, 'custom', ${parseInt(postCount.total)}, ${parseInt(postCount.relevant)}, 'PROCESSING')
      RETURNING id
    `

    const pageId = pages[0].id

    // Generate insights (async - fire and forget for now)
    // TODO: Call Python backend for LLM insight generation
    const insights = {
      Q1: 'Insight generation in progress...',
      Q2: '',
      Q3: '',
      Q4: '',
      Q5: '',
      Q6: '',
      Q7: '',
      Q8: '',
      Q9: '',
      Q10: '',
      Q11: '',
      Q12: '',
      Q13: '',
      Q14: '',
    }

    // Store insights
    await sql`
      INSERT INTO page_insights (page_id, page_slug, insights, sample_post_ids)
      VALUES (${pageId}, ${slug}, ${JSON.stringify(insights)}::jsonb, ${JSON.stringify({})}::jsonb)
    `

    // Generate data file
    try {
      await generatePageDataFile(slug, pageId, timeStart, timeEnd, filters)
    } catch (err) {
      console.error('Failed to generate data file:', err)
      // Continue anyway - page is created, data file generation can be retried
    }

    // Update status to ACTIVE
    await sql`UPDATE pages SET status = 'ACTIVE' WHERE id = ${pageId}`

    return Response.json({
      status: 'success',
      slug,
      name: finalName,
      url: `/${slug}`,
      message: `Report "${finalName}" created successfully`,
    })
  } catch (error) {
    console.error('Error creating page:', error)
    return Response.json(
      { status: 'error', message: 'Failed to create page', error: String(error) },
      { status: 500 }
    )
  }
}
