import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import CopyButton from './CopyButton'

export const dynamic = 'force-dynamic'

export default async function CasillaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/box/casilla')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      casillaNumber: true,
      legacyBoxCode: true,
    },
  })

  if (!user) redirect('/login?callbackUrl=/box/casilla')

  const casillaCode = user.casillaNumber || `IMC${user.id.slice(-6).toUpperCase()}`

  const addressLines = [
    user.name || 'Cliente IMC Box',
    `Suite ${casillaCode}`,
    '7500 NW 25th Street Unit 5',
    'Miami, FL 33122',
    'United States',
  ]
  const phone = '+1 (305) 470-9090'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1B2A6B] mb-2">Tu Casilla en Miami</h1>
        <p className="text-slate-600">
          Usa esta dirección al hacer tus compras online. Incluye <strong>siempre tu código de suite</strong> para que podamos identificar tus paquetes.
        </p>
      </div>

      {/* Address card */}
      <div className="bg-gradient-to-br from-[#1B2A6B] to-[#2D3F8E] rounded-2xl shadow-xl p-8 text-white mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">Tu casilla personal</p>
            <p className="text-4xl font-bold text-[#F47920]">{casillaCode}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg">
            <svg className="w-8 h-8 text-[#F47920]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 8h-3V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6h6v2H9V6zm0 8H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-xl p-5 mb-4">
          <div className="space-y-1.5 font-mono text-sm leading-relaxed">
            {addressLines.map((line, i) => (
              <p key={i} className={i === 0 ? 'font-semibold' : i === 1 ? 'text-[#F47920] font-semibold' : ''}>
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <CopyButton text={addressLines.join('\n')} label="Copiar dirección" />
          <CopyButton text={casillaCode} label={`Copiar ${casillaCode}`} />
        </div>
      </div>

      {/* Phone */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-6">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-50 p-3 rounded-lg">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Teléfono del warehouse</p>
            <p className="text-lg font-semibold text-slate-900 font-mono">{phone}</p>
            <p className="text-xs text-slate-500 mt-1">Úsalo solo si el sitio te lo pide al checkout (es obligatorio en Amazon)</p>
          </div>
          <CopyButton text={phone} label="Copiar" compact />
        </div>
      </div>

      {/* Instructions */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="text-2xl mb-2">1️⃣</div>
          <h3 className="font-semibold text-slate-900 mb-1">Compra en USA</h3>
          <p className="text-sm text-slate-600">Compra en Amazon, eBay, Best Buy, etc. y usa esta dirección al checkout</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="text-2xl mb-2">2️⃣</div>
          <h3 className="font-semibold text-slate-900 mb-1">Crea pre-alerta</h3>
          <p className="text-sm text-slate-600">Avísanos con el tracking y datos del paquete antes de que llegue</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="text-2xl mb-2">3️⃣</div>
          <h3 className="font-semibold text-slate-900 mb-1">Recibe en Chile</h3>
          <p className="text-sm text-slate-600">Consolidamos, embarcamos y entregamos a tu casa o retirado</p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">Recuerda siempre:</h3>
            <ul className="text-sm text-amber-800 space-y-1.5">
              <li>• <strong>Incluye Suite {casillaCode}</strong> en la dirección — si no, no podremos identificar tu paquete</li>
              <li>• El teléfono <strong>{phone}</strong> es solo del warehouse — para soporte WhatsApp +56 9 9001 4375</li>
              <li>• Conservamos paquetes <strong>60 días gratis</strong> en Miami antes de cobrar bodegaje</li>
              <li>• <strong>NO compres</strong> productos prohibidos: armas, baterías de litio sin permiso, líquidos inflamables</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
