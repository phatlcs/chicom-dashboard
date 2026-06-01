import { sql } from '@vercel/postgres'

export async function getStats() {
  try {
    const result = await sql`
      SELECT
        COUNT(DISTINCT id) as total_batches,
        SUM(total_posts) as total_posts,
        SUM(posts_relevant) as total_relevant,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed
      FROM data_batches
    `

    return result.rows[0]
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}

export async function getRecentBatches(limit: number = 5) {
  try {
    const result = await sql`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at
      FROM data_batches
      ORDER BY uploaded_at DESC
      LIMIT ${limit}
    `

    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}

export async function getBatchDetails(batchId: number) {
  try {
    const result = await sql`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at, processing_completed_at
      FROM data_batches
      WHERE id = ${batchId}
    `

    return result.rows[0]
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}

export async function getAllBatches() {
  try {
    const result = await sql`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at
      FROM data_batches
      ORDER BY month_year DESC, uploaded_at DESC
    `

    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}

export async function getBatchesByMonth(month: string) {
  try {
    const result = await sql`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at
      FROM data_batches
      WHERE TO_CHAR(month_year, 'YYYY-MM') = ${month}
      ORDER BY uploaded_at DESC
    `

    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}
