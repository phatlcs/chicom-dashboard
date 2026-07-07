import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

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
