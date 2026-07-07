import { NextRequest, NextResponse } from 'next/server'
import { loadUsers, saveUsers, ManagedUser } from '@/lib/users'

export const dynamic = 'force-dynamic'

export async function GET() {
  const users = loadUsers().map(u => ({ username: u.username, role: u.role, createdAt: u.createdAt }))
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
  }
  if (username === 'admin' || username === 'viewer') {
    return NextResponse.json({ error: 'That username is reserved' }, { status: 400 })
  }

  const users = loadUsers()
  if (users.some(u => u.username === username)) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
  }

  const newUser: ManagedUser = {
    username: username.trim(),
    password: password.trim(),
    role: 'viewer',
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  saveUsers(users)

  return NextResponse.json({ status: 'success', username: newUser.username })
}

export async function DELETE(req: NextRequest) {
  const { username } = await req.json()
  const users = loadUsers().filter(u => u.username !== username)
  saveUsers(users)
  return NextResponse.json({ status: 'success' })
}
