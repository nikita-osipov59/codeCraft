'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Session } from '@/types'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  matched: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    api.sessions.list().then(setSessions)
  }, [])

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Мои сессии</h1>
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'matched', 'in_progress', 'completed', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-sm rounded transition ${
              filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? 'Все' : s === 'in_progress' ? 'в процессе' : s}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-gray-600">Нет сессий</p>}
        {filtered.map(s => (
          <Link key={s.id} href={`/sessions/${s.id}`} className="block bg-white p-4 rounded-lg border border-gray-300 hover:border-gray-300 transition">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{s.topic.name}</span>
                <span className="text-gray-600 ml-2">
                  {s.initiator.username}{s.partner ? ` × ${s.partner.username}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[s.status] || ''}`}>{s.status}</span>
                <span className="text-sm text-gray-600">{new Date(s.inserted_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
