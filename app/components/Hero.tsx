import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center bg-gradient-to-br from-imc-navy via-blue-900 to-imc-navy overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-imc-orange rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-imc-orange rounded-full filter blur-3xl opacity-5" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-white/20">
              <span className="w-2 h-2 bg-imc-orange rounded-full animate-pulse" />
              Soluciones logísticas integrales
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Conectamos{" "}
              <span className="text-imc-orange">Chile</span>{" "}
              con el mundo
            </h1>

            <p className="text-xl text-white/80 leading-relaxed mb-10 max-w-lg">
              Somos el Grupo IMC: una plataforma unificada de logística internacional,
              casilla en Miami y productos importados. Todo en un solo lugar.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#cargo" className="btn-primary text-base px-8 py-4">
                Conoce nuestros servicios
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
              <a
                href="https://wa.me/56990014375"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-lg hover:bg-white/10 transition-all duration-200 inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Contáctanos
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-14 pt-10 border-t border-white/20">
              {[
                { value: "3", label: "Unidades de negocio" },
                { value: "+10", label: "Años de experiencia" },
                { value: "🌎", label: "Presencia global" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-black text-imc-orange">{stat.value}</div>
                  <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: cards */}
          <div className="hidden lg:grid grid-cols-1 gap-4">
            {[
              {
                icon: "✈️",
                title: "IMC Cargo",
                desc: "Carga aérea y marítima internacional. LCL · FCL · RoRo",
                color: "from-blue-600 to-imc-navy",
                href: "#cargo",
              },
              {
                icon: "📦",
                title: "IMC Box",
                desc: "Casilla en Miami · Compra por mí · Logística a medida",
                color: "from-imc-orange to-orange-600",
                href: "#box",
              },
              {
                icon: "🛍️",
                title: "Importadora IMC",
                desc: "Productos importados con despacho gratis a todo Chile",
                color: "from-green-600 to-teal-700",
                href: "#importadora",
              },
            ].map((card) => (
              <a
                key={card.title}
                href={card.href}
                className={`bg-gradient-to-r ${card.color} rounded-2xl p-6 flex items-center gap-5 text-white hover:scale-105 transition-transform duration-200 cursor-pointer`}
              >
                <span className="text-4xl">{card.icon}</span>
                <div>
                  <div className="font-bold text-lg">{card.title}</div>
                  <div className="text-sm text-white/80">{card.desc}</div>
                </div>
                <svg className="w-5 h-5 ml-auto opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
