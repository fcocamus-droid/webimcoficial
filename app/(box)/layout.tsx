'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, SessionProvider } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import IMCBoxLogo from '../components/brand/IMCBoxLogo'

const navLinks = [
  { href: '/box', label: 'Dashboard', icon: '📊' },
  { href: '/box/casilla', label: 'Mi Casilla', icon: '📬' },
  { href: '/box/prealertas', label: 'Pre-alertas', icon: '🔔' },
  { href: '/box/historial', label: 'Historial', icon: '📦' },
  { href: '/box/calculadora', label: 'Calculadora', icon: '🧮' },
]

function BoxNavbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="bg-gradient-to-r from-[#1B2A6B] to-[#2D3F8E] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/box" className="flex items-center">
            <IMCBoxLogo variant="mono-white" size="sm" />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/box' && pathname?.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#F47920] flex items-center justify-center text-white font-semibold text-xs">
                    {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[140px] truncate">{session.user.name || session.user.email}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Conectado como</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{session.user.email}</p>
                    </div>
                    <Link
                      href="/mi-cuenta"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Mi Cuenta
                    </Link>
                    <Link
                      href="/cotizar"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      🚢 Cotizar Carga (IMC Cargo)
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <Link
                      href="/signout"
                      className="block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Cerrar Sesión
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login?callbackUrl=/box"
                className="bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/box' && pathname?.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-white/15 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
          <hr className="border-white/10 my-2" />
          {session?.user ? (
            <>
              <Link href="/mi-cuenta" className="block px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-white/10" onClick={() => setMobileOpen(false)}>Mi Cuenta</Link>
              <Link href="/signout" className="block px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-white/10" onClick={() => setMobileOpen(false)}>Cerrar Sesión</Link>
            </>
          ) : (
            <Link href="/login?callbackUrl=/box" className="block px-3 py-2 rounded-lg text-sm text-[#F47920] font-medium" onClick={() => setMobileOpen(false)}>Iniciar Sesión</Link>
          )}
        </div>
      )}
    </nav>
  )
}

export default function BoxLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-slate-50">
        <BoxNavbar />
        <main>{children}</main>
      </div>
    </SessionProvider>
  )
}
