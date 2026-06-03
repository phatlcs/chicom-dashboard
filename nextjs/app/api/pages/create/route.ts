'use server'

import { pool } from '@/lib/db'
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
  const { rows } = await pool.query(
    'SELECT page_name FROM pages WHERE page_slug = $1',
    [baseSlug]
  )

  if (rows.length === 0) {
    // No conflict, use as-is
    return { slug: baseSlug, finalName: baseName }
  }

  // Conflict exists, use auto-increment
  let version = 1
  let newSlug = `${baseSlug}(${version})`
  let conflict = true

  while (conflict) {
    const { rows: existing } = await pool.query(
      'SELECT id FROM pages WHERE page_slug = $1',
      [newSlug]
    )
    if (existing.length === 0) {
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
    const countResult = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_relevant = true THEN 1 END) as relevant
      FROM pooled_posts_all
      WHERE created_date >= $1 AND created_date <= $2`,
      [timeStart, timeEnd]
    )

    const postCount = countResult.rows[0] || { total: 0, relevant: 0 }

    // Create page record
    const { rows: pages } = await pool.query(
      `INSERT INTO pages
        (page_slug, page_name, time_range_start, time_range_end, filters, page_type, total_posts, relevant_posts, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        slug,
        finalName,
        timeStart,
        timeEnd,
        JSON.stringify(filters),
        'custom',
        postCount.total,
        postCount.relevant,
        'PROCESSING',
      ]
    )

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
    await pool.query(
      `INSERT INTO page_insights (page_id, page_slug, insights, sample_post_ids)
      VALUES ($1, $2, $3, $4)`,
      [pageId, slug, JSON.stringify(insights), JSON.stringify({})]
    )

    // Generate data file
    try {
      await generatePageDataFile(slug, pageId, timeStart, timeEnd, filters)
    } catch (err) {
      console.error('Failed to generate data file:', err)
      // Continue anyway - page is created, data file generation can be retried
    }

    // Update status to ACTIVE
    await pool.query('UPDATE pages SET status = $1 WHERE id = $2', ['ACTIVE', pageId])

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
