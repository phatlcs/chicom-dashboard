import { redirect } from 'next/navigation'

export default function DashboardPage({ params }: { params: { slug: string } }) {
  // Redirect to the dashboard route handler
  redirect(`/api/dashboard/${params.slug}`)
}
