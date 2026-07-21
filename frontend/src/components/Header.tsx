'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg">
            MockInterview
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Дашборд</Link>
            <Link href="/topics" className="text-gray-600 hover:text-gray-900">Темы</Link>
            <Link href="/board" className="text-gray-600 hover:text-gray-900">Доска</Link>
            <Link href="/sessions" className="text-gray-600 hover:text-gray-900">Сессии</Link>
          </nav>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`} className="text-sm text-gray-600 hover:text-gray-900">
              {user.username}
            </Link>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-700">
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
