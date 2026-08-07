// Two fixed users: admin (create reports + upload) and viewer (read-only).
// Tokens are signed base64-JSON payloads with embedded expiry — Edge-runtime compatible.

export type Role = 'admin' | 'viewer'

interface User {
  username: string
  password: string
  role: Role
}

const USERS: User[] = [
  { username: 'admin',  password: 'agsBOOST123',  role: 'admin'  },
  { username: 'viewer', password: 'boostVIEW456', role: 'viewer' },
]

const SECRET = 'boost-agS-2026-s3cr3t'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000  // 7 days

export const AUTH_COOKIE = 'boost_admin_session'

export function checkCredentials(username: string, password: string): User | null {
  return USERS.find(u => u.username === username && u.password === password) ?? null
}

export function makeSessionToken(role: Role): string {
  const payload = JSON.stringify({ role, exp: Date.now() + SESSION_MS })
  return btoa(payload) + '.' + btoa(SECRET + role)
}

export function getRoleFromToken(token: string | undefined | null): Role | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  try {
    const payload = JSON.parse(atob(parts[0]))
    if (!payload.role || !payload.exp) return null
    if (Date.now() > payload.exp) return null
    if (parts[1] !== btoa(SECRET + payload.role)) return null
    return payload.role as Role
  } catch {
    return null
  }
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  return getRoleFromToken(token) !== null
}
