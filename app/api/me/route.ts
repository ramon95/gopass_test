import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await requireAuth()
    return NextResponse.json({
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    })
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}
