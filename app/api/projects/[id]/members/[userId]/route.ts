import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type Params = { params: Promise<{ id: string; userId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth()
    const { id, userId } = await params

    const { rows: proj } = await db.query(
      'SELECT owner_id FROM projects WHERE id = $1 AND owner_id = $2',
      [id, session.userId]
    )
    if (proj.length === 0) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }
    if (userId === session.userId) {
      return NextResponse.json({ error: 'No puedes eliminar al propietario' }, { status: 400 })
    }

    await db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    )
    return NextResponse.json({ message: 'Miembro eliminado' })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
