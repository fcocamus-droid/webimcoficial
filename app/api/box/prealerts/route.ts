import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const preAlertSchema = z.object({
  store: z.string().nullable().optional(),
  tracking: z.string().nullable().optional(),
  description: z.string().min(1, 'Descripción requerida').max(500),
  valueUSD: z.number().positive('El valor debe ser mayor a 0'),
  estimatedWeight: z.number().positive().nullable().optional(),
  packageTypeId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

async function generateUniqueCode() {
  // Find highest existing IMC code number and increment
  const last = await prisma.preAlert.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  })
  const lastPkg = await prisma.package.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  })

  let maxNum = 6745  // start above legacy max IMC6744
  for (const code of [last?.code, lastPkg?.code]) {
    if (!code) continue
    const m = code.match(/IMC(\d+)/)
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10) + 1)
  }

  return `IMC${maxNum}`
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = preAlertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Datos inválidos' },
        { status: 400 }
      )
    }

    const code = await generateUniqueCode()

    const preAlert = await prisma.preAlert.create({
      data: {
        code,
        userId: session.user.id,
        store: parsed.data.store || null,
        tracking: parsed.data.tracking || null,
        description: parsed.data.description,
        valueUSD: parsed.data.valueUSD,
        estimatedWeight: parsed.data.estimatedWeight || null,
        packageTypeId: parsed.data.packageTypeId || null,
        notes: parsed.data.notes || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ ok: true, preAlert: { id: preAlert.id, code: preAlert.code } })
  } catch (e: any) {
    console.error('Pre-alert create error:', e)
    return NextResponse.json(
      { error: 'Error al crear pre-alerta', detail: e.message },
      { status: 500 }
    )
  }
}
