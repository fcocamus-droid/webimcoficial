import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { QuotePDF, type QuotePDFData } from '@/lib/pdf/quote-pdf'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        user: {
          select: { name: true, company: true, email: true },
        },
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotizacion no encontrada' },
        { status: 404 }
      )
    }

    // Only the owner or a SUPERADMIN can download the PDF
    if (
      quote.userId !== session.user.id &&
      (session.user as any).role !== 'SUPERADMIN'
    ) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const pdfData: QuotePDFData = {
      number: quote.number,
      createdAt: quote.createdAt,
      validUntil: quote.validUntil,
      clientName: quote.user?.name ?? null,
      clientCompany: quote.user?.company ?? null,
      clientEmail: quote.user?.email ?? null,
      originPort: quote.originPort,
      destPort: quote.destPort,
      incoterm: quote.incoterm,
      shipmentType: quote.shipmentType,
      commodity: quote.commodity,
      hsCode: quote.hsCode ?? null,
      cbm: quote.cbm ?? null,
      weightKg: quote.weightKg ?? null,
      containerQty: quote.containerQty ?? null,
      chargeableKg: quote.chargeableKg ?? null,
      cargoValueUSD: quote.cargoValueUSD ?? null,
      totalCostUSD: quote.totalCostUSD,
      totalCostCLP: quote.totalCostCLP ?? null,
      usdClpRate: quote.usdClpRate ?? null,
      items: quote.items.map((item) => ({
        description: item.description,
        cost: item.cost,
        currency: item.currency,
        type: item.type,
      })),
    }

    const buffer = await renderToBuffer(React.createElement(QuotePDF, { data: pdfData }) as any)

    const filename = `cotizacion-${quote.number}.pdf`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    )
  }
}
