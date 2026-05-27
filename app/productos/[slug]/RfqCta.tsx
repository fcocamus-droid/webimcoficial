'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function RfqCta({
  productId,
  productSlug,
  productTitle,
}: {
  productId: string
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

  if (role !== 'BUYER') {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">
        Las solicitudes de cotización están disponibles solo para cuentas de
        comprador empresarial.
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
      <Link
        href={`/panel/comprador/rfqs/nueva?productId=${productId}`}
        className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-5 py-2.5 rounded-lg inline-block"
      >
        Solicitar cotización →
      </Link>
    </div>
  )
}
