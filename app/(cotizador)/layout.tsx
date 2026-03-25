'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, SessionProvider } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

const navLinks = [
  { href: '/cotizar', label: 'Cotizar' },
  { href: '/mis-cotizaciones', label: 'Mis Cotizaciones' },
]

function Navbar() {
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
    <nav className="bg-[#1B2A6B] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/cotizar" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F47920] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">IMC Cargo</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* User menu desktop */}
          <div className="hidden md:flex items-center gap-4">
            {session?.user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                    <Link
                      href="/mi-cuenta"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Mi Cuenta
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <Link
                      href="/signout"
                      className="block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Cerrar Sesion
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Iniciar Sesion
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            )
          })}
          <hr className="border-white/10 my-2" />
          {session?.user ? (
            <>
              <div className="px-3 py-2 text-sm text-blue-200">
                {session.user.name || session.user.email}
              </div>
              <Link
                href="/mi-cuenta"
                className="block px-3 py-2 rounded-lg text-sm text-blue-200 hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
              >
                Mi Cuenta
              </Link>
              <Link
                href="/signout"
                className="block px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
              >
                Cerrar Sesion
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="block px-3 py-2 rounded-lg text-sm text-[#F47920] font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Iniciar Sesion
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}

export default function CotizadorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
