// scripts/apply-migration.mjs — aplica una migración SQL a Supabase.
// Uso: node scripts/apply-migration.mjs migrations/XXX.sql
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const file = process.argv[2]
if (!file) {
  console.error('Uso: node scripts/apply-migration.mjs <archivo.sql>')
  process.exit(1)
}

const sql = readFileSync(file, 'utf8')
const prisma = new PrismaClient()

// Split por ; pero preservando posibles ; dentro de strings es overkill aquí;
// las sentencias del archivo son simples. Filtramos vacíos / comentarios.
const statements = sql
  .split(/;\s*\n/g)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('--'))

console.log(`> Aplicando ${statements.length} sentencias de ${file}...`)

for (const [i, stmt] of statements.entries()) {
  const preview = stmt.replace(/\s+/g, ' ').slice(0, 100)
  console.log(`  [${i + 1}/${statements.length}] ${preview}`)
  try {
    await prisma.$executeRawUnsafe(stmt)
  } catch (e) {
    console.error('  ✗ Error:', e.message)
    // Continuamos: muchos IF NOT EXISTS pueden fallar suavemente.
  }
}

await prisma.$disconnect()
console.log('✓ Migración terminada.')
