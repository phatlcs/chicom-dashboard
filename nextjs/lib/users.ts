import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const USERS_FILE = join(process.cwd(), 'data', 'users.json')

export interface ManagedUser {
  username: string
  password: string
  role: 'viewer'
  createdAt: string
}

export function loadUsers(): ManagedUser[] {
  try {
    if (existsSync(USERS_FILE)) {
      return JSON.parse(readFileSync(USERS_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

export function saveUsers(users: ManagedUser[]): void {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

export function findUser(username: string, password: string): ManagedUser | null {
  return loadUsers().find(u => u.username === username && u.password === password) ?? null
}
