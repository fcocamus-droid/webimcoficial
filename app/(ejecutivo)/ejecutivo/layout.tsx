'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { LayoutDashboard, Users, FileText, Menu } from 'lucide-react'

const navItems = [
  { href: '/ejecutivo', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/ejecutivo/clientes', label: 'Mis Clientes', icon: Users, exact: false },
  { href: '/ejecutivo/cotizaciones', label: 'Cotizaciones', icon: FileText, exact: false },
]

export default function EjecutivoInnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const userName = session?.user?.name || 'Ejecutivo'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1B2A6B] text-white
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-[#F47920] rounded-lg flex items-center justify-center font-bold text-sm">
            IMC
          </div>
          <span className="text-lg font-bold tracking-tight">IMC Cargo</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${active
                    ? 'bg-[#F47920] text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 text-xs text-blue-300">
          IMC Cargo &copy; {new Date().getFullYear()}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <span className="text-base font-semibold text-[#1B2A6B]">IMC Cargo Ejecutivo</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">
                <span className="inline-block bg-[#F47920]/10 text-[#F47920] font-semibold px-1.5 py-0.5 rounded text-[10px] tracking-wide">
                  EJECUTIVO
                </span>
              </p>
            </div>
            <div className="w-9 h-9 bg-[#1B2A6B] rounded-full flex items-center justify-center text-white text-sm font-bold">
              {userInitial}
            </div>
            <Link
              href="/signout"
              className="ml-2 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Cerrar Sesión"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
