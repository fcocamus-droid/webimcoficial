import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const metadata = {
  title: 'Proveedores · IMC Industriales',
  description:
    'Directorio de fabricantes e importadores industriales en Chile.',
}

const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
]

export default async function ProveedoresIndex({
  searchParams,
}: {
  searchParams: { q?: string; region?: string; verified?: string }
}) {
  const where: Prisma.CompanyWhereInput = {
    isSeller: true,
    ...(searchParams.q
      ? {
          OR: [
            { razonSocial: { contains: searchParams.q, mode: 'insensitive' } },
            { giro: { contains: searchParams.q, mode: 'insensitive' } },
            { description: { contains: searchParams.q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(searchParams.region
      ? { region: { contains: searchParams.region, mode: 'insensitive' } }
      : {}),
    ...(searchParams.verified === '1' ? { verified: true } : {}),
  }

  const companies = await prisma.company.findMany({
    where,
    include: {
      _count: {
        select: {
          products: { where: { available: true } },
          certifications: true,
        },
      },
    },
    orderBy: [{ verified: 'desc' }, { ratingAverage: 'desc' }, { createdAt: 'desc' }],
    take: 60,
  })

  return (
    <>
      <Header />
      <main>
        <section className="bg-navy-gradient text-white py-12">
          <div className="container-base">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              Proveedores industriales
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              Fabricantes e importadores chilenos verificados, listos para
              cotizar contigo.
            </p>
          </div>
        </section>

        <section className="bg-slate-50 py-8 min-h-screen">
          <div className="container-base">
            <form
              method="GET"
              className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]"
            >
              <div>
                <label className="label-base text-xs">Buscar</label>
                <input
                  type="text"
                  name="q"
                  defaultValue={searchParams.q || ''}
                  className="input-base"
                  placeholder="Razón social, giro…"
                />
              </div>
              <div>
                <label className="label-base text-xs">Región</label>
                <select
                  name="region"
                  defaultValue={searchParams.region || ''}
                  className="input-base"
                >
                  <option value="">Cualquiera</option>
                  {REGIONES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm self-end pb-2">
                <input
                  type="checkbox"
                  name="verified"
                  value="1"
                  defaultChecked={searchParams.verified === '1'}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span>Solo verificados</span>
              </label>
              <button type="submit" className="btn-primary self-end">
                Filtrar
              </button>
            </form>

            <p className="text-sm text-slate-600 mb-4">
              {companies.length} proveedor{companies.length !== 1 ? 'es' : ''}
              {Object.keys(searchParams).length > 0 && (
                <>
                  {' · '}
                  <Link
                    href="/proveedores"
                    className="text-amber-600 hover:underline"
                  >
                    Limpiar filtros
                  </Link>
                </>
              )}
            </p>

            {companies.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
                <div className="text-5xl mb-3">🏭</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Sin proveedores aún
                </h3>
                <p className="text-sm text-slate-600">
                  Estamos onboardeando fabricantes e importadores chilenos.
                  Vuelve pronto.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {companies.map((c) => (
                  <Link
                    key={c.id}
                    href={`/proveedores/${c.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-navy-600 hover:shadow-lg transition-all p-5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {c.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.logoUrl}
                          alt={c.razonSocial}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-navy-600 text-white text-base font-bold flex items-center justify-center">
                          {c.razonSocial.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 group-hover:text-navy-600 truncate">
                          {c.razonSocial}
                        </h3>
                        {c.giro && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                            {c.giro}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.verified && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-verified-600 bg-verified-50 px-2 py-0.5 rounded">
                          ✓ Verificado
                        </span>
                      )}
                      {c._count.certifications > 0 && (
                        <span className="text-xs font-semibold text-navy-600 bg-navy-600/5 px-2 py-0.5 rounded">
                          {c._count.certifications} certificación
                          {c._count.certifications !== 1 ? 'es' : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-600">
                        {c._count.products} producto
                        {c._count.products !== 1 ? 's' : ''}
                      </span>
                      {(c.ciudad || c.region) && (
                        <span className="text-slate-500">
                          📍 {c.ciudad || c.region}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
