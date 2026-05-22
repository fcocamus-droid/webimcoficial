'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession, signOut, SessionProvider } from 'next-auth/react'

type NavItem = {
  href: string
  label: string
  icon: string
  /** Roles that can see this item. If omitted, visible to all roles. */
  roles?: Array<'CLIENT' | 'EXECUTIVE' | 'SUPERADMIN'>
}

type Section = {
  title: string
  items: NavItem[]
}

const navSections: Section[] = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { href: '/cotizar', label: 'Cotizar', icon: 'M12 4.5v15m7.5-7.5h-15' },
    ],
  },
  {
    title: 'IMC Cargo',
    items: [
      { href: '/mis-cotizaciones', label: 'Mis Cotizaciones', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { href: '/operaciones', label: 'Mis Operaciones', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    ],
  },
  {
    title: 'IMC Box',
    items: [
      { href: '/box', label: 'Mi Casilla Miami', icon: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z' },
      { href: '/box/prealertas', label: 'Pre-alertas', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
      { href: '/box/historial', label: 'Historial paquetes', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
      { href: '/box/calculadora', label: 'Calculadora', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { href: '/admin', label: 'Centro de Control', icon: 'M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z', roles: ['SUPERADMIN', 'EXECUTIVE'] },
      { href: '/admin/cotizaciones', label: 'Todas las cotizaciones', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['SUPERADMIN', 'EXECUTIVE'] },
      { href: '/admin/operaciones', label: 'Todas las operaciones', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: ['SUPERADMIN', 'EXECUTIVE'] },
      { href: '/admin/empresas', label: 'Empresas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', roles: ['SUPERADMIN', 'EXECUTIVE'] },
    ],
  },
  {
    title: 'IMC Box · Admin',
    items: [
      { href: '/admin/box/paquetes', label: 'Paquetes Miami', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: ['SUPERADMIN', 'EXECUTIVE'] },
      { href: '/admin/box/prealertas', label: 'Pre-alertas (admin)', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', roles: ['SUPERADMIN', 'EXECUTIVE'] },
      { href: '/admin/box/embarques', label: 'Embarques', icon: 'M3 13l4-8h10l4 8M3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6M3 13h18', roles: ['SUPERADMIN', 'EXECUTIVE'] },
    ],
  },
  {
    title: 'Equipo y Config',
    items: [
      { href: '/admin/usuarios', label: 'Usuarios y roles', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', roles: ['SUPERADMIN'] },
      { href: '/admin/tarifas', label: 'Tarifas', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', roles: ['SUPERADMIN'] },
      { href: '/admin/surcharges', label: 'Recargos', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['SUPERADMIN'] },
      { href: '/admin/puertos', label: 'Puertos', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', roles: ['SUPERADMIN'] },
      { href: '/admin/configuracion', label: 'Configuración', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', roles: ['SUPERADMIN'] },
    ],
  },
  {
    title: 'Mi Cuenta',
    items: [
      { href: '/mi-cuenta', label: 'Perfil y empresas', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ],
  },
]

function PanelInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/admin') return pathname === '/admin'
    if (href === '/box') return pathname === '/box'
    return pathname?.startsWith(href) ?? false
  }

  const userName = session?.user?.name || 'Usuario'
  const userInitial = (userName || 'U').charAt(0).toUpperCase()
  const userRole = ((session?.user as any)?.role || 'CLIENT') as 'CLIENT' | 'EXECUTIVE' | 'SUPERADMIN'

  const roleLabel = userRole === 'SUPERADMIN' ? 'Admin' : userRole === 'EXECUTIVE' ? 'Ejecutivo' : 'Cliente'

  // All roles see the same panel (permissions to be applied later per user request)
  const visibleSections = navSections

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — Altaprop style */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-60
          bg-white border-r border-slate-200
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <div className="w-9 h-9 bg-[#F47920] rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-sm">
            IMC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1B2A6B] leading-tight">IMC Cargo</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Panel</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
          {visibleSections.map((section) => (
            <div key={section.title} className="mb-3">
              <p className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm
                        transition-colors duration-150
                        ${active
                          ? 'bg-[#F47920]/10 text-[#1B2A6B] font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                      `}
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#F47920] rounded-r-full" />
                      )}
                      <svg
                        className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[#F47920]' : 'text-slate-400'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-2.5 px-1 py-2">
            <div className="w-9 h-9 bg-[#1B2A6B] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-[10px] text-[#F47920] uppercase tracking-wide font-semibold">
                {roleLabel}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/56990014375"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50"
              title="Contactar por WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Notificaciones">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PanelInner>{children}</PanelInner>
    </SessionProvider>
  )
}
