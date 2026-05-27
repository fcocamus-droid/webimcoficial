export const metadata = { title: 'Favoritos · Panel Comprador' }

export default function FavoritosPage() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-navy-600 mb-2">
        Productos favoritos
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        Guarda productos para comparar y volver a comprar.
      </p>
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
        <div className="text-4xl mb-3">⭐</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Próximamente
        </h3>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Pronto podrás marcar productos como favoritos para comparar precios y
          tenerlos a mano cuando los necesites.
        </p>
      </div>
    </div>
  )
}
