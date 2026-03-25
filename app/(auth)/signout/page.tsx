"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutPage() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#1B2A6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#1B2A6B]">Cerrar Sesión</h2>
        <p className="text-gray-500 mt-2">¿Estás seguro de que deseas salir?</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full py-3 bg-[#1B2A6B] text-white font-semibold rounded-lg hover:bg-[#15224f] transition disabled:opacity-50"
        >
          {loading ? "Cerrando sesión..." : "Sí, cerrar sesión"}
        </button>
        <a
          href="/cotizar"
          className="block w-full py-3 text-center border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
        >
          Cancelar
        </a>
      </div>
    </>
  );
}
