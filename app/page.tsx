import Link from 'next/link'
import IMCLogo from './components/IMCLogo'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <IMCLogo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <a href="#servicios" className="hover:text-[#F47920] transition-colors">Servicios</a>
            <a href="#cotizar" className="hover:text-[#F47920] transition-colors">Cotizar</a>
            <Link href="/productos" className="hover:text-[#F47920] transition-colors">Productos</Link>
            <a href="#nosotros" className="hover:text-[#F47920] transition-colors">Nosotros</a>
            <a href="#contacto" className="hover:text-[#F47920] transition-colors">Contacto</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[#1B2A6B] hover:text-[#F47920] px-4 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/panel"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2 rounded-lg"
            >
              Ir al panel →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 bg-gradient-to-br from-[#1B2A6B] via-[#1F3174] to-[#0F1740] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-[#F47920]/20 border border-[#F47920]/30 text-[#F47920] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-5">
              Freight Forwarder · Chile
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
              Logística internacional<br />
              <span className="text-[#F47920]">simple y transparente</span>
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed max-w-xl mb-8">
              Mueve tu carga desde y hacia cualquier parte del mundo.
              FCL, LCL, aéreo y couriers — con tarifas online, tracking punta a punta y agencia de aduana incluida.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/panel/cotizar" className="inline-flex items-center gap-2 bg-[#F47920] hover:bg-[#e06810] text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-[#F47920]/30">
                Cotizar mi envío →
              </Link>
              <a href="#servicios" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold backdrop-blur">
                Ver servicios
              </a>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#F47920]/20 blur-3xl rounded-full" />
              <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-3xl font-bold text-[#F47920]">662</p>
                    <p className="text-xs text-blue-200 mt-1">Clientes activos</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-3xl font-bold text-[#F47920]">5K+</p>
                    <p className="text-xs text-blue-200 mt-1">Envíos gestionados</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-3xl font-bold text-[#F47920]">895</p>
                    <p className="text-xs text-blue-200 mt-1">Rutas activas</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-3xl font-bold text-[#F47920]">24/7</p>
                    <p className="text-xs text-blue-200 mt-1">Tracking online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#F47920] text-xs font-semibold uppercase tracking-wider">Nuestros servicios</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Soluciones para todo tipo de carga</h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">Tarifas online en tiempo real para los principales puertos del mundo. Tú eliges la modalidad, nosotros nos encargamos del resto.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <ServiceCard
              title="Carga Directa"
              desc="Consolidado completo desde origen único a tu puerta."
              icon="📦"
            />
            <ServiceCard
              title="Couriers"
              desc="Envíos aéreos urgentes con tarifas competitivas."
              icon="✈️"
            />
            <ServiceCard
              title="Marítimo FCL"
              desc="Contenedor completo 20', 40' y 40'HC. Tu carga, tu contenedor."
              icon="🚢"
            />
            <ServiceCard
              title="Marítimo LCL"
              desc="Carga suelta (groupage). Pagas solo el espacio que ocupas."
              icon="📋"
            />
          </div>
        </div>
      </section>

      {/* Por qué IMC */}
      <section id="nosotros" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[#F47920] text-xs font-semibold uppercase tracking-wider">Por qué elegirnos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Tu freight forwarder de confianza</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Feature title="Tarifas online" desc="Cotiza en segundos sin esperar a un ejecutivo. Tu cotización siempre disponible en tu panel." />
            <Feature title="Tracking punta a punta" desc="Sigue tu carga desde el origen hasta la entrega final, con notificaciones en cada etapa." />
            <Feature title="Agencia de aduana" desc="Manejamos toda la documentación: DAI, IVA, agencia, transporte interno. Sin sorpresas." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cotizar" className="py-16 bg-gradient-to-br from-[#F47920] to-[#e06810] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">¿Listo para mover tu carga?</h2>
          <p className="text-white/90 text-lg mb-6">Crea tu cuenta gratis y obtén tu primera cotización en menos de 2 minutos.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/registro" className="inline-flex items-center gap-2 bg-white text-[#F47920] px-6 py-3 rounded-xl font-bold hover:bg-orange-50">
              Crear cuenta gratis
            </Link>
            <Link href="/panel/cotizar" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-xl font-semibold">
              Cotizar como invitado →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-[#0F1740] text-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <IMCLogo size="lg" variant="mono-white" />
              <p className="text-sm mt-4 text-blue-200">
                Freight forwarder especializado en logística internacional desde y hacia Chile.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Servicios</h3>
              <ul className="space-y-1.5 text-sm">
                <li><a href="#servicios" className="hover:text-[#F47920]">Carga Directa</a></li>
                <li><a href="#servicios" className="hover:text-[#F47920]">Couriers</a></li>
                <li><a href="#servicios" className="hover:text-[#F47920]">Marítimo FCL</a></li>
                <li><a href="#servicios" className="hover:text-[#F47920]">Marítimo LCL</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Cuenta</h3>
              <ul className="space-y-1.5 text-sm">
                <li><Link href="/login" className="hover:text-[#F47920]">Iniciar sesión</Link></li>
                <li><Link href="/registro" className="hover:text-[#F47920]">Crear cuenta</Link></li>
                <li><Link href="/panel" className="hover:text-[#F47920]">Mi panel</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Contacto</h3>
              <ul className="space-y-1.5 text-sm">
                <li>ventas@imccargo.cl</li>
                <li>+56 9 9001 4375</li>
                <li>Santiago, Chile</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-blue-300">
            © {new Date().getFullYear()} IMC Cargo · Freight Forwarder
          </div>
        </div>
      </footer>

      {/* WhatsApp floating */}
      <a
        href="https://wa.me/56990014375"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
        aria-label="WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  )
}

function ServiceCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#F47920]/40 hover:shadow-md transition-all">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <div className="w-10 h-10 bg-[#F47920]/10 text-[#F47920] rounded-lg flex items-center justify-center mb-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  )
}
