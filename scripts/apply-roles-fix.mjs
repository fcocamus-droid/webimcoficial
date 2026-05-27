// Aplica las sentencias faltantes de la migración 002 una por una.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const stmts = [
  `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN'`,
  `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SALES_AGENT'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdById" TEXT`,
  `ALTER TABLE users ADD CONSTRAINT users_createdById_fkey FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true`,
  `CREATE INDEX IF NOT EXISTS idx_users_created_by ON users("createdById")`,
  `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
]

for (const s of stmts) {
  try {
    await prisma.$executeRawUnsafe(s)
    console.log('✓', s.slice(0, 90))
  } catch (e) {
    console.log('✗', s.slice(0, 90), '—', e.message.split('\n')[0])
  }
}

// Verificar
const rows = await prisma.$queryRawUnsafe(`
  SELECT e.enumlabel AS value
  FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
  WHERE t.typname = 'UserRole' ORDER BY e.enumsortorder
`)
console.log('\nUserRole ahora:', rows.map(r => r.value).join(', '))

const cols = await prisma.$queryRawUnsafe(`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'users' AND column_name IN ('createdById','active')
`)
console.log('Cols nuevas:', cols.map(c => c.column_name).join(', '))

await prisma.$disconnect()
