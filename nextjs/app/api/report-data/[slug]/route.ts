import { NextResponse } from 'next/server'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { runInNewContext } from 'vm'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug
  const filePath = join(process.cwd(), 'public', 'dashboard', 'pages', `${slug}.js`)

  let js: string
  try {
    js = readFileSync(filePath, 'utf-8')
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const ctx: any = { window: {} }
    runInNewContext(js, ctx)
    const D = ctx.window.ChiComData
    const D2 = ctx.window.ChiComData2

    return NextResponse.json({
      slug,
      kpi: D?.KPI ?? {},
      masterTopics: D?.Q1_MASTER ?? [],
      personas: D?.PERSONAS ?? [],
      metadata: D?.KPI ?? {},
    })
  } catch (e) {
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
  }
}

export async function GET_LIST() {
  const dir = join(process.cwd(), 'public', 'dashboard', 'pages')
  const files = readdirSync(dir).filter(f => f.endsWith('.js') && f !== '.gitkeep')
  return NextResponse.json({ slugs: files.map(f => f.replace('.js', '')) })
}
