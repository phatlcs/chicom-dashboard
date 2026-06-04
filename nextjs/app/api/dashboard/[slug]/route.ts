import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  const htmlPath = join(process.cwd(), 'public', 'dashboard', 'index.html')

  let html: string
  try {
    html = readFileSync(htmlPath, 'utf-8')
  } catch {
    return new NextResponse('Dashboard not found', { status: 404 })
  }

  // Inject slug before any scripts run
  html = html.replace(
    '<script>',
    `<script>window.__REPORT_SLUG__ = ${JSON.stringify(slug)};</script>\n<script>`
  )

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
