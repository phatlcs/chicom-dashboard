import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, checkCredentials, makeSessionToken } from '@/lib/auth'
import { findUser } from '@/lib/users'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  // Check hardcoded users (admin + built-in viewer) first
  const hardcoded = checkCredentials(username, password)
  if (hardcoded) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set(AUTH_COOKIE, makeSessionToken(username), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  }

  // Check dynamically-created viewer accounts in data/users.json
  const managed = findUser(username, password)
  if (managed) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set(AUTH_COOKIE, makeSessionToken('viewer'), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  }

  return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
}
