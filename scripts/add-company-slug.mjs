// scripts/add-company-slug.mjs
// 1. Agrega columna slug a companies
// 2. Backfill desde razonSocial (slugify + unicidad)

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const stmts = [
  `ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug TEXT`,
]
for (const s of stmts) {
  try {
    await prisma.$executeRawUnsafe(s)
    console.log('✓', s)
  } catch (e) {
    console.log('✗', s, '—', e.message)
  }
}

// Backfill
function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

const companies = await prisma.company.findMany({
  select: { id: true, razonSocial: true, rut: true, slug: true },
})

const seen = new Set()
for (const c of companies) {
  if (c.slug) {
    seen.add(c.slug)
    continue
  }
  let base = slugify(c.razonSocial) || `empresa-${c.id.slice(0, 6)}`
  let candidate = base
  let n = 2
  while (seen.has(candidate)) {
    candidate = `${base}-${n}`
    n++
  }
  seen.add(candidate)
  await prisma.company.update({
    where: { id: c.id },
    data: { slug: candidate },
  })
  console.log(`✓ ${c.razonSocial} → ${candidate}`)
}

// Asegurar índice único después del backfill
try {
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_unique ON companies(slug)`
  )
  console.log('✓ Índice único creado')
} catch (e) {
  console.log('✗ Índice único —', e.message)
}

// Y ahora hacerlo NOT NULL
try {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE companies ALTER COLUMN slug SET NOT NULL`
  )
  console.log('✓ NOT NULL aplicado')
} catch (e) {
  console.log('✗ NOT NULL —', e.message)
}

await prisma.$disconnect()
console.log('\nDone.')
