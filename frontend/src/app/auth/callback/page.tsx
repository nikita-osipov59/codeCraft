'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const err = params.get('error')
    const role = params.get('role')

    if (err) {
      setError('Authentication failed')
      return
    }

    if (token) {
      localStorage.setItem('token', token)
      if (role === 'both') {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } else {
      setError('No token received')
    }
  }, [router])

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500">{error}</p>
    </div>
  }

  return <div className="flex items-center justify-center min-h-screen">
    <p className="text-lg text-gray-600">Вход выполнен, перенаправление...</p>
  </div>
}
