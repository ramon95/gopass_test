'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProject } from '@/hooks/useTasks'
import { useAllUsers, useAddMember, useRemoveMember } from '@/hooks/useMembers'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import Board from '@/components/Board/Board'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { ProjectMember } from '@/lib/types'

function MemberAvatar({ member }: { member: ProjectMember }) {
  return (
    <span
      title={`${member.name}${member.is_owner ? ' (Propietario)' : ''}`}
      className="h-7 w-7 rounded-full bg-surface-raised border border-border flex items-center justify-center text-xs font-semibold text-muted flex-shrink-0"
    >
      {member.name.charAt(0).toUpperCase()}
    </span>
  )
}

interface MembersModalProps {
  projectId: string
  members: ProjectMember[]
  isAdmin: boolean
  open: boolean
  onClose: () => void
}

function MembersModal({ projectId, members, isAdmin, open, onClose }: MembersModalProps) {
  const { data: allUsers = [] } = useAllUsers()
  const addMember = useAddMember(projectId)
  const removeMember = useRemoveMember(projectId)
  const [selectedUserId, setSelectedUserId] = useState('')

  const memberIds = new Set(members.map((m) => m.id))
  const available = allUsers.filter((u) => !memberIds.has(u.id))

  async function handleAdd() {
    if (!selectedUserId) return
    await addMember.mutateAsync(selectedUserId)
    setSelectedUserId('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Miembros del proyecto">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-raised transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-xs font-semibold text-brand-light flex-shrink-0">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-white leading-tight">{m.name}</p>
                  <p className="text-xs text-faded">{m.email}</p>
                </div>
              </div>
              {m.is_owner ? (
                <span className="text-xs text-brand-light bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">
                  Propietario
                </span>
              ) : isAdmin ? (
                <button
                  onClick={() => removeMember.mutate(m.id)}
                  disabled={removeMember.isPending}
                  className="text-faded hover:text-red-400 transition-colors p-0.5 rounded text-xs"
                  aria-label={`Eliminar a ${m.name}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {isAdmin && available.length > 0 && (
          <div className="border-t border-border pt-3 flex flex-col gap-2">
            <p className="text-xs text-faded font-medium uppercase tracking-wide">Agregar miembro</p>
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-surface text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Seleccionar usuario...</option>
                {available.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                ))}
              </select>
              <Button onClick={handleAdd} loading={addMember.isPending} disabled={!selectedUserId}>
                Agregar
              </Button>
            </div>
          </div>
        )}

        {isAdmin && available.length === 0 && members.length > 0 && (
          <p className="text-xs text-faded text-center py-1">Todos los usuarios ya son miembros.</p>
        )}
      </div>
    </Modal>
  )
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: project, isLoading, isError } = useProject(id)
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.role === 'admin'
  const [modalOpen, setModalOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-64 bg-surface rounded-lg animate-pulse" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 w-72 bg-surface rounded-xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">Proyecto no encontrado</p>
        <button onClick={() => router.push('/')} className="text-sm text-brand hover:underline mt-2">
          Volver al dashboard
        </button>
      </div>
    )
  }

  const members = project.members ?? []

  return (
    <>
      <div className="flex items-start justify-between mb-6 gap-4 min-w-0">
        <div className="min-w-0">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-muted hover:text-brand flex items-center gap-1 mb-2 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Proyectos
          </button>
          <h1 className="text-2xl font-bold text-white truncate">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted mt-1 line-clamp-2 break-all">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          {members.length > 0 && (
            <div className="flex items-center">
              <div className="flex -space-x-1.5 mr-2">
                {members.slice(0, 4).map((m) => <MemberAvatar key={m.id} member={m} />)}
                {members.length > 4 && (
                  <span className="h-7 w-7 rounded-full bg-surface-raised border border-border flex items-center justify-center text-xs font-semibold text-faded flex-shrink-0">
                    +{members.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
          <Button variant="secondary" onClick={() => setMembersOpen(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
            </svg>
            Miembros
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Nueva tarea
          </Button>
        </div>
      </div>

      <Board
        projectId={id}
        tasks={project.tasks}
        members={members}
        modalOpen={modalOpen}
        onCloseModal={() => setModalOpen(false)}
      />

      <MembersModal
        projectId={id}
        members={members}
        isAdmin={isAdmin}
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
      />
    </>
  )
}
