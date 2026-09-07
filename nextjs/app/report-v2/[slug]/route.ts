import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Experimental v2 viewer: renders the SAME dashboard (React + Babel renderer
// from /dashboard/*.jsx) but with data pulled live from the report_data row
// instead of from a static HTML file. The old /api/report/<slug> static flow
// is untouched.
const DATA_ANCHOR = `<script>
  // Expose globals so JSX files can access D and D2 without relying on
  // Babel's const-to-var transpilation to leak across script boundaries.
  window.D = window.ChiComData;
  window.D2 = window.ChiComData2;
</script>`

function safeJson(value: unknown): string {
  // JSON.stringify escapes most things but NOT "</script>" — escape forward
  // slash so embedded post content can't break out of the HTML <script> tag.
  return JSON.stringify(value ?? null).replace(/<\//g, '<\\/')
}

export async function GET(_req: NextRequest, ctx: { params: { slug: string } }) {
  const { slug } = ctx.params
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Bad slug' }, { status: 400 })
  }

  let rows: any[]
  try {
    rows = await sql`
      SELECT slug, report_name, time_start, time_end, total_posts, relevant_posts,
             months, groups, questions, insights, snapshot
      FROM report_data WHERE slug = ${slug} LIMIT 1
    `
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!rows.length) {
    return NextResponse.json({ error: `No report_data row for "${slug}"` }, { status: 404 })
  }

  const r = rows[0]
  const snapshot = r.snapshot ?? {}
  const d1 = snapshot.d1 ?? {}
  const d2 = snapshot.d2 ?? {}
  const tc = snapshot.topicColors ?? []
  const insights = r.insights ?? {}

  let template: string
  try {
    template = await readFile(join(process.cwd(), 'public', 'dashboard', 'index.html'), 'utf-8')
  } catch {
    return NextResponse.json({ error: 'Dashboard template not found' }, { status: 500 })
  }

  if (!template.includes(DATA_ANCHOR)) {
    return NextResponse.json({ error: 'Template data anchor missing' }, { status: 500 })
  }

  const injected = `<script>
window.TOPIC_COLORS = ${safeJson(tc)};
window.ChiComData = ${safeJson(d1)};
window.ChiComData2 = ${safeJson(d2)};
window.D = window.ChiComData;
window.D2 = window.ChiComData2;
window.ExpertInsights = ${safeJson(insights)};
</script>`

  const html = template.replace(DATA_ANCHOR, injected)
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}