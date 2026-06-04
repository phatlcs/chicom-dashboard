import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

// Only allow slugs that don't contain dots (no file extensions)
export default function DashboardPage({ params }: { params: { slug: string } }) {
  if (params.slug.includes('.')) return notFound()
  redirect(`/api/dashboard/${params.slug}`)
}
