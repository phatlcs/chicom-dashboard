import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const REPORTS_FILE = join(process.cwd(), 'data', 'reports.json')

export async function GET() {
  try {
    if (!existsSync(REPORTS_FILE)) {
      return Response.json({ status: 'success', pages: [] })
    }
    const reports: any[] = JSON.parse(readFileSync(REPORTS_FILE, 'utf-8'))
    const pages = reports.map((r: any) => ({
      id: r.slug,
      slug: r.slug,
      name: r.name ?? r.slug,
      timeStart: r.timeStart ?? null,
      timeEnd: r.timeEnd ?? null,
      type: r.type ?? 'CUSTOM',
      totalPosts: r.totalPosts ?? null,
      relevantPosts: r.relevantPosts ?? null,
      status: r.status ?? 'ACTIVE',
      createdAt: r.createdAt ?? null,
    }))
    return Response.json({ status: 'success', pages })
  } catch {
    return Response.json({ status: 'success', pages: [] })
  }
}

export async function DELETE(req: NextRequest) {
  const { slug } = await req.json()
  if (!slug || !/^[a-z0-9_-]+$/.test(slug)) {
    return Response.json({ error: 'Invalid slug' }, { status: 400 })
  }
  try {
    if (!existsSync(REPORTS_FILE)) {
      return Response.json({ status: 'success' })
    }
    const reports: any[] = JSON.parse(readFileSync(REPORTS_FILE, 'utf-8'))
    const filtered = reports.filter((r: any) => r.slug !== slug)
    mkdirSync(join(process.cwd(), 'data'), { recursive: true })
    writeFileSync(REPORTS_FILE, JSON.stringify(filtered, null, 2))
    return Response.json({ status: 'success' })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
