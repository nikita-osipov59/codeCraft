'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Session } from '@/types'
import { FeedbackForm } from '@/components/FeedbackForm'
import { useAuth } from '@/lib/auth'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const { user } = useAuth()

  const load = () => {
    if (id) {
      api.sessions.get(id).then(setSession)
    }
  }

  useEffect(load, [id])

  const handleStatusChange = async (status: string) => {
    if (!id) return
    await api.sessions.updateStatus(id, status)
    load()
  }

  if (!session) return <p className="text-gray-500">Загрузка...</p>

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Детали сессии</h1>
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-3">
        <div><span className="text-gray-500">Тема:</span> <strong>{session.topic.name}</strong></div>
        <div><span className="text-gray-500">Инициатор:</span> {session.initiator.username}</div>
        <div><span className="text-gray-500">Напарник:</span> {session.partner?.username || '—'}</div>
        <div><span className="text-gray-500">Статус:</span> {session.status}</div>
        <div className="flex gap-2">
          {session.status === 'matched' && (
            <button onClick={() => handleStatusChange('in_progress')} className="px-4 py-2 bg-yellow-500 text-white rounded text-sm">
              Начать собес
            </button>
          )}
          {session.status === 'in_progress' && (
            <button onClick={() => handleStatusChange('completed')} className="px-4 py-2 bg-green-600 text-white rounded text-sm">
              Завершить
            </button>
          )}
        </div>
      </div>
      {session.status === 'completed' && user && (
        <FeedbackForm sessionId={session.id} onSubmitted={load} />
      )}
    </div>
  )
}
