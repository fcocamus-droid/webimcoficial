'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import PasswordInput from '@/app/components/PasswordInput'

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/panel'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('Credenciales inválidas. Verifica tu email y contraseña.')
        setLoading(false)
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Error de red. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-navy-600 mb-1">Iniciar sesión</h1>
        <p className="text-slate-600 text-sm">
          Accede a tu cuenta del marketplace
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-5"
      >
        <div>
          <label className="label-base">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            placeholder="nombre@empresa.cl"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label-base mb-0">Contraseña</label>
            <Link
              href="/recuperar"
              className="text-xs text-amber-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="text-center text-sm text-slate-600 pt-2 border-t border-slate-100">
          ¿No tienes cuenta?{' '}
          <Link
            href="/registro"
            className="text-amber-600 font-medium hover:underline"
          >
            Crea una gratis
          </Link>
        </p>
      </form>
    </div>
  )
}
