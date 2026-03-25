const values = [
  {
    icon: "🤝",
    title: "Confianza",
    desc: "Construimos relaciones duraderas basadas en la transparencia y el cumplimiento.",
  },
  {
    icon: "⚡",
    title: "Agilidad",
    desc: "Respondemos rápido y nos adaptamos a las necesidades cambiantes del mercado.",
  },
  {
    icon: "🌐",
    title: "Visión Global",
    desc: "Conectamos Chile con el mundo, eliminando barreras geográficas para el comercio.",
  },
  {
    icon: "🎯",
    title: "Precisión",
    desc: "Cada operación logística se gestiona con atención al detalle y rigor profesional.",
  },
];

export default function Nosotros() {
  return (
    <section id="nosotros" className="py-24 bg-imc-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 text-imc-orange font-semibold text-sm uppercase tracking-widest mb-4">
              <span className="w-8 h-0.5 bg-imc-orange" />
              Quiénes somos
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              El Grupo IMC: tu partner logístico integral
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-6">
              Somos una empresa chilena especializada en comercio internacional y logística.
              A través de nuestras tres unidades de negocio — IMC Cargo, IMC Box e Importadora IMC —
              ofrecemos soluciones end-to-end para personas y empresas.
            </p>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Nuestra misión es facilitar el comercio global desde Chile, reduciendo complejidades
              y acercando productos y servicios de calidad mundial a nuestros clientes.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="bg-white/10 text-white/80 text-sm px-4 py-2 rounded-full border border-white/20">
                🇨🇱 Empresa chilena
              </span>
              <span className="bg-white/10 text-white/80 text-sm px-4 py-2 rounded-full border border-white/20">
                ✈️ Logística aérea y marítima
              </span>
              <span className="bg-white/10 text-white/80 text-sm px-4 py-2 rounded-full border border-white/20">
                📦 Casilla en Miami
              </span>
              <span className="bg-white/10 text-white/80 text-sm px-4 py-2 rounded-full border border-white/20">
                🛍️ E-commerce importado
              </span>
            </div>
          </div>

          {/* Right: values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-bold text-white text-base mb-2">{v.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
