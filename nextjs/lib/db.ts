import { Pool } from 'postgres'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'chicom_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'chicom2024',
})

export async function getStats() {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT id) as total_batches,
        COALESCE(SUM(total_posts), 0) as total_posts,
        COALESCE(SUM(posts_relevant), 0) as total_relevant,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END), 0) as processing,
        COALESCE(SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END), 0) as failed
      FROM data_batches
    `)

    return result.rows[0] || {}
  } catch (error) {
    console.error('Database error:', error)
    return {}
  }
}

export async function getRecentBatches(limit: number = 5) {
  try {
    const result = await pool.query(`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at
      FROM data_batches
      ORDER BY uploaded_at DESC
      LIMIT $1
    `, [limit])

    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    return []
  }
}

export async function getBatchDetails(batchId: number) {
  try {
    const result = await pool.query(`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at, processing_completed_at
      FROM data_batches
      WHERE id = $1
    `, [batchId])

    return result.rows[0] || null
  } catch (error) {
    console.error('Database error:', error)
    return null
  }
}

export async function getAllBatches() {
  try {
    const result = await pool.query(`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at
      FROM data_batches
      ORDER BY month_year DESC, uploaded_at DESC
    `)

    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    return []
  }
}

export async function getBatchesByMonth(month: string) {
  try {
    const result = await pool.query(`
      SELECT id, batch_name, month_year, source, total_posts, posts_relevant, status, uploaded_at
      FROM data_batches
      WHERE TO_CHAR(month_year, 'YYYY-MM') = $1
      ORDER BY uploaded_at DESC
    `, [month])

    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    return []
  }
}
