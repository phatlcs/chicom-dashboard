import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const dashboardIndexPath = join(process.cwd(), 'public/dashboard/index.html')
    let html = await readFile(dashboardIndexPath, 'utf-8')

    // Inject slug into the HTML so the dashboard knows which data file to load
    html = html.replace(
      '<script>',
      `<script>
        window.__REPORT_SLUG__ = "${params.slug}";
      </script>
      <script>`
    )

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return new Response('Dashboard not found', { status: 404 })
  }
}
