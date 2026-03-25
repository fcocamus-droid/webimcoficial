"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no proporcionado.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Tu correo ha sido verificado exitosamente.");
        } else {
          setStatus("error");
          setMessage(data.error || "Token inválido o expirado.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Error de conexión. Intenta nuevamente.");
      });
  }, [token]);

  return (
    <div className="text-center py-4">
      {status === "loading" && (
        <>
          <div className="w-16 h-16 border-4 border-[#1B2A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1B2A6B]">Verificando correo...</h2>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1B2A6B] mb-2">¡Correo verificado!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-[#1B2A6B] text-white font-semibold rounded-lg hover:bg-[#15224f] transition"
          >
            Iniciar sesión
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1B2A6B] mb-2">Error de verificación</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Link
            href="/login"
            className="text-[#F47920] font-medium hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-4">
          <div className="w-16 h-16 border-4 border-[#1B2A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1B2A6B]">Cargando...</h2>
        </div>
      }
    >
      <VerificarEmailContent />
    </Suspense>
  );
}
