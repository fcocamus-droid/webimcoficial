// scripts/seed-superadmin.mjs
// Crea (o promueve) la cuenta operaciones@imccargo.cl como SUPERADMIN.
// Si ya existe, solo actualiza el rol. Si no, la crea con una contraseña temporal segura.

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

const prisma = new PrismaClient()

const EMAIL = 'operaciones@imccargo.cl'
const NAME = 'Operaciones IMC'

function generateTempPassword() {
  // 16 caracteres legibles: A-Z, a-z, 2-9 (sin 0/O/1/l/I para evitar confusión).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(16)
  let out = ''
  for (let i = 0; i < 16; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

const existing = await prisma.user.findUnique({ where: { email: EMAIL } })

if (existing) {
  const updated = await prisma.user.update({
    where: { email: EMAIL },
    data: { role: 'SUPERADMIN', active: true },
  })
  console.log('\n=== Cuenta ya existía — rol promovido a SUPERADMIN ===')
  console.log(`Email   : ${updated.email}`)
  console.log(`Nombre  : ${updated.name ?? '-'}`)
  console.log(`Rol     : ${updated.role}`)
  console.log(`ID      : ${updated.id}`)
  console.log('\n→ Conserva la contraseña que ya tenías. Si la perdiste, podemos resetearla con otro script.\n')
} else {
  const tempPassword = generateTempPassword()
  const hashed = await bcrypt.hash(tempPassword, 10)
  const created = await prisma.user.create({
    data: {
      email: EMAIL,
      password: hashed,
      name: NAME,
      role: 'SUPERADMIN',
      active: true,
    },
  })
  console.log('\n========================================================')
  console.log(' CUENTA SUPERADMIN CREADA — guarda estas credenciales')
  console.log('========================================================')
  console.log(`Email      : ${created.email}`)
  console.log(`Contraseña : ${tempPassword}`)
  console.log(`Nombre     : ${created.name}`)
  console.log(`Rol        : ${created.role}`)
  console.log(`ID         : ${created.id}`)
  console.log('========================================================')
  console.log(' Ingresa en /login y luego cambia la contraseña.\n')
}

await prisma.$disconnect()
