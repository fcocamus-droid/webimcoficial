const services = [
  {
    icon: "🏠",
    title: "Casilla en Miami",
    desc: "Obtén tu dirección personal en Miami para recibir todas tus compras online de EE.UU.",
  },
  {
    icon: "🛒",
    title: "Compra x Mí",
    desc: "Cuéntanos qué quieres comprar y nos encargamos de todo el proceso por ti.",
  },
  {
    icon: "✈️",
    title: "Servicio Aéreo Ágil",
    desc: "Envíos rápidos desde Miami a Chile con seguimiento en tiempo real.",
  },
  {
    icon: "🚢",
    title: "LCL · FCL · RoRo",
    desc: "Opciones marítimas para cargas de todos los tamaños y tipos.",
  },
  {
    icon: "📦",
    title: "Consolidación de Carga",
    desc: "Agrupamos tus compras en un solo envío para reducir costos.",
  },
  {
    icon: "🎯",
    title: "Logística a Medida",
    desc: "Soluciones personalizadas para empresas y personas naturales.",
  },
];

const partners = [
  { name: "Amazon", emoji: "📦" },
  { name: "Best Buy", emoji: "🛒" },
  { name: "eBay", emoji: "🏷️" },
  { name: "Home Depot", emoji: "🏠" },
  { name: "Walmart", emoji: "🛍️" },
  { name: "PartsMax", emoji: "⚙️" },
];

export default function IMCBox() {
  return (
    <section id="box" className="py-24 bg-imc-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-imc-orange font-semibold text-sm uppercase tracking-widest mb-4">
              <span className="w-8 h-0.5 bg-imc-orange" />
              Unidad de Negocio
            </div>
            <h2 className="section-title">
              IMC{" "}
              <span className="text-imc-orange">Box</span>
            </h2>
            <p className="text-imc-gray text-lg mt-4 max-w-xl">
              Proveemos servicios logísticos basados en tu casilla propia en Miami.
              Compra en cualquier tienda de EE.UU. y recíbelo en Chile.
            </p>
          </div>
          <a
            href="https://imcbox.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline shrink-0"
          >
            Ver sitio IMC Box
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Services grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((s) => (
            <div key={s.title} className="card group">
              <div className="w-12 h-12 bg-imc-orange/10 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-imc-orange group-hover:scale-110 transition-all duration-300">
                {s.icon}
              </div>
              <h3 className="font-bold text-imc-navy text-lg mb-2">{s.title}</h3>
              <p className="text-imc-gray text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Partners */}
        <div className="bg-white rounded-3xl p-8">
          <p className="text-center text-imc-gray font-semibold text-sm uppercase tracking-widest mb-6">
            Compramos en tus tiendas favoritas
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {partners.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-imc-navy font-semibold hover:border-imc-orange hover:bg-orange-50 transition-colors"
              >
                <span className="text-xl">{p.emoji}</span>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner */}
        <div className="mt-8 bg-gradient-to-r from-imc-orange to-orange-600 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div>
            <h3 className="text-2xl font-bold mb-2">¿Quieres tu casilla en Miami?</h3>
            <p className="text-white/80">Regístrate gratis y empieza a comprar desde EE.UU. hoy mismo.</p>
          </div>
          <a
            href="https://imcbox.cl/register.php?user_id=30"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-imc-orange font-bold px-8 py-4 rounded-xl hover:bg-orange-50 transition-colors shrink-0 inline-flex items-center gap-2"
          >
            Registrarse gratis
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
