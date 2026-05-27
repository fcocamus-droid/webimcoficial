import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'

export const metadata = { title: 'Cómo funciona · IMC Industriales' }

export default function ComoFuncionaPage() {
  return (
    <>
      <Header />
      <section className="bg-navy-gradient text-white py-14">
        <div className="container-base text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Cómo funciona IMC Industriales</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Conectamos directamente a quien fabrica/importa con quien compra. Sin intermediarios.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-base grid lg:grid-cols-2 gap-8">
          {/* Fabricantes */}
          <div className="bg-white rounded-2xl border-2 border-navy-600 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-navy-600 text-white rounded-xl flex items-center justify-center text-3xl">🏭</div>
              <div>
                <p className="text-xs text-navy-600 font-bold uppercase tracking-wider">Para vendedores</p>
                <h2 className="text-2xl font-bold text-navy-600">Soy Fabricante o Importador</h2>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { n: 1, t: 'Crea tu perfil empresa', items: ['Razón social y RUT', 'Logo, descripción, contacto', 'Certificaciones (ISO, HACCP, BPM)', 'Ubicación bodega y zonas de despacho'] },
                { n: 2, t: 'Sube tu catálogo', items: ['Productos con fotos profesionales', 'Precio por volumen / MOQ', 'Tiempos de entrega', 'Stock disponible o a pedido'] },
                { n: 3, t: 'Recibe solicitudes (RFQ)', items: ['Compradores te envían cotización', 'Responde precio y condiciones', 'Conversa por chat directo', 'Cierra el trato'] },
                { n: 4, t: 'Gestiona y crece', items: ['Estadísticas de vistas y leads', 'Cartera de clientes recurrentes', 'Reseñas verificadas', 'Renueva tu plan según resultados'] },
              ].map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 bg-navy-600 text-white rounded-full flex items-center justify-center font-bold">{step.n}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1">{step.t}</h3>
                    <ul className="text-sm text-slate-600 space-y-0.5">
                      {step.items.map((i) => <li key={i}>· {i}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/registro?tipo=fabricante" className="mt-8 w-full inline-flex justify-center bg-navy-600 hover:bg-navy-700 text-white font-semibold py-3 rounded-xl">
              Crear cuenta de Fabricante →
            </Link>
          </div>

          {/* Compradores */}
          <div className="bg-white rounded-2xl border-2 border-amber-500 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-xl flex items-center justify-center text-3xl">🛒</div>
              <div>
                <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Para compradores</p>
                <h2 className="text-2xl font-bold text-amber-600">Soy Comprador empresarial</h2>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { n: 1, t: 'Regístrate gratis', items: ['RUT empresa o persona natural', 'Datos de contacto', 'Sin tarjeta ni compromiso'] },
                { n: 2, t: 'Busca proveedores', items: ['Filtra por categoría', 'Por certificaciones (ISO, HACCP)', 'Por región / ciudad', 'Por MOQ y lead time'] },
                { n: 3, t: 'Solicita cotizaciones', items: ['Envía RFQ a 1 o varios proveedores', 'Detalla cantidad, especificaciones, plazo', 'Recibe respuestas en horas'] },
                { n: 4, t: 'Compara y compra', items: ['Compara precio, plazo, condiciones', 'Negocia directo con el proveedor', 'Cierra el negocio sin intermediarios', 'Guarda favoritos y compra recurrente'] },
              ].map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">{step.n}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1">{step.t}</h3>
                    <ul className="text-sm text-slate-600 space-y-0.5">
                      {step.items.map((i) => <li key={i}>· {i}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/registro?tipo=comprador" className="mt-8 w-full inline-flex justify-center btn-primary py-3">
              Crear cuenta de Comprador →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
