'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Topic, Question } from '@/types'

export default function AdminPage() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [newTopicName, setNewTopicName] = useState('')
  const [newTopicCategory, setNewTopicCategory] = useState('Algorithms')
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionLevel, setNewQuestionLevel] = useState<'junior' | 'middle' | 'senior'>('middle')

  useEffect(() => { api.topics.list().then(setTopics) }, [])

  useEffect(() => {
    if (selectedTopic) api.questions.list(selectedTopic).then(setQuestions)
  }, [selectedTopic])

  const handleCreateTopic = async () => {
    if (!newTopicName) return
    await api.topics.create({ name: newTopicName, category: newTopicCategory } as any)
    setNewTopicName('')
    api.topics.list().then(setTopics)
  }

  const handleDeleteTopic = async (id: string) => {
    await api.topics.delete(id)
    api.topics.list().then(setTopics)
  }

  const handleCreateQuestion = async () => {
    if (!newQuestionText || !selectedTopic) return
    await api.questions.create({ topic_id: selectedTopic, text: newQuestionText, level: newQuestionLevel } as any)
    setNewQuestionText('')
    if (selectedTopic) api.questions.list(selectedTopic).then(setQuestions)
  }

  const handleDeleteQuestion = async (id: string) => {
    await api.questions.delete(id)
    if (selectedTopic) api.questions.list(selectedTopic).then(setQuestions)
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Админка</h1>

      <div className="bg-white p-6 rounded-lg border border-gray-300 space-y-4">
        <h2 className="font-semibold">Темы</h2>
        <div className="flex gap-2">
          <input
            value={newTopicName}
            onChange={e => setNewTopicName(e.target.value)}
            placeholder="Название темы"
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <select
            value={newTopicCategory}
            onChange={e => setNewTopicCategory(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="Algorithms">Algorithms</option>
            <option value="System Design">System Design</option>
            <option value="SQL">SQL</option>
          </select>
          <button onClick={handleCreateTopic} className="px-4 py-2 bg-green-600 text-white rounded text-sm">
            Добавить
          </button>
        </div>
        <div className="space-y-2">
          {topics.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-300">
              <div>
                <span className="font-medium">{t.name}</span>
                <span className="text-sm text-gray-600 ml-2">{t.category}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedTopic(t.id)} className="text-sm text-indigo-600 hover:text-indigo-800">
                  Вопросы
                </button>
                <button onClick={() => handleDeleteTopic(t.id)} className="text-sm text-red-500 hover:text-red-700">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTopic && (
        <div className="bg-white p-6 rounded-lg border border-gray-300 space-y-4">
          <h2 className="font-semibold">Вопросы по теме</h2>
          <div className="flex gap-2">
            <input
              value={newQuestionText}
              onChange={e => setNewQuestionText(e.target.value)}
              placeholder="Текст вопроса"
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <select
              value={newQuestionLevel}
              onChange={e => setNewQuestionLevel(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="junior">Junior</option>
              <option value="middle">Middle</option>
              <option value="senior">Senior</option>
            </select>
            <button onClick={handleCreateQuestion} className="px-4 py-2 bg-green-600 text-white rounded text-sm">
              Добавить
            </button>
          </div>
          <div className="space-y-2">
            {questions.map(q => (
              <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-300">
                <div>
                  <span>{q.text}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded ml-2">{q.level}</span>
                </div>
                <button onClick={() => handleDeleteQuestion(q.id)} className="text-sm text-red-500 hover:text-red-700">
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
