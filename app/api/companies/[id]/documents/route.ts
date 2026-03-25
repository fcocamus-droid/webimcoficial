import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['RUT_EMPRESA', 'CERTIFICADO_SII', 'PODER_NOTARIAL'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

async function checkAccess(userId: string, role: string, companyId: string) {
  if (role === 'SUPERADMIN') return true
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  })
  return user?.companyId === companyId
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const role = (session.user as any).role as string
  const userId = (session.user as any).id as string
  const { id: companyId } = params

  const allowed = await checkAccess(userId, role, companyId)
  if (!allowed) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const documents = await prisma.companyDocument.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(documents)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const role = (session.user as any).role as string
  const userId = (session.user as any).id as string
  const { id: companyId } = params

  const allowed = await checkAccess(userId, role, companyId)
  if (!allowed) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el formulario multipart' }, { status: 400 })
  }

  const type = formData.get('type') as string | null
  const file = formData.get('file') as File | null

  if (!type || !ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])) {
    return NextResponse.json(
      { error: `El campo type debe ser uno de: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  if (!file) {
    return NextResponse.json({ error: 'Se requiere un archivo' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'El archivo debe ser un PDF (application/pdf)' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'El archivo no puede superar los 10 MB' }, { status: 400 })
  }

  const fileName = `${type}-${Date.now()}.pdf`
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Configuración de almacenamiento incompleta' }, { status: 500 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const storageUrl = `${supabaseUrl}/storage/v1/object/company-documents/${companyId}/${fileName}`

  const uploadRes = await fetch(storageUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': file.type,
    },
    body: buffer,
  })

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    console.error('Supabase Storage upload error:', errText)
    return NextResponse.json({ error: 'Error al subir el archivo al almacenamiento' }, { status: 502 })
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/company-documents/${companyId}/${fileName}`

  const document = await prisma.companyDocument.create({
    data: {
      companyId,
      type,
      fileName,
      fileUrl: publicUrl,
      fileSize: file.size,
      uploadedBy: userId,
    },
  })

  return NextResponse.json(document, { status: 201 })
}
