'use client'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg text-gray-600">Загрузка...</p>
    </div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">MockInterview</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-md">
        Подготовка к техническим собеседованиям с напарниками
      </p>
      <button
        onClick={login}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Войти через Discord
      </button>
    </div>
  )
}
