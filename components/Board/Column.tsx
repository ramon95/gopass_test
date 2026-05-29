'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '@/lib/types'
import TaskCard from './TaskCard'

const columnMeta: Record<TaskStatus, { label: string; color: string; dot: string }> = {
  pending:     { label: 'Pendiente',   color: 'bg-surface border-border',         dot: 'bg-faded' },
  in_progress: { label: 'En progreso', color: 'bg-surface border-brand/40',       dot: 'bg-brand' },
  done:        { label: 'Completado',  color: 'bg-surface border-brand-hover/50', dot: 'bg-brand-hover' },
}

interface Props {
  status: TaskStatus
  tasks: Task[]
  onDeleteTask: (task: Task) => void
  onEditTask: (task: Task) => void
  onAssignTask: (task: Task) => void
}

export default function Column({ status, tasks, onDeleteTask, onEditTask, onAssignTask }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = columnMeta[status]

  return (
    <div className={`flex flex-col rounded-xl border-2 overflow-hidden isolate ${meta.color} ${isOver ? 'ring-2 ring-brand' : ''} min-h-[400px] w-72 flex-shrink-0 transition-all`}>
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
        <h3 className="font-semibold text-sm text-white">{meta.label}</h3>
        <span className="ml-auto text-xs text-faded font-medium">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex flex-col gap-2 p-3 flex-1">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={() => onDeleteTask(task)} onEdit={onEditTask} onAssign={onAssignTask} />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-faded text-center py-4">Sin tareas</p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
