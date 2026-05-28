'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Props = {
  productId: string
  variant?: 'icon' | 'pill'
  className?: string
}

/**
 * Botón corazón para marcar/desmarcar un producto como favorito.
 * Solo para usuarios BUYER. Anónimos van a login. Sellers ven
 * mensaje contextual al hacer hover.
 */
export default function FavoriteButton({
  productId,
  variant = 'pill',
  className = '',
}: Props) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [favorite, setFavorite] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  // Cargar estado inicial
  useEffect(() => {
    if (status !== 'authenticated') return
    const role = (session?.user as any)?.role
    if (role !== 'BUYER') return
    fetch(`/api/buyer/favorites/${productId}`)
      .then((r) => r.json())
      .then((j) => setFavorite(!!j.favorite))
      .catch(() => {})
  }, [productId, status, session])

  const role = (session?.user as any)?.role

  const onToggle = async () => {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (role !== 'BUYER') return
    setLoading(true)
    const next = !favorite
    setFavorite(next) // optimistic
    try {
      const res = await fetch(`/api/buyer/favorites/${productId}`, {
        method: next ? 'POST' : 'DELETE',
      })
      if (!res.ok) setFavorite(!next) // revert
    } catch {
      setFavorite(!next) // revert
    } finally {
      setLoading(false)
    }
  }

  const filled = favorite === true

  if (variant === 'icon') {
    return (
      <button
        onClick={onToggle}
        disabled={loading}
        aria-label={filled ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        title={
          status !== 'authenticated'
            ? 'Inicia sesión para guardar favoritos'
            : role !== 'BUYER'
              ? 'Solo los compradores pueden marcar favoritos'
              : filled
                ? 'Quitar de favoritos'
                : 'Agregar a favoritos'
        }
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          filled
            ? 'bg-red-50 text-red-600'
            : 'bg-white text-slate-400 hover:text-red-600'
        } border border-slate-200 hover:border-red-300 ${className}`}
      >
        <Heart filled={filled} />
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      title={
        status !== 'authenticated'
          ? 'Inicia sesión para guardar favoritos'
          : role !== 'BUYER'
            ? 'Solo los compradores pueden marcar favoritos'
            : ''
      }
      className={`inline-flex items-center gap-2 font-semibold px-4 py-2.5 rounded-lg border transition-all ${
        filled
          ? 'bg-red-50 border-red-300 text-red-600'
          : 'bg-white border-slate-300 text-slate-700 hover:border-red-300 hover:text-red-600'
      } disabled:opacity-60 ${className}`}
    >
      <Heart filled={filled} />
      <span className="text-sm">
        {filled ? 'En favoritos' : 'Agregar a favoritos'}
      </span>
    </button>
  )
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-5 h-5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  )
}
