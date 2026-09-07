import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { join } from 'path'
import { AUTH_COOKIE, getRoleFromToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Experimental v2 generate: runs backend/report_store.py which computes the
// Q1..Q14 aggregates and persists ONE row into report_data (NO static HTML is
// written — that's the old system). The new slug is served back dynamically
// from the DB by GET /report-v2/<slug>. Old /api/generate is untouched.
let generating = false

export async function POST(req: NextRequest) {
  const role = getRoleFromToken(req.cookies.get(AUTH_COOKIE)?.value)
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { start, end, slug } = body
  // Free-form name is interpolated into a shell command below — restrict to a
  // safe charset so it can't inject anything.
  const reportName = String(body.reportName || slug || '')
    .replace(/[^a-zA-Z0-9À-ỹà-ỳ\u00C0-\u017F \-/.,()]/g, ' ')
    .trim()
    .slice(0, 80)
  const withInsights = body.insights !== false

  if (!start || !end || !slug) {
    return NextResponse.json({ error: 'start, end, slug required' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug (a-z 0-9 _ -)' }, { status: 400 })
  }

  if (generating) {
    return NextResponse.json({ error: 'A report is already being generated — please wait' }, { status: 409 })
  }
  generating = true

  const projectRoot = join(process.cwd(), '..')
  const script = join(projectRoot, 'backend', 'report_store.py')

  try {
    const args = [`python3.9`, script, start, end, slug, reportName || slug]
    if (!withInsights) args.push('--no-llm')
    const cmd = args.map(a => `"${a}"`).join(' ')
    const out = execSync(cmd, { cwd: process.cwd(), timeout: 420000, encoding: 'utf-8' }).trim()

    const storedLine = out.split('\n').find(l => l.startsWith('STORED:'))
    if (!storedLine) {
      return NextResponse.json({ error: out }, { status: 500 })
    }
    // STORED:<id>:<slug>:<start>:<end>:<total>:<relevant>:insights=<N>
    const parts = storedLine.split(':')
    const id = Number(parts[1])
    const total = Number(parts[5])
    const relevant = Number(parts[6])
    const insCount = parts[7]?.replace(/^insights=/, '') ?? '0'

    return NextResponse.json({
      ok: true,
      slug,
      id,
      totalPosts: total,
      relevantPosts: relevant,
      insights: Number(insCount),
      viewUrl: `/report-v2/${slug}`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.stderr ?? e.message }, { status: 500 })
  } finally {
    generating = false
  }
}