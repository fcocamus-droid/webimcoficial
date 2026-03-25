const services = [
  {
    icon: "✈️",
    title: "Carga Aérea",
    desc: "Transporte aéreo ágil y seguro para tus mercancías a cualquier destino del mundo.",
  },
  {
    icon: "🚢",
    title: "Carga Marítima",
    desc: "Soluciones LCL, FCL y RoRo para envíos de cualquier volumen por vía marítima.",
  },
  {
    icon: "🌍",
    title: "Retiro Mundial",
    desc: "Retiramos tu carga desde cualquier proveedor o bodega en el mundo.",
  },
  {
    icon: "📋",
    title: "Logística a Medida",
    desc: "Diseñamos soluciones logísticas personalizadas según tus necesidades.",
  },
  {
    icon: "🛃",
    title: "Gestión Aduanera",
    desc: "Tramitación de documentos y desaduanamiento de mercancías en Chile.",
  },
  {
    icon: "🔒",
    title: "Seguro de Carga",
    desc: "Protección total de tu mercancía durante todo el trayecto.",
  },
];

export default function IMCCargo() {
  return (
    <section id="cargo" className="py-24 bg-white">
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
              <span className="text-imc-orange">Cargo</span>
            </h2>
            <p className="text-imc-gray text-lg mt-4 max-w-xl">
              International Management Cargo. Tu socio estratégico en logística
              internacional — movemos tu carga por aire, mar y tierra con total confianza.
            </p>
          </div>
          <a
            href="https://imccargo.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline shrink-0"
          >
            Ver sitio IMC Cargo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Services grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div key={s.title} className="card group">
              <div className="w-12 h-12 bg-imc-navy/10 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-imc-navy group-hover:scale-110 transition-all duration-300">
                {s.icon}
              </div>
              <h3 className="font-bold text-imc-navy text-lg mb-2">{s.title}</h3>
              <p className="text-imc-gray text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Banner */}
        <div className="mt-12 bg-gradient-to-r from-imc-navy to-blue-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div>
            <h3 className="text-2xl font-bold mb-2">¿Necesitas cotizar tu carga?</h3>
            <p className="text-white/70">Cuéntanos los detalles y te respondemos en menos de 24 horas.</p>
          </div>
          <a
            href="https://wa.me/56990014375?text=Hola, quiero cotizar un servicio de IMC Cargo"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary shrink-0"
          >
            Cotizar ahora
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
