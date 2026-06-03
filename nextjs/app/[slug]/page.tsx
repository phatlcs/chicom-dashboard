export default function DashboardPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  return (
    <iframe
      src={`/dashboard/index.html?slug=${encodeURIComponent(slug)}`}
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Dashboard"
    />
  )
}
