import { redirect } from 'next/navigation'

export default function DashboardPage({ params }: { params: { slug: string } }) {
  redirect(`/dashboard/index.html?slug=${params.slug}`)
}
