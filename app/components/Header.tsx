'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Logo from './Logo'

const navLinks = [
  { href: '/categorias', label: 'Categorías' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/precios', label: 'Precios' },
]

export default function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const user = session?.user as any
  const role = user?.role as 'ADMIN' | 'SELLER' | 'BUYER' | undefined
  const panelHref =
    role === 'SELLER'
      ? '/panel/vendedor'
      : role === 'ADMIN'
        ? '/panel/admin'
        : '/panel/comprador'

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="container-base h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname?.startsWith(l.href)
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-slate-700 hover:text-amber-600 hover:bg-slate-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {status === 'authenticated' && user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
              >
                <div className="w-8 h-8 rounded-full bg-navy-600 text-white flex items-center justify-center text-xs font-bold">
                  {(user.name || user.email || '?').slice(0, 1).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-slate-700 font-medium max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Sesión iniciada como</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs mt-1 inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {role === 'SELLER'
                        ? 'Fabricante / Importador'
                        : role === 'ADMIN'
                          ? 'Administrador'
                          : 'Comprador'}
                    </p>
                  </div>
                  <Link
                    href={panelHref}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Mi panel
                  </Link>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex btn-ghost text-sm">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="btn-primary text-sm">
                Crear cuenta
              </Link>
            </>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600"
            aria-label="Menú"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 px-4 py-3 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-slate-700 hover:text-amber-600"
            >
              {l.label}
            </Link>
          ))}
          {status === 'authenticated' ? (
            <>
              <Link
                href={panelHref}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-slate-700"
              >
                Mi panel
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="block py-2 text-sm text-red-600"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-slate-700"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
