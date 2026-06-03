import { pool } from './db'
import { promises as fs } from 'fs'
import path from 'path'

// ============================================================================
// Data generation helpers (mirrors backend/compute.py logic)
// ============================================================================

const MASTER_TOPICS = [
  'Brand/Niche Selection',
  'Product Sourcing',
  'Supply Chain',
  'Listing Optimization',
  'Competitor Analysis',
  'Logistics & Shipping',
  'Customer Service',
  'Marketing & Promotion',
  'Marketplace Policy',
]

const PERSONAS = ['Seller (Amazon)', 'Buyer', 'Service Provider', 'Community Admin', 'Consumer']

export interface PageAggregates {
  metadata: {
    name: string
    timeStart: string
    timeEnd: string
    totalPosts: number
    relevantPosts: number
  }
  Q1: Record<string, number>
  Q2: Record<string, Record<string, number>>
  Q3: Record<string, number>
  Q4?: Record<string, number>
  Q5?: Record<string, number>
  Q6?: Record<string, number>
  Q7?: Record<string, number>
  Q8?: Record<string, number>
  Q9?: Record<string, number>
  Q10?: Record<string, number>
  Q11?: Record<string, number>
  Q12?: Record<string, number>
  Q13?: Record<string, number>
  Q14?: Record<string, number>
}

async function queryQ1(timeStart: string, timeEnd: string): Promise<Record<string, number>> {
  const { rows } = await pool.query(
    `SELECT master_topic, COUNT(*) as count
    FROM pooled_posts_all
    WHERE is_relevant = true
    AND created_date >= $1 AND created_date <= $2
    GROUP BY master_topic
    ORDER BY count DESC`,
    [timeStart, timeEnd]
  )

  const result: Record<string, number> = {}
  rows.forEach((row) => {
    if (row.master_topic) {
      result[row.master_topic] = parseInt(row.count)
    }
  })
  return result
}

async function queryQ2(timeStart: string, timeEnd: string): Promise<Record<string, Record<string, number>>> {
  const { rows } = await pool.query(
    `SELECT master_topic, persona, COUNT(*) as count
    FROM pooled_posts_all
    WHERE is_relevant = true
    AND created_date >= $1 AND created_date <= $2
    GROUP BY master_topic, persona
    ORDER BY master_topic, count DESC`,
    [timeStart, timeEnd]
  )

  const result: Record<string, Record<string, number>> = {}
  rows.forEach((row) => {
    if (row.master_topic && row.persona) {
      if (!result[row.master_topic]) result[row.master_topic] = {}
      result[row.master_topic][row.persona] = parseInt(row.count)
    }
  })
  return result
}

async function queryQ3(timeStart: string, timeEnd: string): Promise<Record<string, number>> {
  const { rows } = await pool.query(
    `SELECT sub_topic, COUNT(*) as count
    FROM pooled_posts_all
    WHERE is_relevant = true
    AND created_date >= $1 AND created_date <= $2
    GROUP BY sub_topic
    ORDER BY count DESC`,
    [timeStart, timeEnd]
  )

  const result: Record<string, number> = {}
  rows.forEach((row) => {
    if (row.sub_topic) {
      result[row.sub_topic] = parseInt(row.count)
    }
  })
  return result
}

async function getPostCount(timeStart: string, timeEnd: string): Promise<{ total: number; relevant: number }> {
  const { rows } = await pool.query(
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN is_relevant = true THEN 1 END) as relevant
    FROM pooled_posts_all
    WHERE created_date >= $1 AND created_date <= $2`,
    [timeStart, timeEnd]
  )

  const counts = rows[0]
  return {
    total: parseInt(counts.total) || 0,
    relevant: parseInt(counts.relevant) || 0,
  }
}

export async function generatePageDataFile(
  slug: string,
  pageId: number,
  timeStart: string,
  timeEnd: string,
  filters: Record<string, any>
): Promise<void> {
  try {
    // Query aggregates for Q1-Q14
    const postCount = await getPostCount(timeStart, timeEnd)
    const Q1 = await queryQ1(timeStart, timeEnd)
    const Q2 = await queryQ2(timeStart, timeEnd)
    const Q3 = await queryQ3(timeStart, timeEnd)

    // TODO: Implement Q4-Q14 queries based on your taxonomy

    const aggregates: PageAggregates = {
      metadata: {
        name: `Report ${slug}`,
        timeStart,
        timeEnd,
        totalPosts: postCount.total,
        relevantPosts: postCount.relevant,
      },
      Q1,
      Q2,
      Q3,
    }

    // Split data: Q1-Q6 go to ChiComData, Q7-Q14 go to ChiComData2
    const dataChiComData = {
      metadata: aggregates.metadata,
      Q1: aggregates.Q1,
      Q2: aggregates.Q2,
      Q3: aggregates.Q3,
      Q4: aggregates.Q4 || {},
      Q5: aggregates.Q5 || {},
      Q6: aggregates.Q6 || {},
    }

    const dataChiComData2 = {
      Q7: aggregates.Q7 || {},
      Q8: aggregates.Q8 || {},
      Q9: aggregates.Q9 || {},
      Q10: aggregates.Q10 || {},
      Q11: aggregates.Q11 || {},
      Q12: aggregates.Q12 || {},
      Q13: aggregates.Q13 || {},
      Q14: aggregates.Q14 || {},
    }

    // Build JS file content
    const jsContent = `// Generated data file for page: ${slug}
// Time range: ${timeStart} to ${timeEnd}
// Generated at: ${new Date().toISOString()}

window.ChiComData = ${JSON.stringify(dataChiComData, null, 2)};

window.ChiComData2 = ${JSON.stringify(dataChiComData2, null, 2)};

window.INSIGHTS = {
  Q1: "Q1 insights generation in progress...",
  Q2: "",
  Q3: "",
  Q4: "",
  Q5: "",
  Q6: "",
  Q7: "",
  Q8: "",
  Q9: "",
  Q10: "",
  Q11: "",
  Q12: "",
  Q13: "",
  Q14: "",
};
`

    // Write file to /var/www/dashboard/pages/{slug}.js
    const dashboardDir = '/var/www/dashboard/pages'
    const filePath = path.join(dashboardDir, `${slug}.js`)

    // Ensure directory exists
    try {
      await fs.mkdir(dashboardDir, { recursive: true })
    } catch (err) {
      // Directory might already exist
    }

    await fs.writeFile(filePath, jsContent, 'utf-8')
    console.log(`✓ Generated ${filePath}`)
  } catch (error) {
    console.error(`Failed to generate data file for ${slug}:`, error)
    throw error
  }
}
