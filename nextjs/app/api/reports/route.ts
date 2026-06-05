import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const REPORTS_FILE = join(process.cwd(), 'data', 'reports.json')

function loadReports() {
  try {
    if (existsSync(REPORTS_FILE)) {
      return JSON.parse(readFileSync(REPORTS_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

function saveReports(reports: any[]) {
  const { mkdirSync } = require('fs')
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2))
}

export async function GET() {
  return NextResponse.json(loadReports())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const reports = loadReports()
  // Upsert by slug
  const idx = reports.findIndex((r: any) => r.slug === body.slug)
  if (idx >= 0) reports[idx] = body
  else reports.unshift(body)
  saveReports(reports)
  return NextResponse.json({ ok: true })
}
