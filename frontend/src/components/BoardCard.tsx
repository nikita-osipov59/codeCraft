import { BoardEntry } from '@/types'
import { useAuth } from '@/lib/auth'

interface Props {
  entry: BoardEntry
  onApply: (id: string) => void
  onDelete: (id: string) => void
}

export function BoardCard({ entry, onApply, onDelete }: Props) {
  const { user } = useAuth()
  const isOwn = user?.id === entry.author.id

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-300">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.author.username}</span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{entry.author.role}</span>
          </div>
          <div className="text-sm mt-1">
            Ищет: <strong>{entry.looking_for === 'interviewer' ? 'интервьюера' : 'кандидата'}</strong>
            {' · '}Тема: <strong>{entry.topic.name}</strong>
          </div>
          {entry.description && (
            <div className="text-sm text-gray-600 mt-2">{entry.description}</div>
          )}
          {entry.time_slot && (
            <div className="text-sm text-gray-600 mt-1">
              {new Date(entry.time_slot).toLocaleString()}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!isOwn && entry.status === 'open' && (
            <button
              onClick={() => onApply(entry.id)}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition"
            >
              Откликнуться
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => onDelete(entry.id)}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
            >
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
