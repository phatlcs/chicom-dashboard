import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// Module-level flag — survives across requests within this single pm2 (fork-mode,
// single-instance) process, preventing two concurrent generations from racing on
// the same output file. Only one report can be generated at a time, by design.
let generating = false

export async function POST(req: NextRequest) {
  const { start, end, slug } = await req.json()

  if (!start || !end || !slug) {
    return NextResponse.json({ error: 'start, end, slug required' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  if (generating) {
    return NextResponse.json({ error: 'A report is already being generated — please wait for it to finish' }, { status: 409 })
  }
  generating = true

  // Next.js runs from nextjs/ subdirectory; backend/ is one level up at project root
  const root = process.cwd()
  const projectRoot = join(root, '..')
  const script = join(projectRoot, 'backend', 'generate_range.py')

  try {
    const out = execSync(
      `python3.9 "${script}" "${start}" "${end}" "${slug}"`,
      { cwd: root, timeout: 300000, encoding: 'utf-8' }
    ).trim()

    const okLine = out.split('\n').find(l => l.startsWith('OK:'))
    if (!okLine) {
      return NextResponse.json({ error: out }, { status: 500 })
    }

    const [, filePath, total, relevant] = okLine.split(':')
    return NextResponse.json({ ok: true, slug, total: Number(total), relevant: Number(relevant) })
  } catch (e: any) {
    return NextResponse.json({ error: e.stderr ?? e.message }, { status: 500 })
  } finally {
    generating = false
  }
}
