"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        setError("Error al procesar la solicitud. Intenta nuevamente.");
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#1B2A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1B2A6B] mb-2">Correo enviado</h2>
        <p className="text-gray-600 mb-6">
          Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.
        </p>
        <Link href="/login" className="text-[#F47920] font-medium hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-[#1B2A6B] text-center mb-2">
        Recuperar Contraseña
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent outline-none transition"
            placeholder="tu@empresa.cl"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#1B2A6B] text-white font-semibold rounded-lg hover:bg-[#15224f] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link href="/login" className="text-[#F47920] font-medium hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </>
  );
}
