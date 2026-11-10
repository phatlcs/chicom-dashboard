import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Single source of truth for serving static report HTML from public/<slug>.html.
// Used by BOTH /api/report/<slug> (legacy links, custom-report cards, iframes)
// and /report/<slug> (clean address-bar URL). Keep both routes thin wrappers.

const SLUG_RE = /^[a-z0-9_-]+$/

export async function serveStaticReport(_req: NextRequest, ctx: { params: { slug: string } }) {
  const { slug } = ctx.params
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  try {
    const html = await readFile(join(process.cwd(), 'public', `${slug}.html`), 'utf-8')
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch {
    return NextResponse.json({ error: 'Report not found — generate it first' }, { status: 404 })
  }
}

export async function headStaticReport(_req: NextRequest, ctx: { params: { slug: string } }) {
  const { slug } = ctx.params
  if (!SLUG_RE.test(slug)) {
    return new NextResponse(null, { status: 400 })
  }

  try {
    await readFile(join(process.cwd(), 'public', `${slug}.html`))
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}