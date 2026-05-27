import Link from 'next/link'
import IMCLogo from '../components/IMCLogo'

export const metadata = {
  title: 'Productos · IMC Cargo',
  description: 'Catálogo de productos y servicios IMC Cargo',
}

const categorias = [
  {
    nombre: 'Tecnología y electrónica',
    icon: '💻',
    desc: 'Computadores, telefonía, equipos de sonido y accesorios.',
    items: ['Notebooks', 'Smartphones', 'Tablets', 'Auriculares', 'Cámaras'],
  },
  {
    nombre: 'Hogar y muebles',
    icon: '🛋️',
    desc: 'Muebles, decoración, electrodomésticos y artículos del hogar.',
    items: ['Mobiliario', 'Iluminación', 'Decoración', 'Cocina', 'Línea blanca'],
  },
  {
    nombre: 'Deporte y outdoor',
    icon: '🚴',
    desc: 'Equipamiento deportivo, bicicletas, camping y actividades al aire libre.',
    items: ['Bicicletas', 'Pesas', 'Camping', 'Ciclismo', 'Running'],
  },
  {
    nombre: 'Industrial y repuestos',
    icon: '⚙️',
    desc: 'Repuestos industriales, autopartes, maquinaria y herramientas.',
    items: ['Autopartes', 'Maquinaria', 'Herramientas', 'Repuestos', 'Insumos'],
  },
  {
    nombre: 'Belleza y bienestar',
    icon: '💆',
    desc: 'Cosmética, cuidado personal, suplementos y bienestar.',
    items: ['Cosmética', 'Perfumería', 'Suplementos', 'Cuidado personal'],
  },
  {
    nombre: 'Moda y accesorios',
    icon: '👕',
    desc: 'Vestuario, calzado, accesorios de moda y joyería.',
    items: ['Vestuario', 'Calzado', 'Accesorios', 'Joyería', 'Carteras'],
  },
]

export default function ProductosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header (same as landing) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <IMCLogo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/#servicios" className="hover:text-[#F47920] transition-colors">Servicios</Link>
            <Link href="/#cotizar" className="hover:text-[#F47920] transition-colors">Cotizar</Link>
            <Link href="/productos" className="text-[#F47920] font-semibold">Productos</Link>
            <Link href="/#nosotros" className="hover:text-[#F47920] transition-colors">Nosotros</Link>
            <Link href="/#contacto" className="hover:text-[#F47920] transition-colors">Contacto</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[#1B2A6B] hover:text-[#F47920] px-4 py-2">
              Iniciar sesión
            </Link>
            <Link href="/panel" className="inline-flex items-center gap-2 text-sm font-semibold bg-[#F47920] hover:bg-[#e06810] text-white px-4 py-2 rounded-lg">
              Ir al panel →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2A6B] via-[#1F3174] to-[#0F1740] text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block bg-[#F47920]/20 border border-[#F47920]/30 text-[#F47920] text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
            Productos
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Importa lo que <span className="text-[#F47920]">necesites</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Movemos cualquier tipo de producto desde el extranjero hasta tu puerta en Chile.
            Te ayudamos a encontrar proveedores confiables y gestionar toda la logística.
          </p>
        </div>
      </section>

      {/* Categorias */}
      <section className="py-16 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-[#F47920] text-xs font-semibold uppercase tracking-wider">Categorías</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">¿Qué quieres importar?</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categorias.map((cat) => (
              <div
                key={cat.nombre}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#F47920]/40 hover:shadow-md transition-all"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{cat.nombre}</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{cat.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item) => (
                    <span key={item} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-[#F47920] text-xs font-semibold uppercase tracking-wider">Proceso</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Cómo importar con nosotros</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <Step n={1} title="Cuéntanos qué necesitas" desc="Producto, cantidad, especificaciones o link del proveedor." />
            <Step n={2} title="Cotizamos en 24-48h" desc="Producto + flete + aduana + entrega — todo incluido." />
            <Step n={3} title="Confirmas y pagas" desc="Activas la operación con un anticipo. El resto al recibir." />
            <Step n={4} title="Recibes en tu puerta" desc="Tracking online en cada etapa. Sin complicaciones." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#F47920] to-[#e06810] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">¿No encuentras lo que buscas?</h2>
          <p className="text-white/90 text-lg mb-6">Cuéntanos qué necesitas importar y te enviamos una cotización personalizada.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/56990014375" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-[#F47920] px-6 py-3 rounded-xl font-bold hover:bg-orange-50">
              💬 Cotizar por WhatsApp
            </a>
            <Link href="/#cotizar" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-xl font-semibold">
              Cotizador online →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F1740] text-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <IMCLogo size="md" variant="mono-white" className="mx-auto mb-3" />
          <p className="text-xs text-blue-300">
            © {new Date().getFullYear()} IMC Cargo · Freight Forwarder · Santiago, Chile
          </p>
        </div>
      </footer>
    </div>
  )
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="relative">
      <div className="w-10 h-10 bg-[#F47920]/10 text-[#F47920] rounded-full flex items-center justify-center font-bold mb-3">
        {n}
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  )
}
