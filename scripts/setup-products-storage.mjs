// scripts/setup-products-storage.mjs
// Crea bucket público "products" en Supabase Storage para imágenes de productos.

import 'dotenv/config'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRole) {
  console.error('Faltan env vars de Supabase')
  process.exit(1)
}

const headers = {
  apikey: serviceRole,
  Authorization: `Bearer ${serviceRole}`,
  'Content-Type': 'application/json',
}

const config = {
  id: 'products',
  name: 'products',
  public: true,
  file_size_limit: 5 * 1024 * 1024, // 5MB
  allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}

const listRes = await fetch(`${url}/storage/v1/bucket`, { headers })
const buckets = listRes.ok ? await listRes.json() : []
const exists = buckets.some?.((b) => b.name === 'products')

if (exists) {
  const updateRes = await fetch(`${url}/storage/v1/bucket/products`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      public: true,
      file_size_limit: config.file_size_limit,
      allowed_mime_types: config.allowed_mime_types,
    }),
  })
  console.log(
    'Bucket "products" ya existía. Update:',
    updateRes.status,
    updateRes.ok ? 'ok' : await updateRes.text()
  )
} else {
  const createRes = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers,
    body: JSON.stringify(config),
  })
  if (createRes.ok) {
    console.log('✓ Bucket "products" creado (público, max 5MB).')
  } else {
    console.log('✗ Error creando bucket:', createRes.status, await createRes.text())
  }
}
