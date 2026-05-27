'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    const errs: Record<string, string> = {}
    if (!pass || pass.length < 8) errs.pass = 'Mínimo 8 caracteres'
    if (pass !== pass2) errs.pass2 = 'Las contraseñas no coinciden'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pass }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || 'Error al guardar')
        setLoading(false)
        return
      }
      setDone(true)
      // Redirigir a /login después de 2s
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setServerError('Error de red')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-verified-50 text-verified-600 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          Contraseña actualizada
        </h2>
        <p className="text-sm text-slate-600">
          Te estamos llevando al login para que ingreses con tu nueva
          contraseña…
        </p>
        <Link href="/login" className="btn-primary inline-block">
          Iniciar sesión ahora →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="label-base">Nueva contraseña</label>
        <input
          type="password"
          value={pass}
          onChange={(e) => {
            setPass(e.target.value)
            setErrors((x) => ({ ...x, pass: '' }))
          }}
          className="input-base"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          autoFocus
        />
        {errors.pass && <p className="error-text">{errors.pass}</p>}
      </div>

      <div>
        <label className="label-base">Repite la nueva contraseña</label>
        <input
          type="password"
          value={pass2}
          onChange={(e) => {
            setPass2(e.target.value)
            setErrors((x) => ({ ...x, pass2: '' }))
          }}
          className="input-base"
          autoComplete="new-password"
        />
        {errors.pass2 && <p className="error-text">{errors.pass2}</p>}
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
      </button>
    </form>
  )
}
