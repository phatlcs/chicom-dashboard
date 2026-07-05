import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

export async function POST(req: NextRequest) {
  let tmpPath = ''
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? '.xlsx' : '.csv'
    tmpPath = join(tmpdir(), `boost_upload_${Date.now()}${ext}`)

    const bytes = await file.arrayBuffer()
    writeFileSync(tmpPath, Buffer.from(bytes))

    const batchLabel = (form.get('batchLabel') as string) || file.name.replace(/\.[^.]+$/, '')

    const root = join(process.cwd(), '..')
    const script = join(root, 'backend', 'import_data.py')

    let stdout = ''
    try {
      stdout = execSync(
        `python3.9 "${script}" "${tmpPath}" "${batchLabel}"`,
        { cwd: root, timeout: 120_000, encoding: 'utf-8' }
      ).trim()
    } catch (err: any) {
      const msg = err.stderr || err.message || 'Import script failed'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    // stdout format: OK:<inserted>:<skipped>:<total>:<errors>
    if (!stdout.startsWith('OK:')) {
      return NextResponse.json({ error: stdout }, { status: 500 })
    }
    const [, inserted, skipped, total, errors] = stdout.split(':')
    return NextResponse.json({
      status: 'success',
      inserted: Number(inserted),
      skipped: Number(skipped),
      total: Number(total),
      errors: Number(errors),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (tmpPath && existsSync(tmpPath)) {
      try { unlinkSync(tmpPath) } catch {}
    }
  }
}
