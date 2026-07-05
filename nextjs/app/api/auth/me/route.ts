import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, getRoleFromToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const role = getRoleFromToken(token)
  return NextResponse.json({ role })
}
