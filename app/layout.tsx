import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Providers from '@/components/Providers'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gopass Manager',
  description: 'Gestión de tareas por proyectos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${geist.className} h-full bg-bg text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
