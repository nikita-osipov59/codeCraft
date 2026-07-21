'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      setError('No authorization code received')
      return
    }

    api.auth.callback(code)
      .then(({ token, user }) => {
        localStorage.setItem('token', token)
        if (user.role === 'both') {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      })
      .catch(() => {
        setError('Authentication failed')
      })
  }, [router])

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500">{error}</p>
    </div>
  }

  return <div className="flex items-center justify-center min-h-screen">
    <p className="text-lg text-gray-500">Авторизация через Discord...</p>
  </div>
}
