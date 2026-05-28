'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'
import type { Task, TaskStatus, ProjectMember } from '@/lib/types'
import Column from './Column'
import TaskCard from './TaskCard'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { useCreateTask, useUpdateTask, useMoveTask, useDeleteTask, useAssignTask } from '@/hooks/useTasks'

const STATUSES: TaskStatus[] = ['pending', 'in_progress', 'done']

interface Props {
  projectId: string
  tasks: Task[]
  members: ProjectMember[]
  modalOpen: boolean
  onCloseModal: () => void
}

export default function Board({ projectId, tasks, members = [], modalOpen, onCloseModal }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [newAssignedTo, setNewAssignedTo] = useState<string>('')

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [editAssignedTo, setEditAssignedTo] = useState<string>('')

  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [assigningTask, setAssigningTask] = useState<Task | null>(null)

  const createTask = useCreateTask(projectId)
  const updateTask = useUpdateTask(projectId)
  const moveTask = useMoveTask(projectId)
  const deleteTask = useDeleteTask(projectId)
  const assignTask = useAssignTask(projectId)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order)

  function handleDragStart(e: DragStartEvent) {
    setActiveTask(e.active.data.current?.task ?? null)
    setOverColumn(null)
  }

  function handleDragOver(e: DragOverEvent) {
    const { over } = e
    if (!over) return
    const overTask = over.data.current?.task as Task | undefined
    setOverColumn(overTask ? overTask.status : (over.id as TaskStatus))
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = e
    const draggedTask: Task = active.data.current?.task
    if (!draggedTask) return

    const resolvedOver = over ?? null
    const overTask = resolvedOver?.data.current?.task as Task | undefined

    let targetStatus: TaskStatus
    let targetOrder: number

    if (overTask) {
      targetStatus = overTask.status
      const colTasks = tasksByStatus(targetStatus)
      const overIdx = colTasks.findIndex((t) => t.id === overTask.id)
      targetOrder = overIdx === -1 ? 0 : overIdx
    } else if (resolvedOver) {
      targetStatus = resolvedOver.id as TaskStatus
      targetOrder = tasksByStatus(targetStatus).length
    } else if (overColumn) {
      targetStatus = overColumn
      targetOrder = tasksByStatus(targetStatus).length
    } else {
      return
    }

    setOverColumn(null)
    if (draggedTask.status === targetStatus && draggedTask.order === targetOrder) return
    moveTask.mutate({ id: draggedTask.id, newStatus: targetStatus, newOrder: targetOrder, projectId })
  }

  async function handleAddTask() {
    if (!newTitle.trim()) return
    await createTask.mutateAsync({
      project_id: projectId,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      priority: newPriority,
      status: 'pending',
      assigned_to: newAssignedTo || null,
    })
    setNewTitle('')
    setNewDescription('')
    setNewPriority('medium')
    setNewAssignedTo('')
    onCloseModal()
  }

  function handleClose() {
    setNewTitle('')
    setNewDescription('')
    setNewPriority('medium')
    setNewAssignedTo('')
    onCloseModal()
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setEditPriority(task.priority)
    setEditAssignedTo(task.assigned_to ?? '')
  }

  async function handleSaveEdit() {
    if (!editingTask || !editTitle.trim() || !editDescription.trim()) return
    await updateTask.mutateAsync({
      id: editingTask.id,
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      assigned_to: editAssignedTo || null,
    })
    setEditingTask(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const pw = pointerWithin(args)
          return pw.length > 0 ? pw : rectIntersection(args)
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              onDeleteTask={(task) => setDeletingTask(task)}
              onEditTask={openEdit}
              onAssignTask={(task) => setAssigningTask(task)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} onDelete={() => {}} onEdit={() => {}} />}
        </DragOverlay>
      </DndContext>

      <Modal open={modalOpen} onClose={handleClose} title="Nueva tarea">
        <div className="flex flex-col gap-4">
          <Input
            label="Título"
            placeholder="Nombre corto de la tarea"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask() }}
            maxLength={50}
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted">Prioridad</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as typeof newPriority)}
              className="rounded-lg border border-border bg-surface text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          {members.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted">Asignado a</label>
              <select
                value={newAssignedTo}
                onChange={(e) => setNewAssignedTo(e.target.value)}
                className="rounded-lg border border-border bg-surface text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          <Textarea
            label="Descripción"
            placeholder="Detalla el objetivo o los pasos de esta tarea..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleAddTask} loading={createTask.isPending} disabled={!newTitle.trim() || !newDescription.trim()}>
              Crear tarea
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!assigningTask} onClose={() => setAssigningTask(null)} title="Asignar tarea">
        <div className="flex flex-col gap-1">
          {assigningTask && (
            <p className="text-xs text-faded mb-2 truncate">
              Tarea: <span className="text-muted">{assigningTask.title}</span>
            </p>
          )}
          <button
            onClick={async () => {
              if (!assigningTask) return
              await assignTask.mutateAsync({ id: assigningTask.id, assigned_to: null })
              setAssigningTask(null)
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left w-full ${
              !assigningTask?.assigned_to
                ? 'bg-brand/10 border border-brand/30'
                : 'hover:bg-surface-raised'
            }`}
          >
            <span className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
              <svg className="h-4 w-4 text-faded" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
              </svg>
            </span>
            <span className="text-sm text-muted">Sin asignar</span>
            {!assigningTask?.assigned_to && (
              <svg className="h-4 w-4 text-brand ml-auto" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={async () => {
                if (!assigningTask) return
                await assignTask.mutateAsync({ id: assigningTask.id, assigned_to: m.id })
                setAssigningTask(null)
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left w-full ${
                assigningTask?.assigned_to === m.id
                  ? 'bg-brand/10 border border-brand/30'
                  : 'hover:bg-surface-raised'
              }`}
            >
              <span className="h-8 w-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-sm font-semibold text-brand-light flex-shrink-0">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white leading-tight">{m.name}</p>
                <p className="text-xs text-faded truncate">{m.email}</p>
              </div>
              {assigningTask?.assigned_to === m.id && (
                <svg className="h-4 w-4 text-brand ml-auto flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-faded text-center py-4">
              No hay miembros en el proyecto.{' '}
              <span className="text-brand">Agrega miembros primero.</span>
            </p>
          )}
        </div>
      </Modal>

      <Modal open={!!deletingTask} onClose={() => setDeletingTask(null)} title="Eliminar tarea">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            ¿Estás seguro que deseas eliminar <strong className="text-white">{deletingTask?.title}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setDeletingTask(null)}>Cancelar</Button>
            <Button
              variant="danger"
              loading={deleteTask.isPending}
              onClick={async () => {
                if (!deletingTask) return
                await deleteTask.mutateAsync(deletingTask.id)
                setDeletingTask(null)
              }}
            >
              Sí, eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Editar tarea">
        <div className="flex flex-col gap-4">
          <Input
            label="Título"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            maxLength={50}
            autoFocus
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted">Prioridad</label>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as typeof editPriority)}
              className="rounded-lg border border-border bg-surface text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          {members.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted">Asignado a</label>
              <select
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
                className="rounded-lg border border-border bg-surface text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          <Textarea
            label="Descripción"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingTask(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} loading={updateTask.isPending} disabled={!editTitle.trim() || !editDescription.trim()}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
