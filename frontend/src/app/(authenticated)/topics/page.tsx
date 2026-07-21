'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Topic } from '@/types'

const categoryIcons: Record<string, string> = {
  Algorithms: '⚡',
  'System Design': '🏗️',
  SQL: '🗄️',
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [grouped, setGrouped] = useState<Record<string, Topic[]>>({})

  useEffect(() => {
    api.topics.list().then(t => {
      setTopics(t)
      const g: Record<string, Topic[]> = {}
      t.forEach(topic => {
        if (!g[topic.category]) g[topic.category] = []
        g[topic.category].push(topic)
      })
      setGrouped(g)
    })
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Темы</h1>
      {Object.entries(grouped).map(([category, topics]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>{categoryIcons[category] || '📚'}</span>
            {category}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topics.map(t => (
              <Link
                key={t.id}
                href={`/topics/${t.id}`}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition"
              >
                <div className="font-medium">{t.name}</div>
                {t.description && (
                  <div className="text-sm text-gray-500 mt-1">{t.description}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
