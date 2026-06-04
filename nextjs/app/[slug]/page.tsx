import { redirect } from 'next/navigation'

export default function DashboardPage({ params }: { params: { slug: string } }) {
  redirect(`/api/dashboard/${params.slug}`)
}
