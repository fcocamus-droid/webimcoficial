// GET /api/seller/products/bulk/template
// Descarga la plantilla CSV con headers y 2 filas de ejemplo + BOM UTF-8
// para que Excel la abra con tildes correctas.

import { requireRole } from '@/lib/auth-guards'
import { buildTemplateCSV } from '@/lib/product-bulk'

export async function GET() {
  const guard = await requireRole('SELLER')
  if (!guard.ok) {
    return new Response('Unauthorized', { status: guard.status })
  }
  const csv = '﻿' + buildTemplateCSV() // BOM UTF-8 para Excel
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="plantilla-productos-imc.csv"',
    },
  })
}
