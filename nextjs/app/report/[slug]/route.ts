import { serveStaticReport, headStaticReport } from '@/lib/serve-report'

export const dynamic = 'force-dynamic'

export const GET = serveStaticReport
export const HEAD = headStaticReport