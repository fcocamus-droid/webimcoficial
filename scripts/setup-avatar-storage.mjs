// scripts/setup-avatar-storage.mjs
// 1. Aplica migración 003 (avatarUrl)
// 2. Crea bucket público "avatars" en Supabase Storage si no existe

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// === 1. Migración ===
const stmts = [`ALTER TABLE users ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`]
for (const s of stmts) {
  try {
    await prisma.$executeRawUnsafe(s)
    console.log('✓', s.slice(0, 100))
  } catch (e) {
    console.log('✗', s.slice(0, 100), '—', e.message)
  }
}

const cols = await prisma.$queryRawUnsafe(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name='users' AND column_name='avatarUrl'
`)
console.log('Columna avatarUrl presente:', cols.length === 1 ? 'sí' : 'NO')

await prisma.$disconnect()

// === 2. Bucket "avatars" ===
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRole) {
  console.error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env'
  )
  process.exit(1)
}

const headers = {
  apikey: serviceRole,
  Authorization: `Bearer ${serviceRole}`,
  'Content-Type': 'application/json',
}

// Listar buckets actuales
const listRes = await fetch(`${url}/storage/v1/bucket`, { headers })
const buckets = listRes.ok ? await listRes.json() : []
const exists = buckets.some?.((b) => b.name === 'avatars')

if (exists) {
  console.log('Bucket "avatars" ya existe.')
  // Actualizar para asegurar que es público
  const updateRes = await fetch(`${url}/storage/v1/bucket/avatars`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      public: true,
      file_size_limit: 2 * 1024 * 1024,
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    }),
  })
  console.log(
    'Update bucket:',
    updateRes.status,
    updateRes.ok ? 'ok' : await updateRes.text()
  )
} else {
  const createRes = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      id: 'avatars',
      name: 'avatars',
      public: true,
      file_size_limit: 2 * 1024 * 1024,
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    }),
  })
  if (createRes.ok) {
    console.log('Bucket "avatars" creado (público, max 2MB).')
  } else {
    console.log('Error creando bucket:', createRes.status, await createRes.text())
  }
}
