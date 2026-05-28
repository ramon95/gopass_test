export type TaskStatus = 'pending' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface ProjectMember {
  id: string
  name: string
  email: string
  is_owner: boolean
}

export interface Project {
  id: string
  owner_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  incomplete_tasks_count: number
  members?: ProjectMember[]
}

export interface Task {
  id: string
  project_id: string
  assigned_to: string | null
  assigned_user_name: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  order: number
  due_date: string | null
  created_at: string
  updated_at: string
}

export type UserRole = 'admin' | 'user'

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: UserRole
}
