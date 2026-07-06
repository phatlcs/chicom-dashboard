'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const UNSORTED_REPORTS = [
  { slug: 'q1', label: 'Q1 2026 (Jan-Mar)', created: 1748768973368 }, // 2026-06-09 06:49:33
  { slug: 'april', label: 'April 2026', created: 1748768974158 }, // 2026-06-09 06:49:34
  { slug: 'may', label: 'May 2026', created: 1748768974948 }, // 2026-06-09 06:49:34.948
  // Note: 'overview' report is hidden from this list - only accessible via /overview page
]

// Sort by creation date (latest first)
const REPORTS = [...UNSORTED_REPORTS].sort((a, b) => b.created - a.created)

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.role)).catch(() => {})
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-16 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white overflow-y-auto z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 mt-4">
          <Link href="/"><h1 className="text-xl font-bold text-white">Boost Admin</h1></Link>
          <p className="text-slate-400 text-sm mt-1">Dashboard</p>
        </div>

        <nav className="mt-8 px-4">
          <div className="mb-8">
            <p className="text-slate-400 text-xs uppercase font-semibold mb-4">Main</p>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className={`block px-4 py-2 rounded-lg transition ${pathname === '/' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} onClick={() => setIsOpen(false)}>
                    Dashboard
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/overview">
                  <span className={`block px-4 py-2 rounded-lg transition ${pathname === '/overview' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} onClick={() => setIsOpen(false)}>
                    Overview
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {role === 'admin' && (
            <div className="mb-8">
              <p className="text-slate-400 text-xs uppercase font-semibold mb-4">Admin</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/generate-report">
                    <span className={`block px-4 py-2 rounded-lg transition ${pathname === '/generate-report' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} onClick={() => setIsOpen(false)}>
                      + Create Report
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/admin/users">
                    <span className={`block px-4 py-2 rounded-lg transition ${pathname === '/admin/users' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`} onClick={() => setIsOpen(false)}>
                      Manage Users
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          )}

          <div>
            <p className="text-slate-400 text-xs uppercase font-semibold mb-4">Monthly Reports</p>
            <ul className="space-y-2">
              {REPORTS.map(r => (
                <li key={r.slug}>
                  {/* Use <a> to force full page load so Next.js rewrites apply */}
                  <a href={`/${r.slug}`}>
                    <span className="block px-4 py-2 rounded-lg transition text-sm text-slate-300 hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                      {r.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-slate-400 text-xs">© 2026 Boost</p>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              window.location.href = '/login'
            }}
            className="text-slate-400 hover:text-white text-xs transition"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  )
}

