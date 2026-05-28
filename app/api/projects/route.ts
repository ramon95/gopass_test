import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireAuth()

    const whereClause = session.role === 'admin'
      ? 'WHERE p.owner_id = $1'
      : `WHERE EXISTS (
           SELECT 1 FROM project_members pm
           WHERE pm.project_id = p.id AND pm.user_id = $1
         )`

    const { rows } = await db.query(
      `SELECT p.*,
         COUNT(t.id) FILTER (WHERE t.status != 'done') AS incomplete_tasks_count
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [session.userId]
    )
    return NextResponse.json(rows)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden crear proyectos' }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    }
    if (name.trim().length > 80) {
      return NextResponse.json({ error: 'El nombre no puede superar 80 caracteres' }, { status: 400 })
    }
    if (description && description.trim().length > 200) {
      return NextResponse.json({ error: 'La descripción no puede superar 200 caracteres' }, { status: 400 })
    }

    const { rows } = await db.query(
      'INSERT INTO projects (owner_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [session.userId, name.trim(), description?.trim() || null]
    )
    return NextResponse.json(rows[0], { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('[POST /api/projects]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
