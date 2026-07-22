'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { Topic, Question } from '@/types'

const levelColors: Record<string, string> = {
  junior: 'bg-green-100 text-green-800',
  middle: 'bg-yellow-100 text-yellow-800',
  senior: 'bg-red-100 text-red-800',
}

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    if (id) {
      api.topics.get(id).then(setTopic)
      api.questions.list(id).then(setQuestions)
    }
  }, [id])

  if (!topic) return <p className="text-gray-600">Загрузка...</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{topic.name}</h1>
        <p className="text-gray-600">{topic.description}</p>
      </div>
      <div className="space-y-2">
        {questions.map(q => (
          <div key={q.id} className="bg-white p-4 rounded-lg border border-gray-300">
            <div className="flex items-start justify-between">
              <div className="text-sm font-medium">{q.text}</div>
              <span className={`text-xs px-2 py-1 rounded ${levelColors[q.level] || ''}`}>{q.level}</span>
            </div>
            {q.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {q.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
