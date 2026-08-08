import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, getRoleFromToken } from '@/lib/auth'

// Only admin may access these paths; viewers are redirected/403'd
const ADMIN_ONLY = ['/generate-report', '/admin', '/api/upload-data', '/api/pages/create', '/api/admin', '/api/export-raw']

export function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const role = getRoleFromToken(token)

  if (!role) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized — log in at /login' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (role === 'viewer' && ADMIN_ONLY.some(p => req.nextUrl.pathname.startsWith(p))) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!login$|api/auth/login|api/auth/logout|_next/static|_next/image|favicon.ico).*)',
  ],
}
