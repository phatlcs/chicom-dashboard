import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <Link href="/">
          <h1 className="text-xl font-bold text-white">ChiCom Admin</h1>
        </Link>
        <p className="text-slate-400 text-sm mt-1">Dashboard</p>
      </div>

      <nav className="mt-8 px-4">
        <div className="mb-8">
          <p className="text-slate-400 text-xs uppercase font-semibold mb-4">Main</p>
          <ul className="space-y-2">
            <li>
              <Link href="/">
                <span className={`block px-4 py-2 rounded-lg transition ${
                  isActive('/') && pathname === '/'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}>
                  Dashboard
                </span>
              </Link>
            </li>
            <li>
              <Link href="/upload">
                <span className={`block px-4 py-2 rounded-lg transition ${
                  isActive('/upload')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}>
                  Upload Data
                </span>
              </Link>
            </li>
            <li>
              <Link href="/batches">
                <span className={`block px-4 py-2 rounded-lg transition ${
                  isActive('/batches')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}>
                  Batch History
                </span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-slate-400 text-xs uppercase font-semibold mb-4">Monthly Reports</p>
          <ul className="space-y-2">
            <li>
              <Link href="/months/q1-2026">
                <span className={`block px-4 py-2 rounded-lg transition text-sm ${
                  isActive('/months/q1-2026')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}>
                  Q1 2026 (Jan-Mar)
                </span>
              </Link>
            </li>
            <li>
              <Link href="/months/april-2026">
                <span className={`block px-4 py-2 rounded-lg transition text-sm ${
                  isActive('/months/april-2026')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}>
                  April 2026
                </span>
              </Link>
            </li>
            <li>
              <Link href="/months/may-2026">
                <span className={`block px-4 py-2 rounded-lg transition text-sm ${
                  isActive('/months/may-2026')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}>
                  May 2026
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <p className="text-slate-400 text-xs">© 2026 ChiCom</p>
      </div>
    </aside>
  )
}
