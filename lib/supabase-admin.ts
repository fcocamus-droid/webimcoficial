// lib/supabase-admin.ts — cliente Supabase con service-role para uso server-side.
// SOLO usar en route handlers / server actions. Nunca exponer al cliente.
// Lazy: la creación del cliente se difiere hasta el primer uso para no
// reventar el build cuando las env vars no estén presentes (ej. lint en CI).

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
  if (!serviceRole)
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada')
  _client = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _client
}

// Proxy: cualquier acceso a una propiedad se resuelve al cliente real.
// Permite seguir usando `supabaseAdmin.storage.from(...)` como antes.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop]
  },
})
