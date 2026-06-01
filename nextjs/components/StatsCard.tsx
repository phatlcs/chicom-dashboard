interface StatsCardProps {
  title: string
  value: number
  color: 'blue' | 'green' | 'purple' | 'emerald' | 'red'
}

const colorMap = {
  blue: 'bg-blue-100 text-blue-900 border-blue-300',
  green: 'bg-green-100 text-green-900 border-green-300',
  purple: 'bg-purple-100 text-purple-900 border-purple-300',
  emerald: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  red: 'bg-red-100 text-red-900 border-red-300',
}

export default function StatsCard({ title, value, color }: StatsCardProps) {
  return (
    <div className={`p-6 rounded-lg border-l-4 ${colorMap[color]} bg-white shadow`}>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
    </div>
  )
}
