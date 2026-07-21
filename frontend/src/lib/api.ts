import { User, Topic, Question, BoardEntry, Session, Feedback, UserStats } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    getDiscordUrl: () => `${API_BASE}/auth/discord`,
    callback: (code: string) =>
      request<{ token: string; user: User }>(`/auth/discord/callback?code=${code}`),
  },
  users: {
    me: () => request<User>('/api/users/me'),
    get: (id: string) => request<User>(`/api/users/${id}`),
    updateRole: (role: string) =>
      request<User>('/api/users/role', { method: 'PATCH', body: JSON.stringify({ role }) }),
  },
  topics: {
    list: () => request<Topic[]>('/api/topics'),
    get: (id: string) => request<Topic>(`/api/topics/${id}`),
    create: (data: Partial<Topic>) =>
      request<Topic>('/api/topics', { method: 'POST', body: JSON.stringify({ topic: data }) }),
    delete: (id: string) =>
      request<void>(`/api/topics/${id}`, { method: 'DELETE' }),
  },
  questions: {
    list: (topicId: string) =>
      request<Question[]>(`/api/questions?topic_id=${topicId}`),
    create: (data: Partial<Question>) =>
      request<Question>('/api/questions', { method: 'POST', body: JSON.stringify({ question: data }) }),
    delete: (id: string) =>
      request<void>(`/api/questions/${id}`, { method: 'DELETE' }),
  },
  board: {
    list: () => request<BoardEntry[]>('/api/board'),
    create: (data: Partial<BoardEntry>) =>
      request<BoardEntry>('/api/board', { method: 'POST', body: JSON.stringify({ board_entry: data }) }),
    apply: (id: string) =>
      request<BoardEntry>(`/api/board/${id}/apply`, { method: 'POST' }),
    delete: (id: string) =>
      request<void>(`/api/board/${id}`, { method: 'DELETE' }),
  },
  sessions: {
    list: () => request<Session[]>('/api/sessions'),
    get: (id: string) => request<Session>(`/api/sessions/${id}`),
    create: (data: Partial<Session>) =>
      request<Session>('/api/sessions', { method: 'POST', body: JSON.stringify({ session: data }) }),
    updateStatus: (id: string, status: string) =>
      request<Session>(`/api/sessions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) =>
      request<void>(`/api/sessions/${id}`, { method: 'DELETE' }),
  },
  feedback: {
    create: (sessionId: string, data: { rating: number; comment?: string }) =>
      request<Feedback>(`/api/sessions/${sessionId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback: data }),
      }),
  },
  stats: {
    me: () => request<UserStats>('/api/stats/me'),
  },
}
