'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Logo from './Logo'

const navLinks = [
  { href: '/categorias', label: 'Categorías' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/precios', label: 'Precios' },
]

export default function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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
          <Link href="/login" className="hidden sm:inline-flex btn-ghost text-sm">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="btn-primary text-sm">
            Crear cuenta
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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
          <Link href="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-700">
            Iniciar sesión
          </Link>
        </div>
      )}
    </header>
  )
}
