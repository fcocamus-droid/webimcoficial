'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  rfqId: string
  toCompanyId: string
  sellerName: string
  /** Si ya existe una review previa, la mostramos en modo lectura. */
  existingReview?: {
    rating: number
    comment: string | null
    createdAt: string
  } | null
}

export default function ReviewForm({
  rfqId,
  toCompanyId,
  sellerName,
  existingReview,
}: Props) {
  const router = useRouter()
  const [rating, setRating] = useState<number>(0)
  const [hover, setHover] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Si ya hay reseña, modo lectura
  if (existingReview) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⭐</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 mb-1">
              Ya dejaste tu reseña para {sellerName}
            </p>
            <div className="text-amber-500 text-xl tracking-wider mb-1">
              {'★'.repeat(existingReview.rating)}
              <span className="text-amber-200">
                {'☆'.repeat(5 - existingReview.rating)}
              </span>
            </div>
            {existingReview.comment && (
              <p className="text-sm text-slate-700 italic whitespace-pre-line">
                {`"${existingReview.comment}"`}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              {new Date(existingReview.createdAt).toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Confirmación post-envío
  if (done) {
    return (
      <div className="bg-verified-50 border border-verified-500/40 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">🙏</div>
        <p className="font-semibold text-verified-600 mb-1">
          ¡Gracias por tu reseña!
        </p>
        <p className="text-sm text-slate-600">
          Ayudas a otros compradores a tomar mejores decisiones.
        </p>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (rating < 1) {
      setError('Selecciona una calificación con las estrellas')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/buyer/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toCompanyId,
          rfqId,
          rating,
          comment: comment.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }
      setDone(true)
      router.refresh()
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  const current = hover || rating

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border-2 border-amber-300 rounded-2xl p-5"
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">⭐</span>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900">
            ¿Cómo fue tu experiencia con {sellerName}?
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Tu reseña aparecerá en el perfil público del proveedor y ayuda a
            otros compradores empresariales.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="text-4xl leading-none transition-transform hover:scale-110"
            aria-label={`${s} estrellas`}
          >
            <span
              className={
                current >= s ? 'text-amber-500' : 'text-slate-300'
              }
            >
              ★
            </span>
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-semibold text-amber-700">
            {RATING_LABELS[rating]}
          </span>
        )}
      </div>

      <div className="mb-4">
        <label className="label-base">Comentario (opcional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input-base min-h-[90px]"
          placeholder="Cuéntales a otros compradores cómo fue la calidad del producto, el plazo de entrega, la comunicación…"
          maxLength={2000}
        />
        <p className="helper-text">{comment.length} / 2000</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 mb-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || rating < 1}
        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando…' : 'Publicar reseña'}
      </button>
    </form>
  )
}

const RATING_LABELS: Record<number, string> = {
  1: 'Muy mala',
  2: 'Mala',
  3: 'Regular',
  4: 'Buena',
  5: 'Excelente',
}
