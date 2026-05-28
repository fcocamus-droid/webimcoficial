import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const cats = await prisma.category.findMany({
  where: { active: true },
  orderBy: { sortOrder: 'asc' },
  select: { sortOrder: true, slug: true, name: true, icon: true },
})
cats.forEach((c) => {
  console.log(`${c.sortOrder.toString().padStart(2)} · ${c.icon} ${c.name}`)
})
console.log(`\nTotal: ${cats.length} categorías activas`)
await prisma.$disconnect()
