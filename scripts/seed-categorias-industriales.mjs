// scripts/seed-categorias-industriales.mjs
// Catálogo completo de categorías. Idempotente (upsert por slug).

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const catalog = [
  // ── Industriales pesadas / técnicas (1-11) ──────
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

  // ── Tecnología y oficina (12-13) ────────────────
  {
    slug: 'tecnologia',
    name: 'Tecnología y computación',
    description:
      'Notebooks, PC, servidores, redes, periféricos, CCTV, domótica, smart home y electrónica empresarial.',
    icon: '💻',
    sortOrder: 12,
  },
  {
    slug: 'oficina',
    name: 'Oficina y papelería',
    description:
      'Suministros, papel, tintas y tóner, archivadores, organizadores y consumibles para operación diaria.',
    icon: '🖨️',
    sortOrder: 13,
  },

  // ── Materiales y procesos (14-18) ───────────────
  {
    slug: 'quimicos',
    name: 'Químicos industriales',
    description:
      'Soda cáustica, ácidos, solventes, cloro, tratamiento de aguas y procesos productivos.',
    icon: '⚗️',
    sortOrder: 14,
  },
  {
    slug: 'plasticos',
    name: 'Plásticos y polímeros',
    description:
      'Resinas, PVC, policarbonato, materiales técnicos y termoformados para manufactura.',
    icon: '♻️',
    sortOrder: 15,
  },
  {
    slug: 'maderas',
    name: 'Maderas y tableros industriales',
    description:
      'MDF, OSB, melaminas, terciados y soluciones para carpintería y construcción a escala.',
    icon: '🪵',
    sortOrder: 16,
  },
  {
    slug: 'textil',
    name: 'Textil industrial y uniformes',
    description:
      'Geotextiles, telas técnicas, uniformes corporativos y protección textil industrial.',
    icon: '🧵',
    sortOrder: 17,
  },
  {
    slug: 'packaging',
    name: 'Envases y packaging',
    description:
      'PET, doypack, envases cosméticos, etiquetas, packaging biodegradable y soluciones a medida.',
    icon: '📦',
    sortOrder: 18,
  },

  // ── Alimentación, bebidas, cuidado (19-23) ──────
  {
    slug: 'alimentos',
    name: 'Alimentos y food service',
    description:
      'Insumos cafetería, quesos, salsas, abarrotes y productos para canal HORECA.',
    icon: '🍽️',
    sortOrder: 19,
  },
  {
    slug: 'bebidas',
    name: 'Bebidas y licores',
    description:
      'Vinos, cervezas, destilados, bebidas y jugos para canal HORECA, retail y eventos.',
    icon: '🍷',
    sortOrder: 20,
  },
  {
    slug: 'limpieza',
    name: 'Limpieza industrial',
    description:
      'Detergentes, desinfectantes, productos de aseo profesional para edificios, oficinas y plantas.',
    icon: '🧽',
    sortOrder: 21,
  },
  {
    slug: 'cosmetica',
    name: 'Cosmética y cuidado personal',
    description:
      'Bases, fragancias, activos e ingredientes para shampoo, cremas y productos personales.',
    icon: '🧴',
    sortOrder: 22,
  },
  {
    slug: 'suplementos',
    name: 'Suplementos y farmacéutica',
    description:
      'Proteínas, vitaminas, ingredientes farmacéuticos y materias primas para nutracéuticos.',
    icon: '💊',
    sortOrder: 23,
  },

  // ── Equipamiento especializado (24-27) ──────────
  {
    slug: 'medico',
    name: 'Equipamiento médico y salud',
    description:
      'Insumos clínicos, instrumental dental, primeros auxilios y equipamiento para centros de salud.',
    icon: '🏥',
    sortOrder: 24,
  },
  {
    slug: 'mobiliario',
    name: 'Mobiliario corporativo e industrial',
    description:
      'Estanterías, lockers, escritorios, sillas operativas y mobiliario técnico para oficinas y bodegas.',
    icon: '💼',
    sortOrder: 25,
  },
  {
    slug: 'eventos',
    name: 'Eventos, sonido y publicidad',
    description:
      'Gigantografía, banners, equipos de audio, iluminación escénica, mobiliario y producción de eventos.',
    icon: '🎉',
    sortOrder: 26,
  },
  {
    slug: 'transporte',
    name: 'Transporte y automotriz',
    description:
      'Repuestos, baterías, neumáticos, lubricantes auto y accesorios para flotas y talleres.',
    icon: '🚗',
    sortOrder: 27,
  },

  // ── Otros mercados (28-32) ──────────────────────
  {
    slug: 'agricultura',
    name: 'Agricultura y agroindustria',
    description:
      'Fertilizantes, riego tecnificado, fitosanitarios y soluciones para producción agroindustrial.',
    icon: '🌱',
    sortOrder: 28,
  },
  {
    slug: 'veterinaria',
    name: 'Veterinaria y mascotas',
    description:
      'Insumos veterinarios, alimentos premium y accesorios para clínicas, criaderos y pet shops.',
    icon: '🐶',
    sortOrder: 29,
  },
  {
    slug: 'hogar-jardin',
    name: 'Hogar y jardín',
    description:
      'Muebles, decoración, iluminación, herramientas de jardín, parrillas, organización y outdoor.',
    icon: '🏡',
    sortOrder: 30,
  },
  {
    slug: 'deportes-outdoor',
    name: 'Deportes y outdoor',
    description:
      'Gimnasio, fitness, trekking, camping, ciclismo, running, suplementos deportivos y accesorios.',
    icon: '🏃',
    sortOrder: 31,
  },
  {
    slug: 'educacion',
    name: 'Educación y material didáctico',
    description:
      'Material escolar, mobiliario educativo, equipos didácticos y juguetería pedagógica para colegios.',
    icon: '📚',
    sortOrder: 32,
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
    console.log(
      `✓ updated  · ${c.sortOrder.toString().padStart(2)} · ${c.slug}`
    )
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
    console.log(
      `✓ NEW      · ${c.sortOrder.toString().padStart(2)} · ${c.slug}`
    )
  }
}

const total = await prisma.category.count({ where: { active: true } })
console.log(`\n→ created: ${created}, updated: ${updated}`)
console.log(`→ total active categories: ${total}`)

await prisma.$disconnect()
