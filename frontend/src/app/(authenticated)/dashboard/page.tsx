'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { StatsWidget } from '@/components/StatsWidget'
import { UserStats, Session } from '@/types'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])

  useEffect(() => {
    api.stats.me().then(setStats)
    api.sessions.list().then(s => setRecentSessions(s.slice(0, 5)))
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Дашборд</h1>
      {stats && <StatsWidget stats={stats} />}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Последние сессии</h2>
          <Link href="/sessions" className="text-sm text-indigo-600 hover:text-indigo-800">
            Все сессии →
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-gray-600">У вас пока нет сессий. Найдите напарника на <Link href="/board" className="text-indigo-600">доске</Link>!</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map(s => (
              <Link key={s.id} href={`/sessions/${s.id}`} className="block bg-white p-4 rounded-lg border border-gray-300 hover:border-gray-300 transition">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{s.topic.name}</span>
                    <span className="text-gray-600 ml-2">— {s.status}</span>
                  </div>
                  <span className="text-sm text-gray-600">{new Date(s.inserted_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
