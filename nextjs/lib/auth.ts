// Two fixed users: admin (create reports + upload) and viewer (read-only).
// Opaque static tokens — no crypto needed, Edge-runtime compatible.

export type Role = 'admin' | 'viewer'

interface User {
  username: string
  password: string
  role: Role
  token: string
}

const USERS: User[] = [
  {
    username: 'admin',
    password: 'agsBOOST123',
    role: 'admin',
    token: 'boost-admin-9f3a7c2e1d6b4f08-session',
  },
  {
    username: 'viewer',
    password: 'boostVIEW456',
    role: 'viewer',
    token: 'boost-viewer-4a8b2c1e9d7f3a6b-session',
  },
]

export const AUTH_COOKIE = 'boost_admin_session'

export function checkCredentials(username: string, password: string): User | null {
  return USERS.find(u => u.username === username && u.password === password) ?? null
}

export function makeSessionToken(username: string): string {
  return USERS.find(u => u.username === username)?.token ?? ''
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  return USERS.some(u => u.token === token)
}

export function getRoleFromToken(token: string | undefined | null): Role | null {
  if (!token) return null
  return USERS.find(u => u.token === token)?.role ?? null
}
