'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RecuperarForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
    } catch {
      /* ignore — siempre mostramos confirmación genérica */
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-navy-600 mb-1">
          Recuperar contraseña
        </h1>
        <p className="text-slate-600 text-sm">
          Te enviaremos un link para crear una nueva
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-verified-50 text-verified-600 flex items-center justify-center text-3xl">
              ✓
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Revisa tu bandeja
            </h2>
            <p className="text-sm text-slate-600">
              Si <strong>{email}</strong> está registrado en IMC Industriales,
              te acabamos de enviar un email con instrucciones para crear una
              nueva contraseña. El link es válido por 1 hora.
            </p>
            <p className="text-xs text-slate-500">
              ¿No te llegó? Revisa la carpeta de spam o promociones, o vuelve
              a solicitarlo en un par de minutos.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => {
                  setSent(false)
                  setEmail('')
                }}
                className="btn-secondary text-sm"
              >
                Probar con otro email
              </button>
              <Link href="/login" className="btn-primary text-sm">
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="label-base">Email de tu cuenta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="nombre@empresa.cl"
                required
                autoComplete="email"
                autoFocus
              />
              <p className="helper-text">
                Te enviaremos un link único a tu correo. Si no lo encuentras
                revisa la carpeta de spam.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando…' : 'Enviar link de recuperación'}
            </button>

            <p className="text-center text-sm text-slate-600 pt-2 border-t border-slate-100">
              ¿Recordaste tu contraseña?{' '}
              <Link
                href="/login"
                className="text-amber-600 font-medium hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
