import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

async function getOwnedProject(projectId: string, userId: string) {
  const { rows } = await db.query(
    'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
    [projectId, userId]
  )
  return rows[0] ?? null
}

async function getAccessibleProject(projectId: string, userId: string) {
  const { rows } = await db.query(
    `SELECT * FROM projects WHERE id = $1 AND (
       owner_id = $2
       OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = $2)
     )`,
    [projectId, userId]
  )
  return rows[0] ?? null
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const project = await getAccessibleProject(id, session.userId)
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    const { rows: tasks } = await db.query(
      `SELECT t.*, u.name AS assigned_user_name
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.project_id = $1
       ORDER BY t.status, t."order" ASC`,
      [id]
    )

    const { rows: members } = await db.query(
      `SELECT u.id, u.name, u.email,
         CASE WHEN u.id = p.owner_id THEN true ELSE false END AS is_owner
       FROM projects p
       JOIN users u ON (
         u.id = p.owner_id
         OR EXISTS (
           SELECT 1 FROM project_members pm
           WHERE pm.project_id = p.id AND pm.user_id = u.id
         )
       )
       WHERE p.id = $1
       ORDER BY is_owner DESC, u.name ASC`,
      [id]
    )

    return NextResponse.json({ ...project, tasks, members })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const project = await getOwnedProject(id, session.userId)
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    const { name, description } = await request.json()
    const { rows } = await db.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name?.trim() || null, description?.trim() || null, id]
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

    const project = await getOwnedProject(id, session.userId)
    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    await db.query('DELETE FROM projects WHERE id = $1', [id])
    return NextResponse.json({ message: 'Proyecto eliminado' })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
