'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BoardEntry, Topic } from '@/types'
import { BoardCard } from '@/components/BoardCard'

export default function BoardPage() {
  const [entries, setEntries] = useState<BoardEntry[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ topic_id: '', looking_for: 'interviewee', description: '', time_slot: '' })

  const load = () => {
    api.board.list().then(setEntries)
    api.topics.list().then(setTopics)
  }

  useEffect(load, [])

  const handleCreate = async () => {
    await api.board.create({
      ...form,
      time_slot: form.time_slot ? new Date(form.time_slot).toISOString() : undefined,
    } as any)
    setShowForm(false)
    setForm({ topic_id: '', looking_for: 'interviewee', description: '', time_slot: '' })
    load()
  }

  const handleApply = async (id: string) => {
    await api.board.apply(id)
    load()
  }

  const handleDelete = async (id: string) => {
    await api.board.delete(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Доска объявлений</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
        >
          {showForm ? 'Отмена' : 'Создать объявление'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-300 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Тема</label>
            <select
              value={form.topic_id}
              onChange={e => setForm({ ...form, topic_id: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Выберите тему</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ищу</label>
            <select
              value={form.looking_for}
              onChange={e => setForm({ ...form, looking_for: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="interviewee">Кандидата</option>
              <option value="interviewer">Интервьюера</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Время (опционально)</label>
            <input
              type="datetime-local"
              value={form.time_slot}
              onChange={e => setForm({ ...form, time_slot: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!form.topic_id}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm disabled:opacity-50"
          >
            Создать
          </button>
        </div>
      )}

      <div className="space-y-3">
        {entries.map(e => (
          <BoardCard key={e.id} entry={e} onApply={handleApply} onDelete={handleDelete} />
        ))}
        {entries.length === 0 && <p className="text-gray-600">Объявлений пока нет</p>}
      </div>
    </div>
  )
}
