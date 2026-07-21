'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

interface Props {
  sessionId: string
  onSubmitted: () => void
}

export function FeedbackForm({ sessionId, onSubmitted }: Props) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!rating) return
    setSubmitting(true)
    try {
      await api.feedback.create(sessionId, { rating, comment })
      onSubmitted()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <h3 className="font-semibold">Оставить фидбек</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`w-10 h-10 rounded-full text-lg transition ${
              n <= rating ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Комментарий (опционально)"
        className="w-full border border-gray-300 rounded px-3 py-2"
        rows={3}
      />
      <button
        onClick={handleSubmit}
        disabled={!rating || submitting}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {submitting ? 'Отправка...' : 'Отправить'}
      </button>
    </div>
  )
}
