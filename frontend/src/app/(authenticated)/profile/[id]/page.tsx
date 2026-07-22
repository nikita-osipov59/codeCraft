'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { User } from '@/types'

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<User | null>(null)

  useEffect(() => {
    if (id) {
      api.users.get(id).then(setProfile)
    }
  }, [id])

  if (!profile) return <p className="text-gray-600">Загрузка...</p>

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-4">
        {profile.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar} alt={profile.username} className="w-16 h-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{profile.role}</span>
            <span className="text-sm text-gray-600">Рейтинг: {profile.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-600">Сессий: {profile.sessions_count}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
