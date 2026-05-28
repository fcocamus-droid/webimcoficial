// scripts/setup-storage-buckets.mjs
// Crea / actualiza buckets adicionales: company-assets (logos+banners) y certifications.
import 'dotenv/config'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const headers = {
  apikey: serviceRole,
  Authorization: `Bearer ${serviceRole}`,
  'Content-Type': 'application/json',
}

const buckets = [
  {
    id: 'company-assets',
    public: true,
    file_size_limit: 3 * 1024 * 1024, // 3MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  {
    id: 'certifications',
    public: true,
    file_size_limit: 10 * 1024 * 1024, // 10MB
    allowed_mime_types: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
  },
]

const listRes = await fetch(`${url}/storage/v1/bucket`, { headers })
const existing = listRes.ok ? await listRes.json() : []

for (const cfg of buckets) {
  const found = existing.some?.((b) => b.name === cfg.id)
  if (found) {
    const r = await fetch(`${url}/storage/v1/bucket/${cfg.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        public: cfg.public,
        file_size_limit: cfg.file_size_limit,
        allowed_mime_types: cfg.allowed_mime_types,
      }),
    })
    console.log(`✓ updated bucket "${cfg.id}" — ${r.status}`)
  } else {
    const r = await fetch(`${url}/storage/v1/bucket`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...cfg, name: cfg.id }),
    })
    if (r.ok) {
      console.log(`✓ CREATED bucket "${cfg.id}" (public, ${cfg.file_size_limit / 1024 / 1024}MB)`)
    } else {
      console.log(`✗ error "${cfg.id}":`, r.status, await r.text())
    }
  }
}
