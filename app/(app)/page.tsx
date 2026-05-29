'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useProjects'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import type { Project } from '@/lib/types'

interface ProjectCardProps {
  project: Project
  onDelete: (project: Project) => void
  onEdit: (project: Project) => void
  isAdmin: boolean
}

function ProjectCard({ project, onDelete, onEdit, isAdmin }: ProjectCardProps) {
  const router = useRouter()

  return (
    <div
      className="bg-surface rounded-xl border border-border p-5 hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5 transition-all cursor-pointer group"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white group-hover:text-brand transition-colors truncate min-w-0">{project.name}</h3>
        {isAdmin && <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(project) }}
            className="text-faded hover:text-brand transition-colors p-0.5 rounded"
            aria-label="Editar proyecto"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project) }}
            className="text-faded hover:text-red-400 transition-colors p-0.5 rounded"
            aria-label="Eliminar proyecto"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>}
      </div>
      {project.description && (
        <p className="text-sm text-muted mt-1 line-clamp-2 break-all">{project.description}</p>
      )}
      <p className="text-xs text-faded mt-3">
        {new Date(project.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const { data: projects, isLoading, isError } = useProjects()
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.role === 'admin'
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  // Modal crear
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Modal editar
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Modal confirmar eliminación
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    await createProject.mutateAsync({ name: name.trim(), description: description.trim() || undefined })
    setName('')
    setDescription('')
    setCreateOpen(false)
  }

  function openEdit(project: Project) {
    setEditingProject(project)
    setEditName(project.name)
    setEditDescription(project.description ?? '')
  }

  async function handleSaveEdit() {
    if (!editingProject || !editName.trim()) return
    await updateProject.mutateAsync({ id: editingProject.id, name: editName.trim(), description: editDescription.trim() })
    setEditingProject(null)
  }

  function requestDelete(project: Project) {
    setDeletingProject(project)
  }

  async function confirmDelete() {
    if (!deletingProject) return
    await deleteProject.mutateAsync(deletingProject.id)
    setDeletingProject(null)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAdmin ? 'Mis proyectos' : 'Proyectos asignados'}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {isAdmin ? 'Gestiona tus proyectos y tareas' : 'Proyectos en los que participas'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Nuevo proyecto
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-surface rounded-xl animate-pulse" />)}
        </div>
      )}

      {isError && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
          Error al cargar los proyectos
        </p>
      )}

      {projects && projects.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-surface mb-4">
            <svg className="h-8 w-8 text-faded" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          {isAdmin ? (
            <>
              <h3 className="font-semibold text-white mb-1">Sin proyectos todavía</h3>
              <p className="text-sm text-muted mb-4">Crea tu primer proyecto para empezar</p>
              <Button onClick={() => setCreateOpen(true)}>Crear proyecto</Button>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-white mb-1">Aún no tienes proyectos asignados</h3>
              <p className="text-sm text-muted">Espera a que un administrador te asigne a un proyecto.</p>
            </>
          )}
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={requestDelete} onEdit={openEdit} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Modal crear */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo proyecto">
        <div className="flex flex-col gap-4">
          <Input label="Nombre del proyecto" placeholder="Mi proyecto" value={name}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            maxLength={80} autoFocus />
          <Textarea label="Descripción (opcional)" rows={3} placeholder="Describe el objetivo del proyecto..."
            value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={createProject.isPending} disabled={!name.trim()}>Crear proyecto</Button>
          </div>
        </div>
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editingProject} onClose={() => setEditingProject(null)} title="Editar proyecto">
        <div className="flex flex-col gap-4">
          <Input label="Nombre del proyecto" value={editName} onChange={(e) => setEditName(e.target.value)}
            maxLength={80} autoFocus />
          <Textarea label="Descripción (opcional)" rows={3} value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)} maxLength={200} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingProject(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} loading={updateProject.isPending} disabled={!editName.trim()}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        open={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        title="Eliminar proyecto"
      >
        <div className="flex flex-col gap-4">
          {deletingProject && Number(deletingProject.incomplete_tasks_count) > 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3">
              <p className="text-sm text-yellow-300 font-medium mb-1">⚠ Este proyecto tiene tareas sin completar</p>
              <p className="text-xs text-yellow-300/70">
                Hay <strong>{deletingProject.incomplete_tasks_count}</strong> tarea{Number(deletingProject.incomplete_tasks_count) > 1 ? 's' : ''} pendiente{Number(deletingProject.incomplete_tasks_count) > 1 ? 's' : ''} o en progreso.
                Al eliminar el proyecto se borrarán todas las tareas de forma permanente.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">
              ¿Estás seguro que deseas eliminar <strong className="text-white">{deletingProject?.name}</strong>?
              Esta acción no se puede deshacer.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setDeletingProject(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteProject.isPending}>
              Sí, eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
