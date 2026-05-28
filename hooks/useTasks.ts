import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task, TaskStatus, TaskPriority, Project, ProjectMember } from '@/lib/types'

interface ProjectWithTasks extends Project {
  tasks: Task[]
  members: ProjectMember[]
}

async function fetchProject(id: string): Promise<ProjectWithTasks> {
  const res = await fetch(`/api/projects/${id}`)
  if (!res.ok) throw new Error('Error al obtener el proyecto')
  return res.json()
}

async function createTask(data: {
  project_id: string
  title: string
  description?: string
  priority?: string
  status?: TaskStatus
  assigned_to?: string | null
}): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Error al crear tarea')
  }
  return res.json()
}

async function updateTask(data: {
  id: string
  title: string
  description: string
  priority: TaskPriority
  assigned_to?: string | null
}): Promise<Task> {
  const res = await fetch(`/api/tasks/${data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      priority: data.priority,
      assigned_to: data.assigned_to,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Error al actualizar tarea')
  }
  return res.json()
}

async function moveTask(data: {
  id: string
  newStatus: TaskStatus
  newOrder: number
  projectId: string
}): Promise<Task> {
  const res = await fetch(`/api/tasks/${data.id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStatus: data.newStatus, newOrder: data.newOrder, projectId: data.projectId }),
  })
  if (!res.ok) throw new Error('Error al mover tarea')
  return res.json()
}

async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar tarea')
}

export function useProject(id: string) {
  return useQuery({ queryKey: ['project', id], queryFn: () => fetchProject(id), enabled: !!id })
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  })
}

export function useUpdateTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  })
}

export function useMoveTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: moveTask,
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['project', projectId] })
      const previous = qc.getQueryData<ProjectWithTasks>(['project', projectId])
      qc.setQueryData<ProjectWithTasks>(['project', projectId], (old) => {
        if (!old) return old
        const tasks = old.tasks.map((t) =>
          t.id === vars.id ? { ...t, status: vars.newStatus, order: vars.newOrder } : t
        )
        return { ...old, tasks }
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['project', projectId], ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  })
}

export function useDeleteTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  })
}

export function useAssignTask(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, assigned_to }: { id: string; assigned_to: string | null }) =>
      fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to }),
      }).then((r) => r.json() as Promise<Task>),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['project', projectId] }),
  })
}
