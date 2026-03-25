"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    company: z.string().min(2, "La empresa debe tener al menos 2 caracteres"),
    rut: z
      .string()
      .regex(
        /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/,
        "Formato de RUT inválido (ej: 12.345.678-9)"
      ),
    email: z.string().email("Correo electrónico inválido"),
    phone: z
      .string()
      .regex(/^\+56\d{9}$/, "Formato de teléfono inválido (ej: +569XXXXXXXX)"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FieldErrors = Partial<Record<string, string>>;

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    rut: "",
    email: "",
    phone: "+56",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          rut: form.rut,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || "Error al registrar. Intenta nuevamente.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1B2A6B] mb-2">¡Registro exitoso!</h2>
        <p className="text-gray-600 mb-6">
          Revisa tu correo para verificar tu cuenta.
        </p>
        <Link
          href="/login"
          className="text-[#F47920] font-medium hover:underline"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  const fields: { key: string; label: string; type: string; placeholder: string }[] = [
    { key: "name", label: "Nombre completo", type: "text", placeholder: "Juan Pérez" },
    { key: "company", label: "Empresa", type: "text", placeholder: "Mi Empresa SpA" },
    { key: "rut", label: "RUT", type: "text", placeholder: "12.345.678-9" },
    { key: "email", label: "Correo electrónico", type: "email", placeholder: "tu@empresa.cl" },
    { key: "phone", label: "Teléfono", type: "tel", placeholder: "+569XXXXXXXX" },
    { key: "password", label: "Contraseña", type: "password", placeholder: "Mínimo 8 caracteres" },
    { key: "confirmPassword", label: "Confirmar contraseña", type: "password", placeholder: "Repite tu contraseña" },
  ];

  return (
    <>
      <h2 className="text-2xl font-bold text-[#1B2A6B] text-center mb-6">
        Crear Cuenta
      </h2>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              id={key}
              type={type}
              required
              value={form[key as keyof typeof form]}
              onChange={(e) => updateField(key, e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1B2A6B] focus:border-transparent outline-none transition ${
                errors[key] ? "border-red-400" : "border-gray-300"
              }`}
              placeholder={placeholder}
            />
            {errors[key] && (
              <p className="mt-1 text-xs text-red-600">{errors[key]}</p>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#1B2A6B] text-white font-semibold rounded-lg hover:bg-[#15224f] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#F47920] font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
