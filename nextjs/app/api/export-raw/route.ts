import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { join } from 'path'
import { readFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { name, timeStart, timeEnd } = await req.json()

  if (!timeStart || !timeEnd) {
    return NextResponse.json({ error: 'timeStart and timeEnd required' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(timeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(timeEnd)) {
    return NextResponse.json({ error: 'Invalid date format — use YYYY-MM-DD' }, { status: 400 })
  }

  const safeName = (name || `export_${timeStart}_${timeEnd}`).replace(/[^a-zA-Z0-9_\- ]/g, '').trim()
  const outPath = join(tmpdir(), `boost_export_${Date.now()}.xlsx`)
  const root = process.cwd()
  const script = join(root, '..', 'backend', 'export_raw.py')

  try {
    const out = execSync(
      `python3.9 "${script}" "${timeStart}" "${timeEnd}" "${outPath}"`,
      { cwd: root, timeout: 60000, encoding: 'utf-8' }
    ).trim()

    const okLine = out.split('\n').find(l => l.startsWith('OK:'))
    if (!okLine || !existsSync(outPath)) {
      return NextResponse.json({ error: out || 'Export failed' }, { status: 500 })
    }

    const rowCount = parseInt(okLine.split(':')[1] ?? '0')
    const buf = readFileSync(outPath)
    unlinkSync(outPath)

    const filename = `${safeName}.xlsx`.replace(/ /g, '_')
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Row-Count': String(rowCount),
      },
    })
  } catch (e: any) {
    if (existsSync(outPath)) unlinkSync(outPath)
    return NextResponse.json({ error: e.stderr ?? e.message }, { status: 500 })
  }
}
