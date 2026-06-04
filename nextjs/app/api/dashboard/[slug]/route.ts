import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  const filePath = join(process.cwd(), 'public', `${slug}.html`)

  let html: string
  try {
    html = readFileSync(filePath, 'utf-8')
  } catch {
    return new NextResponse(`Report "${slug}" not found`, { status: 404 })
  }

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
