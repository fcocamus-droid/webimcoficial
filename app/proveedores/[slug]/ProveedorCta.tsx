'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

type Props = {
  companyId: string
  companySlug: string
  companyRazonSocial: string
  /** Si la empresa tiene al menos 1 producto disponible mostramos atajo a su catálogo */
  hasProducts: boolean
  /** Categoría más usada por los productos del seller (para pre-llenar la RFQ) */
  defaultCategoryId?: string | null
}

export default function ProveedorCta({
  companyId,
  companySlug,
  companyRazonSocial,
  hasProducts,
  defaultCategoryId,
}: Props) {
  const { data: session, status } = useSession()
  const user = session?.user as any
  const role = user?.role

  // Anónimo
  if (status !== 'authenticated') {
    return (
      <div className="bg-amber-gradient text-white rounded-2xl p-5">
        <p className="font-bold mb-1">Solicita una cotización</p>
        <p className="text-white/90 text-sm mb-3">
          Crea tu cuenta de comprador y contacta directo a este proveedor
          dentro del marketplace.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href={`/login?callbackUrl=/proveedores/${companySlug}`}
            className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-4 py-2 rounded-lg text-sm text-center"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro?tipo=comprador"
            className="bg-white/10 hover:bg-white/20 border border-white/40 text-white font-semibold px-4 py-2 rounded-lg text-sm text-center"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    )
  }

  // BUYER — flujo principal
  if (role === 'BUYER') {
    // Construir URL de nueva RFQ pre-llenada con la categoría del proveedor
    const rfqUrl =
      '/panel/comprador/rfqs/nueva' +
      (defaultCategoryId ? `?categoryId=${defaultCategoryId}` : '')

    return (
      <div className="bg-amber-gradient text-white rounded-2xl p-5">
        <p className="font-bold text-lg mb-1">Contacta a {companyRazonSocial}</p>
        <p className="text-white/90 text-sm mb-4">
          Solicita una cotización personalizada o explora su catálogo.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href={rfqUrl}
            className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-4 py-2.5 rounded-lg text-sm text-center"
          >
            💸 Solicitar cotización →
          </Link>
          {hasProducts && (
            <a
              href="#catalogo"
              className="bg-white/10 hover:bg-white/20 border border-white/40 text-white font-semibold px-4 py-2 rounded-lg text-sm text-center"
            >
              📦 Ver catálogo
            </a>
          )}
        </div>
        <p className="text-white/70 text-xs mt-3">
          Tu solicitud llegará a este y otros proveedores de la misma categoría
          para que compares precios.
        </p>
      </div>
    )
  }

  // SELLER mirando su propio perfil
  if (role === 'SELLER' && user?.id) {
    // No tenemos el companyOwnerId aquí, así que mostramos un CTA neutro
    // que invita a editar perfil. El edit funciona solo si es realmente
    // el dueño (el endpoint server-side valida).
    return (
      <div className="bg-navy-700 text-white rounded-2xl p-5">
        <p className="font-bold mb-1">Estás logueado como fabricante</p>
        <p className="text-white/80 text-sm mb-4">
          Si éste es tu perfil, puedes editarlo desde tu panel. Los
          fabricantes no envían cotizaciones a otros fabricantes.
        </p>
        <Link
          href="/panel/vendedor/perfil"
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-lg text-sm inline-block"
        >
          Ir a mi perfil empresa →
        </Link>
      </div>
    )
  }

  // SUPERADMIN
  if (role === 'SUPERADMIN') {
    return (
      <div className="bg-navy-700 text-white rounded-2xl p-5">
        <p className="font-bold mb-1">Acceso como superadmin</p>
        <p className="text-white/80 text-sm mb-4">
          Desde el panel puedes verificar este proveedor, revisar sus
          certificaciones y moderarlo.
        </p>
        <Link
          href={`/panel/superadmin/empresas?q=${encodeURIComponent(companyRazonSocial)}`}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-lg text-sm inline-block"
        >
          Gestionar en panel admin →
        </Link>
      </div>
    )
  }

  // SALES_AGENT
  if (role === 'SALES_AGENT') {
    return (
      <div className="bg-navy-700 text-white rounded-2xl p-5">
        <p className="font-bold mb-1">Acceso como agente de ventas</p>
        <p className="text-white/80 text-sm">
          Tu rol es operacional: ayudar a onboardar proveedores y dar
          soporte. Las cotizaciones las envían los compradores.
        </p>
      </div>
    )
  }

  // Fallback (ADMIN u otros)
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">
      Las cotizaciones se envían desde una cuenta de comprador empresarial.
    </div>
  )
}
