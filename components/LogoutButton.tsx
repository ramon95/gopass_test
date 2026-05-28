'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

export default function LogoutButton() {
  const router = useRouter()
  const qc = useQueryClient()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    qc.clear()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-muted hover:text-red-400 transition-colors"
    >
      Salir
    </button>
  )
}
