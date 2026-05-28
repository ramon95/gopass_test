import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ message: 'Sesión cerrada' })
  response.cookies.set(clearAuthCookie())
  return response
}
