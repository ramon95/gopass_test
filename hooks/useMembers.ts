import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProjectMember, User } from '@/lib/types'

async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Error al obtener usuarios')
  return res.json()
}

async function addMember({ projectId, userId }: { projectId: string; userId: string }): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Error al agregar miembro')
  }
}

async function removeMember({ projectId, userId }: { projectId: string; userId: string }): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Error al eliminar miembro')
  }
}

export function useAllUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchAllUsers })
}

export function useAddMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => addMember({ projectId, userId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  })
}

export function useRemoveMember(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => removeMember({ projectId, userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })
}

export type { ProjectMember }
