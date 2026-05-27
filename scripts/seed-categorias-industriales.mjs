// scripts/seed-categorias-industriales.mjs
// Agrega 13 categorías industriales nuevas y reordena el sortOrder
// para que las pesadas industriales aparezcan primero.

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Orden final del catálogo (sortOrder ascendente).
// Las que ya existen mantienen su slug y se actualiza sortOrder/desc/icon.
// Las nuevas se crean con upsert.
const catalog = [
  // ── Industriales pesadas / técnicas ─────────────
  {
    slug: 'construccion',
    name: 'Construcción y ferretería industrial',
    description:
      'Cementos, adhesivos, perfiles, anclajes, herramientas y impermeabilizantes para obra y faena.',
    icon: '🏗️',
    sortOrder: 1,
  },
  {
    slug: 'seguridad',
    name: 'Seguridad industrial y EPP',
    description:
      'Cascos, guantes, protección auditiva, ropa técnica, calzado y señalética industrial.',
    icon: '🦺',
    sortOrder: 2,
  },
  {
    slug: 'herramientas',
    name: 'Herramientas y maquinaria',
    description:
      'Herramientas eléctricas, compresores, soldadoras y equipos industriales para taller y faena.',
    icon: '🔨',
    sortOrder: 3,
  },
  {
    slug: 'automatizacion',
    name: 'Automatización y eléctrica',
    description:
      'Sensores, PLC, tableros eléctricos, cables, variadores e iluminación industrial.',
    icon: '⚡',
    sortOrder: 4,
  },
  {
    slug: 'hidraulica',
    name: 'Hidráulica y neumática',
    description:
      'Bombas, válvulas, fittings, cilindros, compresores y conexiones para sistemas presurizados.',
    icon: '🔧',
    sortOrder: 5,
  },
  {
    slug: 'lubricantes',
    name: 'Lubricantes y mantenimiento',
    description:
      'Grasas, aceites industriales, aerosoles técnicos y consumibles de mantenimiento preventivo.',
    icon: '🛢️',
    sortOrder: 6,
  },
  {
    slug: 'mineria',
    name: 'Minería y metalurgia',
    description:
      'Abrasivos, lubricantes especiales, mangueras hidráulicas, seguridad minera y aceros especiales.',
    icon: '⛏️',
    sortOrder: 7,
  },
  {
    slug: 'logistica',
    name: 'Logística y almacenamiento',
    description:
      'Racks, pallets, embalaje industrial, cintas y soluciones de bodegaje para centros de distribución.',
    icon: '🚛',
    sortOrder: 8,
  },
  {
    slug: 'aguas',
    name: 'Tratamiento de aguas',
    description:
      'Filtros, químicos, bombas dosificadoras y sistemas de purificación industrial.',
    icon: '💧',
    sortOrder: 9,
  },
  {
    slug: 'energia',
    name: 'Energía y soluciones solares',
    description:
      'Paneles solares, baterías, inversores, iluminación LED industrial y eficiencia energética.',
    icon: '☀️',
    sortOrder: 10,
  },
  {
    slug: 'refrigeracion',
    name: 'Refrigeración y climatización',
    description:
      'Equipos HVAC, gases refrigerantes, ventilación industrial y soluciones de frío.',
    icon: '❄️',
    sortOrder: 11,
  },

  // ── Procesos y consumibles ──────────────────────
  {
    slug: 'quimicos',
    name: 'Químicos industriales',
    description:
      'Soda cáustica, ácidos, solventes, cloro, tratamiento de aguas y procesos productivos.',
    icon: '⚗️',
    sortOrder: 12,
  },
  {
    slug: 'plasticos',
    name: 'Plásticos y polímeros',
    description:
      'Resinas, PVC, policarbonato, materiales técnicos y termoformados para manufactura.',
    icon: '♻️',
    sortOrder: 13,
  },
  {
    slug: 'packaging',
    name: 'Envases y packaging',
    description:
      'PET, doypack, envases cosméticos, etiquetas, packaging biodegradable y soluciones a medida.',
    icon: '📦',
    sortOrder: 14,
  },

  // ── Alimentación / salud / cuidado ──────────────
  {
    slug: 'alimentos',
    name: 'Alimentos y food service',
    description:
      'Insumos cafetería, quesos, salsas, abarrotes y productos para canal HORECA.',
    icon: '🍽️',
    sortOrder: 15,
  },
  {
    slug: 'limpieza',
    name: 'Limpieza industrial',
    description:
      'Detergentes, desinfectantes, productos de aseo profesional para edificios, oficinas y plantas.',
    icon: '🧽',
    sortOrder: 16,
  },
  {
    slug: 'cosmetica',
    name: 'Cosmética y cuidado personal',
    description:
      'Bases, fragancias, activos e ingredientes para shampoo, cremas y productos personales.',
    icon: '🧴',
    sortOrder: 17,
  },
  {
    slug: 'suplementos',
    name: 'Suplementos y farmacéutica',
    description:
      'Proteínas, vitaminas, ingredientes farmacéuticos y materias primas para nutracéuticos.',
    icon: '💊',
    sortOrder: 18,
  },

  // ── Otros mercados estratégicos ─────────────────
  {
    slug: 'agricultura',
    name: 'Agricultura y agroindustria',
    description:
      'Fertilizantes, riego tecnificado, fitosanitarios y soluciones para producción agroindustrial.',
    icon: '🌱',
    sortOrder: 19,
  },
]

let created = 0
let updated = 0

for (const c of catalog) {
  const existing = await prisma.category.findUnique({
    where: { slug: c.slug },
  })
  if (existing) {
    await prisma.category.update({
      where: { slug: c.slug },
      data: {
        name: c.name,
        description: c.description,
        icon: c.icon,
        sortOrder: c.sortOrder,
        active: true,
      },
    })
    updated++
    console.log(`✓ updated  · ${c.sortOrder.toString().padStart(2)} · ${c.slug}`)
  } else {
    await prisma.category.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon,
        sortOrder: c.sortOrder,
        active: true,
      },
    })
    created++
    console.log(`✓ NEW      · ${c.sortOrder.toString().padStart(2)} · ${c.slug}`)
  }
}

const total = await prisma.category.count({ where: { active: true } })
console.log(`\n→ created: ${created}, updated: ${updated}`)
console.log(`→ total active categories: ${total}`)

await prisma.$disconnect()
