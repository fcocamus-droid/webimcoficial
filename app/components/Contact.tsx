"use client";
import { useState } from "react";

const contactMethods = [
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    label: "WhatsApp",
    value: "+56 9 9001 4375",
    href: "https://wa.me/56990014375",
    color: "bg-green-500",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    label: "Instagram",
    value: "@imcbox.cl",
    href: "https://instagram.com/imcbox.cl",
    color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    label: "LinkedIn",
    value: "Grupo IMC",
    href: "https://linkedin.com",
    color: "bg-blue-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    label: "Facebook",
    value: "IMCbox.cl",
    href: "https://facebook.com",
    color: "bg-blue-700",
  },
];

export default function Contact() {
  const [service, setService] = useState("cargo");

  const waMessages: Record<string, string> = {
    cargo: "Hola, necesito cotizar un servicio de carga internacional con IMC Cargo",
    box: "Hola, me interesa la casilla en Miami de IMC Box",
    importadora: "Hola, quiero información sobre productos de la Importadora IMC",
    otro: "Hola, necesito información sobre los servicios del Grupo IMC",
  };

  return (
    <section id="contacto" className="py-24 bg-imc-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-imc-orange font-semibold text-sm uppercase tracking-widest mb-4">
            <span className="w-8 h-0.5 bg-imc-orange" />
            Contacto
            <span className="w-8 h-0.5 bg-imc-orange" />
          </div>
          <h2 className="section-title mb-4">¿En qué podemos ayudarte?</h2>
          <p className="text-imc-gray text-lg max-w-xl mx-auto">
            Selecciona el servicio que te interesa y te contactamos de inmediato.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: contact form/selector */}
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h3 className="font-bold text-imc-navy text-xl mb-6">Selecciona el servicio</h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { key: "cargo", label: "IMC Cargo", icon: "✈️" },
                { key: "box", label: "IMC Box", icon: "📦" },
                { key: "importadora", label: "Importadora", icon: "🛍️" },
                { key: "otro", label: "Otro", icon: "💬" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setService(opt.key)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left font-semibold ${
                    service === opt.key
                      ? "border-imc-orange bg-orange-50 text-imc-orange"
                      : "border-gray-200 text-imc-navy hover:border-imc-navy"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>

            <a
              href={`https://wa.me/56990014375?text=${encodeURIComponent(waMessages[service])}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-primary justify-center text-base py-4"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contactar por WhatsApp
            </a>

            <p className="text-center text-imc-gray text-xs mt-4">
              Respondemos en menos de 24 horas hábiles
            </p>
          </div>

          {/* Right: social + info */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <h3 className="font-bold text-imc-navy text-xl mb-6">Síguenos en redes</h3>
              <div className="flex flex-col gap-4">
                {contactMethods.map((m) => (
                  <a
                    key={m.label}
                    href={m.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-12 h-12 ${m.color} text-white rounded-xl flex items-center justify-center shrink-0`}>
                      {m.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-imc-navy text-sm">{m.label}</div>
                      <div className="text-imc-gray text-sm">{m.value}</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:text-imc-orange transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-imc-navy rounded-3xl p-8 text-white">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-bold text-lg mb-2">Chile</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Operamos en todo Chile con despacho nacional e internacional.
                Nuestros servicios están disponibles para personas y empresas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
