import { readdirSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const publicDir = join(process.cwd(), 'public')
    const files = readdirSync(publicDir).filter(f => f.endsWith('.html'))

    const pages = files.map(f => {
      const slug = f.replace('.html', '')
      return {
        id: slug,
        slug,
        name: slug.toUpperCase(),
        timeStart: null,
        timeEnd: null,
        type: 'REPORT',
        totalPosts: null,
        relevantPosts: null,
        status: 'ACTIVE',
      }
    })

    return Response.json({ status: 'success', pages })
  } catch (error) {
    return Response.json({ status: 'success', pages: [] })
  }
}
