import { useQuery } from '@tanstack/react-query'
import type { UserRole } from '@/lib/types'

interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
}

async function fetchMe(): Promise<CurrentUser> {
  const res = await fetch('/api/me')
  if (!res.ok) throw new Error('No autorizado')
  return res.json()
}

export function useCurrentUser() {
  return useQuery({ queryKey: ['me'], queryFn: fetchMe, staleTime: 0 })
}
