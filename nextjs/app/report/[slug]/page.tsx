import { readFile } from 'fs/promises'
import { join } from 'path'
import type { CSSProperties } from 'react'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

const IFRAME_STYLE: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  border: 'none',
  zIndex: 1,
}

export default async function ReportPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    return <div className="py-16 text-center text-gray-500">Invalid report slug.</div>
  }

  let src: string | null = null

  try {
    const rows = await sql`SELECT 1 FROM report_data WHERE slug = ${slug} LIMIT 1`
    if (rows.length) src = `/report-v2/${slug}`
  } catch {
    src = null
  }

  if (!src) {
    try {
      await readFile(join(process.cwd(), 'public', `${slug}.html`))
      src = `/api/report/${slug}`
    } catch {
      src = null
    }
  }

  if (!src) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Report not found</h1>
        <p className="text-gray-500 mt-2">No report data or file exists for &ldquo;{slug}&rdquo;.</p>
      </div>
    )
  }

  return <iframe src={src} title={slug} style={IFRAME_STYLE} />
}