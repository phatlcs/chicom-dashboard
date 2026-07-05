import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

export const dynamic = 'force-dynamic'

const REPORTS_FILE = join(process.cwd(), 'data', 'reports.json')

function loadReports(): any[] {
  try {
    if (existsSync(REPORTS_FILE)) return JSON.parse(readFileSync(REPORTS_FILE, 'utf-8'))
  } catch {}
  return []
}

function saveReports(reports: any[]) {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2))
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip Vietnamese diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'report'
}

export async function POST(req: NextRequest) {
  const { name, timeStart, timeEnd } = await req.json()

  if (!name || !timeStart || !timeEnd) {
    return NextResponse.json({ status: 'error', message: 'name, timeStart, timeEnd required' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(timeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(timeEnd)) {
    return NextResponse.json({ status: 'error', message: 'Invalid date format' }, { status: 400 })
  }

  const reports = loadReports()
  const baseSlug = slugify(name)
  const existingSlugs = new Set(reports.map((r: any) => r.slug))
  let slug = baseSlug
  let n = 1
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${n}`
    n++
  }

  const root = process.cwd()
  const projectRoot = join(root, '..')
  const script = join(projectRoot, 'backend', 'generate_range.py')

  try {
    const out = execSync(
      `python3.9 "${script}" "${timeStart}" "${timeEnd}" "${slug}" insights`,
      { cwd: root, timeout: 300000, encoding: 'utf-8' }
    ).trim()

    const okLine = out.split('\n').find(l => l.startsWith('OK:'))
    if (!okLine) {
      return NextResponse.json({ status: 'error', message: out }, { status: 500 })
    }

    const [, , total, relevant] = okLine.split(':')

    reports.unshift({
      slug,
      name,
      timeStart,
      timeEnd,
      type: 'CUSTOM',
      status: 'ACTIVE',
      totalPosts: Number(total),
      relevantPosts: Number(relevant),
      createdAt: new Date().toISOString(),
    })
    saveReports(reports)

    return NextResponse.json({ status: 'success', slug, total: Number(total), relevant: Number(relevant) })
  } catch (e: any) {
    return NextResponse.json({ status: 'error', message: e.stderr ?? e.message }, { status: 500 })
  }
}
