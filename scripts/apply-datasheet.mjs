import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
try {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS "datasheetUrl" TEXT'
  )
  console.log('✓ Columna datasheetUrl agregada (o ya existía)')
} catch (e) {
  console.error('✗', e.message)
  process.exit(1)
}

// Verificar tipos de archivo permitidos en bucket products
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const updateRes = await fetch(`${url}/storage/v1/bucket/products`, {
  method: 'PUT',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    public: true,
    file_size_limit: 10 * 1024 * 1024, // subo a 10MB para acomodar PDFs
    allowed_mime_types: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ],
  }),
})
console.log('✓ Bucket "products" ahora acepta PDF (max 10MB)')
await prisma.$disconnect()
