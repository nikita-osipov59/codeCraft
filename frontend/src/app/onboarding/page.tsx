'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

export default function Onboarding() {
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const handleSubmit = async () => {
    if (!selectedRole) return
    setLoading(true)
    try {
      await api.users.updateRole(selectedRole)
      await refreshUser()
      router.push('/dashboard')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Выберите роль</h1>
      <div className="grid gap-4 w-full max-w-md">
        {[
          { value: 'interviewer', label: 'Интервьюер', desc: 'Провожу собеседования' },
          { value: 'interviewee', label: 'Кандидат', desc: 'Прохожу собеседования' },
          { value: 'both', label: 'Оба варианта', desc: 'Хочу и проводить, и проходить' },
        ].map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => setSelectedRole(value)}
            className={`p-4 rounded-lg border-2 text-left transition ${
              selectedRole === value
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">{label}</div>
            <div className="text-sm text-gray-600">{desc}</div>
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selectedRole || loading}
        className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {loading ? 'Сохранение...' : 'Продолжить'}
      </button>
    </div>
  )
}
