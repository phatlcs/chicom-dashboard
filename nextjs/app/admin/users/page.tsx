'use client'

import { useState, useEffect } from 'react'

interface User {
  username: string
  role: string
  createdAt: string
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ username: '', password: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(data.users ?? [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.status === 'success') {
        setSuccess(`User "${data.username}" created with viewer access.`)
        setForm({ username: '', password: '' })
        loadUsers()
      } else {
        setError(data.error || 'Failed to create user')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(username: string) {
    if (!confirm(`Delete user "${username}"?`)) return
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    loadUsers()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-600 mt-2">Create viewer accounts — they can view reports but cannot create or upload.</p>
      </div>

      {/* Create user form */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Viewer</h2>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 text-green-800 rounded text-sm">{success}</div>}

        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="e.g. client1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="text"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Set a password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      {/* Existing users */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Viewer Accounts ({users.length})</h2>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">No viewer accounts yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(u => (
              <div key={u.username} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{u.username}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Created {new Date(u.createdAt).toLocaleString()} · viewer
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(u.username)}
                  className="text-sm text-red-500 hover:text-red-700 transition"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
