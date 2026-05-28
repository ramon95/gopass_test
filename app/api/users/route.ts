import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
    const { rows } = await db.query(
      'SELECT id, name, email FROM users ORDER BY name ASC'
    )
    return NextResponse.json(rows)
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
