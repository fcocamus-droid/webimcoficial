const categories = [
  { icon: "💻", name: "Tecnología" },
  { icon: "🏠", name: "Hogar" },
  { icon: "👔", name: "Moda" },
  { icon: "🏋️", name: "Deporte" },
  { icon: "🍳", name: "Cocina" },
  { icon: "🧸", name: "Juguetes" },
  { icon: "🚗", name: "Automotriz" },
  { icon: "💊", name: "Salud" },
];

const benefits = [
  {
    icon: "🚚",
    title: "Despacho gratis",
    desc: "Envío gratuito a todo Chile vía ShipIt en todos tus pedidos.",
  },
  {
    icon: "🌍",
    title: "Productos del mundo",
    desc: "Traemos lo mejor de EE.UU., Asia y Europa directo a tu puerta.",
  },
  {
    icon: "💰",
    title: "Precios competitivos",
    desc: "Ahorra comprando importado sin salir de Chile.",
  },
  {
    icon: "✅",
    title: "Calidad garantizada",
    desc: "Todos los productos pasan por control de calidad antes del envío.",
  },
];

export default function Importadora() {
  return (
    <section id="importadora" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-imc-orange font-semibold text-sm uppercase tracking-widest mb-4">
              <span className="w-8 h-0.5 bg-imc-orange" />
              Unidad de Negocio
            </div>
            <h2 className="section-title">
              Importadora{" "}
              <span className="text-imc-orange">IMC</span>
            </h2>
            <p className="text-imc-gray text-lg mt-4 max-w-xl">
              Facilitando el comercio global desde Chile. Encuentra productos
              importados de calidad con despacho gratis a todo el país.
            </p>
          </div>
          <a
            href="https://importadoraimc.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline shrink-0"
          >
            Ir a la tienda
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((b) => (
            <div key={b.title} className="text-center p-6">
              <div className="text-4xl mb-3">{b.icon}</div>
              <h3 className="font-bold text-imc-navy text-base mb-2">{b.title}</h3>
              <p className="text-imc-gray text-sm">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Categories */}
        <div className="bg-imc-light rounded-3xl p-8">
          <h3 className="text-xl font-bold text-imc-navy text-center mb-8">
            Categorías disponibles
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {categories.map((c) => (
              <a
                key={c.name}
                href={`https://importadoraimc.cl/collections/all`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                <span className="text-3xl">{c.icon}</span>
                <span className="text-xs font-medium text-imc-navy text-center">{c.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Newsletter / CTA */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-teal-700 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div>
            <h3 className="text-2xl font-bold mb-2">¿Buscas un producto específico?</h3>
            <p className="text-white/80">Si no lo encuentras en la tienda, podemos importarlo especialmente para ti.</p>
          </div>
          <a
            href="https://wa.me/56990014375?text=Hola, quiero importar un producto específico"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-green-700 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors shrink-0 inline-flex items-center gap-2"
          >
            Solicitar producto
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
