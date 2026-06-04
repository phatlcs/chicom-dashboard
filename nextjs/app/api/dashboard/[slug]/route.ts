import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  const htmlPath = join(process.cwd(), 'public', 'dashboard', 'index.html')
  const dataPath = join(process.cwd(), 'public', 'dashboard', 'pages', `${slug}.js`)

  let html: string
  try {
    html = readFileSync(htmlPath, 'utf-8')
  } catch {
    return new NextResponse('Dashboard not found', { status: 404 })
  }

  let dataJs: string
  try {
    dataJs = readFileSync(dataPath, 'utf-8')
  } catch {
    dataJs = 'window.ChiComData={}; window.ChiComData2={};'
  }

  // Inline the data directly — no XHR race condition
  html = html.replace(
    '<script>',
    `<script>\n${dataJs}\n</script>\n<script>`
  )

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
