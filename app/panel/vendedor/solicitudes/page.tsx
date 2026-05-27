export const metadata = { title: 'Solicitudes · Panel Vendedor' }

export default function SolicitudesPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-navy-600 mb-2">
        Solicitudes de cotización
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        Aquí verás todas las RFQ que recibas de compradores empresariales.
      </p>
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
        <div className="text-4xl mb-3">📨</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Módulo en construcción
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Estamos terminando el sistema de RFQ. Pronto podrás recibir solicitudes,
          enviar cotizaciones con precio y plazo, y conversar con compradores.
        </p>
      </div>
    </div>
  )
}
