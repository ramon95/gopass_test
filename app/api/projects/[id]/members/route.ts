import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const { rows: proj } = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND owner_id = $2',
      [id, session.userId]
    )
    if (proj.length === 0) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    const { rows } = await db.query(
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
    return NextResponse.json(rows)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const { rows: proj } = await db.query(
      'SELECT id, owner_id FROM projects WHERE id = $1 AND owner_id = $2',
      [id, session.userId]
    )
    if (proj.length === 0) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId es requerido' }, { status: 400 })
    }
    if (userId === session.userId) {
      return NextResponse.json({ error: 'Ya eres el propietario del proyecto' }, { status: 400 })
    }

    const { rows: user } = await db.query('SELECT id FROM users WHERE id = $1', [userId])
    if (user.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await db.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, userId]
    )
    return NextResponse.json({ message: 'Miembro agregado' }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
