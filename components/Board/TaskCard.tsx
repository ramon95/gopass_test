'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task, TaskPriority } from '@/lib/types'

const priorityBadge: Record<TaskPriority, string> = {
  low:    'bg-brand/10 text-brand-light border border-brand/20',
  medium: 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/20',
  high:   'bg-red-500/10 text-red-400 border border-red-500/20',
}

const priorityLabel: Record<TaskPriority, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta',
}

interface Props {
  task: Task
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onAssign?: (task: Task) => void
  onView?: (task: Task) => void
}

export default function TaskCard({ task, onDelete, onEdit, onAssign, onView }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg bg-surface-raised p-3 border border-border-light cursor-grab active:cursor-grabbing select-none hover:border-brand/40 transition-colors"
      onClick={() => { if (!isDragging && onView) onView(task) }}
      {...attributes}
      {...listeners}
    >
      <p className="text-sm font-medium text-white mb-2 leading-snug truncate">{task.title}</p>
      {task.description && (
        <p className="text-xs text-muted mb-2 line-clamp-2 break-all">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityBadge[task.priority]}`}>
          {priorityLabel[task.priority]}
        </span>
        <div className="flex items-center gap-1">
          {onAssign && (
            <button
              onClick={(e) => { e.stopPropagation(); onAssign(task) }}
              title={task.assigned_user_name ? `Asignado a ${task.assigned_user_name}` : 'Asignar usuario'}
              className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                task.assigned_user_name
                  ? 'bg-brand/20 border border-brand/30 text-[10px] font-semibold text-brand-light hover:border-brand/60'
                  : 'bg-surface border border-border text-faded hover:text-brand hover:border-brand/40'
              }`}
            >
              {task.assigned_user_name
                ? task.assigned_user_name.charAt(0).toUpperCase()
                : (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                )
              }
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task) }}
            className="h-6 w-6 rounded-full flex items-center justify-center bg-surface border border-border text-faded hover:text-brand hover:border-brand/40 transition-colors"
            aria-label="Editar tarea"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
            className="h-6 w-6 rounded-full flex items-center justify-center bg-surface border border-border text-faded hover:text-red-400 hover:border-red-500/40 transition-colors"
            aria-label="Eliminar tarea"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
