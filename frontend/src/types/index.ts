export interface User {
  id: string
  username: string
  avatar?: string
  role: 'interviewer' | 'interviewee' | 'both'
  rating: number
  sessions_count: number
  inserted_at: string
}

export interface Topic {
  id: string
  name: string
  category: string
  icon?: string
  description?: string
}

export interface Question {
  id: string
  topic_id: string
  level: 'junior' | 'middle' | 'senior'
  text: string
  tags: string[]
}

export interface BoardEntry {
  id: string
  author: Pick<User, 'id' | 'username' | 'avatar' | 'role'>
  topic: Pick<Topic, 'id' | 'name' | 'category'>
  looking_for: 'interviewer' | 'interviewee'
  time_slot?: string
  description?: string
  status: 'open' | 'matched' | 'closed'
  inserted_at: string
}

export interface Session {
  id: string
  initiator: Pick<User, 'id' | 'username'>
  partner?: Pick<User, 'id' | 'username'>
  topic: Pick<Topic, 'id' | 'name'>
  status: 'pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_at?: string
  inserted_at: string
}

export interface Feedback {
  id: string
  rating: number
  comment?: string
  reviewer_id: string
}

export interface UserStats {
  total_sessions: number
  feedback_given: number
  feedback_received: number
  avg_rating: number
  topics_covered: string[]
  as_initiator: number
  as_partner: number
}
