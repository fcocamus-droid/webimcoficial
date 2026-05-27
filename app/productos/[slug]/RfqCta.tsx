'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function RfqCta({
  productSlug,
  productTitle,
}: {
  productSlug: string
  productTitle: string
}) {
  const { data: session, status } = useSession()
  const isAuth = status === 'authenticated'

  if (!isAuth) {
    return (
      <div className="bg-amber-gradient text-white rounded-2xl p-5">
        <p className="font-bold text-lg mb-1">¿Necesitas este producto?</p>
        <p className="text-white/90 text-sm mb-4">
          Inicia sesión como comprador para enviar una solicitud de cotización
          (RFQ) directa al fabricante.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/login?callbackUrl=/productos/${productSlug}`}
            className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-5 py-2.5 rounded-lg"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro?tipo=comprador"
            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-lg"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    )
  }

  const role = (session?.user as any)?.role

  if (role === 'SELLER') {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">
        Estás logueado como fabricante. Solo los compradores pueden enviar
        cotizaciones.
      </div>
    )
  }

  return (
    <div className="bg-amber-gradient text-white rounded-2xl p-5">
      <p className="font-bold text-lg mb-1">Solicita una cotización</p>
      <p className="text-white/90 text-sm mb-4">
        Envía cantidad, plazo y especificaciones al proveedor de {productTitle}.
        Recibirás la respuesta directo en tu panel.
      </p>
      <button
        disabled
        title="Módulo RFQ en construcción"
        className="bg-white text-amber-600 font-semibold px-5 py-2.5 rounded-lg opacity-80 cursor-not-allowed"
      >
        Solicitar cotización (próximamente)
      </button>
      <p className="text-white/70 text-xs mt-2">
        El flujo de RFQ estará disponible muy pronto.
      </p>
    </div>
  )
}
