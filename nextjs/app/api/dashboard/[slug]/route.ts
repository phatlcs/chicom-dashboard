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

  // Insert data as a separate <script src> tag — same pattern as original Vercel version
  html = html.replace(
    '<script>',
    `<script src="/dashboard/pages/${slug}.js"></script>\n<script>`
  )

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
