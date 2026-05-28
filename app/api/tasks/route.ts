import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { project_id, title, description, priority, status, due_date, assigned_to } = await request.json()

    if (!project_id || !title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'project_id, title y description son requeridos' }, { status: 400 })
    }
    if (title.trim().length > 50) {
      return NextResponse.json({ error: 'El título no puede superar 50 caracteres' }, { status: 400 })
    }
    if (description.trim().length > 500) {
      return NextResponse.json({ error: 'La descripción no puede superar 500 caracteres' }, { status: 400 })
    }

    // Verificar que el usuario es propietario o miembro del proyecto
    const { rows: proj } = await db.query(
      `SELECT id FROM projects WHERE id = $1 AND (
         owner_id = $2
         OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = $2)
       )`,
      [project_id, session.userId]
    )
    if (proj.length === 0) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    // Verificar que el asignado es miembro del proyecto
    if (assigned_to) {
      const { rows: member } = await db.query(
        `SELECT 1 FROM projects p
         WHERE p.id = $1 AND (
           p.owner_id = $2
           OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = $2)
         )`,
        [project_id, assigned_to]
      )
      if (member.length === 0) {
        return NextResponse.json({ error: 'El usuario no es miembro del proyecto' }, { status: 400 })
      }
    }

    const taskStatus = status ?? 'pending'

    const { rows: maxRow } = await db.query(
      'SELECT COALESCE(MAX("order"), -1) AS max_order FROM tasks WHERE project_id = $1 AND status = $2',
      [project_id, taskStatus]
    )
    const newOrder = (maxRow[0].max_order as number) + 1

    const { rows } = await db.query(
      `INSERT INTO tasks (project_id, assigned_to, title, description, priority, status, "order", due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        project_id,
        assigned_to || null,
        title.trim(),
        description.trim(),
        priority ?? 'medium',
        taskStatus,
        newOrder,
        due_date || null,
      ]
    )
    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
