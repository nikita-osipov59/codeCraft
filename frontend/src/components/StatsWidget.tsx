import { UserStats } from '@/types'

interface Props {
  stats: UserStats
}

export function StatsWidget({ stats }: Props) {
  const items = [
    { label: 'Всего сессий', value: stats.total_sessions },
    { label: 'Как интервьюер', value: stats.as_initiator },
    { label: 'Как кандидат', value: stats.as_partner },
    { label: 'Рейтинг', value: stats.avg_rating.toFixed(1) },
    { label: 'Фидбек дан', value: stats.feedback_given },
    { label: 'Тем покрыто', value: stats.topics_covered.length },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      ))}
    </div>
  )
}
