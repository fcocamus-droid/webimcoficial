// lib/supabase-admin.ts — cliente Supabase con service-role para uso server-side.
// SOLO usar en route handlers / server actions. Nunca exponer al cliente.

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada')
if (!serviceRole)
  throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada')

export const supabaseAdmin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
})
