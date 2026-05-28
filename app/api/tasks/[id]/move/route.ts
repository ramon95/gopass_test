import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import type { TaskStatus } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const { newStatus, newOrder, projectId } = await request.json() as {
      newStatus: TaskStatus
      newOrder: number
      projectId: string
    }

    if (newStatus === undefined || newOrder === undefined || !projectId) {
      return NextResponse.json({ error: 'newStatus, newOrder y projectId son requeridos' }, { status: 400 })
    }

    // Verificar ownership
    const { rows: ownership } = await db.query(
      `SELECT t.id, t.status, t."order" FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1 AND p.owner_id = $2`,
      [id, session.userId]
    )
    if (ownership.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const task = ownership[0]

    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // 1. Cerrar hueco en columna origen
      await client.query(
        `UPDATE tasks SET "order" = "order" - 1
         WHERE project_id = $1 AND status = $2 AND "order" > $3 AND id != $4`,
        [projectId, task.status, task.order, id]
      )

      // 2. Abrir hueco en columna destino
      await client.query(
        `UPDATE tasks SET "order" = "order" + 1
         WHERE project_id = $1 AND status = $2 AND "order" >= $3 AND id != $4`,
        [projectId, newStatus, newOrder, id]
      )

      // 3. Actualizar la tarea movida
      const { rows } = await client.query(
        `UPDATE tasks SET status = $1, "order" = $2, updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [newStatus, newOrder, id]
      )

      await client.query('COMMIT')
      return NextResponse.json(rows[0])
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
