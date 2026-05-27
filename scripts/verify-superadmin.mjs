// scripts/verify-superadmin.mjs
// Asegura que operaciones@imccargo.cl exista como SUPERADMIN activo.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const EMAIL = 'operaciones@imccargo.cl'

const user = await prisma.user.findUnique({
  where: { email: EMAIL },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    active: true,
    createdAt: true,
  },
})

if (!user) {
  console.log(`✗ ${EMAIL} NO existe en BD`)
  process.exit(1)
}

console.log(`Email   : ${user.email}`)
console.log(`Nombre  : ${user.name ?? '(sin nombre)'}`)
console.log(`Rol     : ${user.role}`)
console.log(`Activo  : ${user.active ? 'sí' : 'NO'}`)
console.log(`Creado  : ${user.createdAt.toISOString()}`)

if (user.role !== 'SUPERADMIN' || !user.active) {
  console.log('\n→ Actualizando a SUPERADMIN activo...')
  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'SUPERADMIN', active: true },
  })
  console.log('✓ Promovido a SUPERADMIN activo.')
} else {
  console.log('\n✓ Ya es SUPERADMIN activo. Nada que hacer.')
}

await prisma.$disconnect()
