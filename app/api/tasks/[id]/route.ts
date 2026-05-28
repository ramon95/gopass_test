import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

async function getOwnedTask(taskId: string, userId: string) {
  const { rows } = await db.query(
    `SELECT t.* FROM tasks t
     JOIN projects p ON p.id = t.project_id
     WHERE t.id = $1 AND (
       p.owner_id = $2
       OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $2)
     )`,
    [taskId, userId]
  )
  return rows[0] ?? null
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const task = await getOwnedTask(id, session.userId)
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, priority, due_date } = body
    // assigned_to can be explicitly null to unassign
    const assigned_to = 'assigned_to' in body ? body.assigned_to : undefined

    if (title !== undefined && !title?.trim()) {
      return NextResponse.json({ error: 'El título no puede estar vacío' }, { status: 400 })
    }
    if (title?.trim()?.length > 50) {
      return NextResponse.json({ error: 'El título no puede superar 50 caracteres' }, { status: 400 })
    }
    if (description !== undefined && !description?.trim()) {
      return NextResponse.json({ error: 'La descripción no puede estar vacía' }, { status: 400 })
    }
    if (description?.trim()?.length > 500) {
      return NextResponse.json({ error: 'La descripción no puede superar 500 caracteres' }, { status: 400 })
    }

    // Verify assigned_to is a project member if provided
    if (assigned_to) {
      const { rows: member } = await db.query(
        `SELECT 1 FROM projects p
         WHERE p.id = $1 AND (
           p.owner_id = $2
           OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = $2)
         )`,
        [task.project_id, assigned_to]
      )
      if (member.length === 0) {
        return NextResponse.json({ error: 'El usuario no es miembro del proyecto' }, { status: 400 })
      }
    }

    const { rows } = await db.query(
      `UPDATE tasks SET
        title       = COALESCE($1, title),
        description = COALESCE($2, description),
        priority    = COALESCE($3, priority),
        due_date    = COALESCE($4, due_date),
        assigned_to = CASE WHEN $5 = true THEN $6 ELSE assigned_to END,
        updated_at  = NOW()
       WHERE id = $7 RETURNING *`,
      [
        title?.trim() || null,
        description?.trim() || null,
        priority || null,
        due_date || null,
        assigned_to !== undefined,
        assigned_to ?? null,
        id,
      ]
    )
    return NextResponse.json(rows[0])
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const task = await getOwnedTask(id, session.userId)
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    // Eliminar y reordenar las tareas restantes de esa columna
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM tasks WHERE id = $1', [id])
      await client.query(
        `UPDATE tasks SET "order" = "order" - 1
         WHERE project_id = $1 AND status = $2 AND "order" > $3`,
        [task.project_id, task.status, task.order]
      )
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    return NextResponse.json({ message: 'Tarea eliminada' })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
