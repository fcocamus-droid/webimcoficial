// scripts/check-enum.mjs — verifica enums actuales en Supabase
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const enums = await prisma.$queryRawUnsafe(`
    SELECT n.nspname AS schema, t.typname AS enum_name,
           e.enumlabel AS value, e.enumsortorder
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    ORDER BY t.typname, e.enumsortorder;
  `)
  console.log(JSON.stringify(enums, null, 2))

  // Also list user table columns
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'users' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `)
  console.log('\n=== users columns ===')
  console.log(JSON.stringify(cols, null, 2))
} catch (e) {
  console.error(e)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
