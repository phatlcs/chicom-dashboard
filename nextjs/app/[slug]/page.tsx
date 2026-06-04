import { redirect } from 'next/navigation'

export default function DashboardPage({ params }: { params: { slug: string } }) {
  redirect(`/${params.slug}.html`)
}
