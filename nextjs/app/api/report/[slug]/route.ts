import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const filePath = join(process.cwd(), 'public', `${slug}.html`)
  try {
    const html = await readFile(filePath, 'utf-8')
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch {
    return NextResponse.json({ error: 'Report not found — generate it first' }, { status: 404 })
  }
}

export async function HEAD(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    return new NextResponse(null, { status: 400 })
  }

  const filePath = join(process.cwd(), 'public', `${slug}.html`)
  try {
    await readFile(filePath)
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
