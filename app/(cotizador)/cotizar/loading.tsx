export default function Loading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1B2A6B] to-[#2a3d9a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-white border-t-[#F47920] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Cargando cotizador...</p>
      </div>
    </main>
  )
}
