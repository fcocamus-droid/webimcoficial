'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSession, signOut, SessionProvider } from 'next-auth/react'
import IMCLogo from '@/app/components/IMCLogo'

type NavItem = { href: string; label: string; icon: React.ReactNode }
type NavSection = { title?: string; items: NavItem[] }

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12L12 2.25l9.75 9.75M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const InboxIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
  </svg>
)

const CalcIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

type SidebarItem = NavItem & { adminOnly?: boolean }
type SidebarSection = { title?: string; items: SidebarItem[]; adminOnly?: boolean }

const BoxIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
)

const navSections: SidebarSection[] = [
  { items: [{ href: '/panel', label: 'Escritorio', icon: <HomeIcon /> }] },
  {
    title: 'Mis Guías',
    items: [
      { href: '/panel/carga-directa', label: 'Carga Directa', icon: <InboxIcon /> },
      { href: '/panel/couriers', label: 'Couriers', icon: <InboxIcon /> },
      { href: '/panel/fcl', label: 'Marítimos FCL', icon: <InboxIcon /> },
      { href: '/panel/lcl', label: 'Marítimos LCL', icon: <InboxIcon /> },
    ],
  },
  {
    title: 'Tienda',
    adminOnly: true,
    items: [
      { href: '/panel/productos', label: 'Productos', icon: <BoxIcon />, adminOnly: true },
    ],
  },
  {
    title: 'Mi cuenta',
    items: [{ href: '/panel/perfil', label: 'Perfil', icon: <UserIcon /> }],
  },
]

function PanelInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Mis Guías': true,
    'Tienda': true,
    'Mi cuenta': true,
  })
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role as 'CLIENT' | 'EXECUTIVE' | 'SUPERADMIN' | undefined
  const isAdmin = userRole === 'SUPERADMIN' || userRole === 'EXECUTIVE'

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((it) => !it.adminOnly || isAdmin),
    }))
    .filter((s) => s.items.length > 0 && (!s.adminOnly || isAdmin))

  const isActive = (href: string) => {
    if (href === '/panel') return pathname === '/panel'
    return pathname?.startsWith(href)
  }

  const userName = session?.user?.name || 'Usuario'
  const userInitial = (userName || 'U').slice(0, 2).toUpperCase()
  const userCompany = session?.user?.email || ''

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* TOP BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-4 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>

          <Link href="/panel" className="flex items-center">
            <IMCLogo size="md" />
          </Link>

          <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2"><SearchIcon /></span>
              <input
                type="text"
                placeholder="Buscar"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:bg-white focus:border-[#F47920]/40 focus:ring-2 focus:ring-[#F47920]/10 transition-all"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-xs text-slate-500">Cliente</p>
              <p className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">{userName}</p>
            </div>
            <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {userInitial}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* MOBILE OVERLAY */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* SIDEBAR */}
        <aside
          className={`
            fixed lg:sticky top-16 lg:top-16 left-0 z-40 w-64 bg-[#fafafa] lg:bg-transparent
            h-[calc(100vh-4rem)] overflow-y-auto
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          `}
        >
          <nav className="px-4 py-6 space-y-5">
            {visibleSections.map((section, idx) => (
              <div key={section.title || `section-${idx}`}>
                {section.title && (
                  <button
                    onClick={() => setOpenSections((p) => ({ ...p, [section.title!]: !p[section.title!] }))}
                    className="w-full flex items-center justify-between px-2 py-1 text-xs text-slate-500 font-medium uppercase tracking-wide hover:text-slate-700"
                  >
                    <span>{section.title}</span>
                    <svg className={`w-4 h-4 transition-transform ${openSections[section.title] ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                )}
                {(!section.title || openSections[section.title]) && (
                  <div className="mt-2 space-y-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors
                            ${active
                              ? 'bg-[#F47920]/10 text-[#F47920] font-semibold'
                              : 'text-slate-700 hover:bg-slate-100'
                            }
                          `}
                        >
                          <span className={active ? 'text-[#F47920]' : 'text-slate-400'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full mt-4 flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* MAIN */}
        <main className="flex-1 lg:ml-0 px-4 sm:px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
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
