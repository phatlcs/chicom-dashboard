import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'ChiCom Dashboard Admin',
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
