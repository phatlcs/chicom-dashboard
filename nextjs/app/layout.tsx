import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Boost Dashboard Admin',
  description: 'Admin panel for monthly data pooling and reporting',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <Sidebar />
        <main className="overflow-auto min-h-screen">
          <div className="ml-20 mr-4 mt-20 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}

