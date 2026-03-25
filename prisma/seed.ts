// prisma/seed.ts
import { PrismaClient, Role, ShipmentType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ===== SUPERADMIN =====
  const hashedPassword = await hash('123456', 12)
  const superadmin = await prisma.user.upsert({
    where: { email: 'fcocamus@gmail.com' },
    update: {},
    create: {
      email: 'fcocamus@gmail.com',
      password: hashedPassword,
      name: 'Francisco Camus',
      company: 'IMC Cargo S.A.',
      role: Role.SUPERADMIN,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Superadmin creado:', superadmin.email)

  // Cliente de prueba
  const clientPassword = await hash('cliente123', 12)
  const testClient = await prisma.user.upsert({
    where: { email: 'cliente@test.com' },
    update: {},
    create: {
      email: 'cliente@test.com',
      password: clientPassword,
      name: 'Cliente Prueba',
      company: 'Empresa Test Ltda.',
      rut: '76.123.456-7',
      phone: '+56912345678',
      role: Role.CLIENT,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Cliente prueba creado:', testClient.email)

  // ===== PUERTOS PRINCIPALES =====
  const ports = [
    { name: 'Valparaíso', code: 'CLVAP', country: 'CL', type: 'SEA' },
    { name: 'San Antonio', code: 'CLSAI', country: 'CL', type: 'SEA' },
    { name: 'Iquique', code: 'CLIQQ', country: 'CL', type: 'SEA' },
    { name: 'Antofagasta', code: 'CLANT', country: 'CL', type: 'SEA' },
    { name: 'Shanghai', code: 'CNSHA', country: 'CN', type: 'SEA' },
    { name: 'Ningbo', code: 'CNNGB', country: 'CN', type: 'SEA' },
    { name: 'Shenzhen (Yantian)', code: 'CNYTN', country: 'CN', type: 'SEA' },
    { name: 'Guangzhou (Nansha)', code: 'CNNSN', country: 'CN', type: 'SEA' },
    { name: 'Busan', code: 'KRPUS', country: 'KR', type: 'SEA' },
    { name: 'Los Angeles', code: 'USLAX', country: 'US', type: 'SEA' },
    { name: 'Miami', code: 'USMIA', country: 'US', type: 'SEA' },
    { name: 'Rotterdam', code: 'NLRTM', country: 'NL', type: 'SEA' },
    { name: 'Hamburg', code: 'DEHAM', country: 'DE', type: 'SEA' },
    { name: 'Callao (Lima)', code: 'PECLL', country: 'PE', type: 'SEA' },
    // Air
    { name: 'Aeropuerto Santiago (SCL)', code: 'CLSCL', country: 'CL', type: 'AIR' },
    { name: 'Aeropuerto Shanghai Pudong', code: 'CNPVG', country: 'CN', type: 'AIR' },
    { name: 'Aeropuerto Miami International', code: 'USMIA_AIR', country: 'US', type: 'AIR' },
  ]

  for (const port of ports) {
    await prisma.port.upsert({
      where: { code: port.code },
      update: {},
      create: port,
    })
  }
  console.log(`✅ ${ports.length} puertos creados`)

  // ===== NAVIERAS/CARRIERS =====
  const carriers = [
    { name: 'MSC', code: 'MSC', type: 'MARITIME' },
    { name: 'CMA CGM', code: 'CMA', type: 'MARITIME' },
    { name: 'Hapag-Lloyd', code: 'HAPAG', type: 'MARITIME' },
    { name: 'Evergreen', code: 'EVERGREEN', type: 'MARITIME' },
    { name: 'Cosco', code: 'COSCO', type: 'MARITIME' },
    { name: 'LATAM Cargo', code: 'LATAM', type: 'AIR' },
    { name: 'LAN Cargo', code: 'LAN', type: 'AIR' },
  ]

  const carrierMap: Record<string, string> = {}
  for (const carrier of carriers) {
    const c = await prisma.carrier.upsert({
      where: { code: carrier.code },
      update: {},
      create: { ...carrier, active: true },
    })
    carrierMap[carrier.code] = c.id
  }
  console.log(`✅ ${carriers.length} carriers creados`)

  // ===== TARIFAS BASE LCL (China → Chile) =====
  const validFrom = new Date('2025-01-01')
  const validTo = new Date('2025-12-31')

  const lclRates = [
    // Shanghai → Valparaíso
    { carrierId: carrierMap['MSC'], originPort: 'CNSHA', destPort: 'CLVAP', shipmentType: ShipmentType.LCL, ratePerCBM: 38, ratePerTon: 38, minCBM: 1 },
    // Ningbo → Valparaíso
    { carrierId: carrierMap['CMA'], originPort: 'CNNGB', destPort: 'CLVAP', shipmentType: ShipmentType.LCL, ratePerCBM: 36, ratePerTon: 36, minCBM: 1 },
    // Shanghai → San Antonio
    { carrierId: carrierMap['HAPAG'], originPort: 'CNSHA', destPort: 'CLSAI', shipmentType: ShipmentType.LCL, ratePerCBM: 40, ratePerTon: 40, minCBM: 1 },
    // Shenzhen → Valparaíso
    { carrierId: carrierMap['EVERGREEN'], originPort: 'CNYTN', destPort: 'CLVAP', shipmentType: ShipmentType.LCL, ratePerCBM: 35, ratePerTon: 35, minCBM: 1 },
  ]

  for (const rate of lclRates) {
    await prisma.shippingRate.create({
      data: { ...rate, currency: 'USD', validFrom, validTo, active: true },
    })
  }

  // ===== TARIFAS FCL =====
  const fclRates = [
    // Shanghai → Valparaíso FCL20
    { carrierId: carrierMap['MSC'], originPort: 'CNSHA', destPort: 'CLVAP', shipmentType: ShipmentType.FCL_20, rateContainer: 1200 },
    { carrierId: carrierMap['MSC'], originPort: 'CNSHA', destPort: 'CLVAP', shipmentType: ShipmentType.FCL_40, rateContainer: 1800 },
    { carrierId: carrierMap['MSC'], originPort: 'CNSHA', destPort: 'CLVAP', shipmentType: ShipmentType.FCL_40HC, rateContainer: 1950 },
    // CMA CGM
    { carrierId: carrierMap['CMA'], originPort: 'CNSHA', destPort: 'CLVAP', shipmentType: ShipmentType.FCL_20, rateContainer: 1150 },
    { carrierId: carrierMap['CMA'], originPort: 'CNSHA', destPort: 'CLVAP', shipmentType: ShipmentType.FCL_40, rateContainer: 1750 },
  ]

  for (const rate of fclRates) {
    await prisma.shippingRate.create({
      data: { ...rate, currency: 'USD', validFrom, validTo, active: true },
    })
  }
  console.log('✅ Tarifas de flete creadas')

  // ===== SURCHARGES =====
  const surcharges = [
    { code: 'BAF', name: 'Bunker Adjustment Factor', description: 'Recargo por combustible', amount: 85, currency: 'USD' },
    { code: 'CAF', name: 'Currency Adjustment Factor', description: 'Recargo por tipo de cambio', amount: 15, currency: 'USD' },
    { code: 'THC_ORIGIN', name: 'THC Origen', description: 'Terminal Handling Charge en origen (China)', amount: 75, currency: 'USD' },
    { code: 'THC_DEST', name: 'THC Destino', description: 'Terminal Handling Charge en destino (Chile)', amount: 90, currency: 'USD' },
    { code: 'ISPS', name: 'ISPS Security', description: 'Recargo de seguridad portuaria', amount: 25, currency: 'USD' },
    { code: 'BL_FEE', name: 'B/L Fee', description: 'Emisión de conocimiento de embarque', amount: 55, currency: 'USD' },
    { code: 'IMO', name: 'IMO 2020 Surcharge', description: 'Cumplimiento regulación azufre', amount: 20, currency: 'USD' },
    { code: 'ORIGIN_HANDLING', name: 'Gastos Origen', description: 'Handling en consolidación origen', amount: 40, currency: 'USD' },
    { code: 'DEST_HANDLING', name: 'Gastos Destino', description: 'Handling en desconsolidación destino', amount: 50, currency: 'USD' },
    { code: 'CUSTOMS_DISPATCH', name: 'Despacho Aduanas', description: 'Trámite aduanal en Chile', amount: 180, currency: 'USD' },
  ]

  for (const surcharge of surcharges) {
    await prisma.surcharge.upsert({
      where: { code: surcharge.code },
      update: {},
      create: { ...surcharge, active: true },
    })
  }
  console.log(`✅ ${surcharges.length} surcharges creados`)

  // ===== TIPO DE CAMBIO INICIAL =====
  await prisma.exchangeRate.create({
    data: { usdToCLP: 940 },
  })
  console.log('✅ Tipo de cambio inicial: 940 CLP/USD')

  // ===== ZONAS ÚLTIMA MILLA =====
  const zones = [
    { region: 'RM', description: 'Región Metropolitana (Santiago)', rateUSD: 80 },
    { region: 'V', description: 'Región de Valparaíso', rateUSD: 60 },
    { region: 'VI', description: 'Región del Libertador', rateUSD: 100 },
    { region: 'VII', description: 'Región del Maule', rateUSD: 110 },
    { region: 'VIII', description: 'Región del Biobío (Concepción)', rateUSD: 120 },
    { region: 'IX', description: 'Región de La Araucanía', rateUSD: 140 },
    { region: 'I', description: 'Región de Tarapacá (Iquique)', rateUSD: 50 },
    { region: 'II', description: 'Región de Antofagasta', rateUSD: 55 },
    { region: 'IV', description: 'Región de Coquimbo (La Serena)', rateUSD: 90 },
  ]

  for (const zone of zones) {
    await prisma.lastMileZone.create({ data: { ...zone, active: true } })
  }
  console.log(`✅ ${zones.length} zonas de última milla creadas`)

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('   Superadmin: fcocamus@gmail.com / 123456')
  console.log('   Cliente:    cliente@test.com / cliente123')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
