import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Project } from '@/lib/types'

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects')
  if (!res.ok) throw new Error('Error al obtener proyectos')
  return res.json()
}

async function createProject(data: { name: string; description?: string }): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Error al crear proyecto')
  }
  return res.json()
}

async function updateProject(data: { id: string; name: string; description: string }): Promise<Project> {
  const res = await fetch(`/api/projects/${data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: data.name, description: data.description }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Error al actualizar proyecto')
  }
  return res.json()
}

async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar proyecto')
}

export function useProjects() {
  return useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
