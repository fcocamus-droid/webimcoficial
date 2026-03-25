import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// ── Types ────────────────────────────────────────────────────────────────────

export interface QuotePDFLineItem {
  description: string
  cost: number
  currency: string
  type: string
}

export interface QuotePDFData {
  number: string
  createdAt: Date | string
  validUntil: Date | string
  // Client
  clientName?: string | null
  clientCompany?: string | null
  clientEmail?: string | null
  // Route
  originPort: string
  destPort: string
  incoterm: string
  shipmentType: string
  // Cargo
  commodity: string
  hsCode?: string | null
  cbm?: number | null
  weightKg?: number | null
  containerQty?: number | null
  chargeableKg?: number | null
  cargoValueUSD?: number | null
  // Results
  totalCostUSD: number
  totalCostCLP?: number | null
  usdClpRate?: number | null
  items: QuotePDFLineItem[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  FREIGHT: 'FLETE',
  ORIGIN: 'GASTOS ORIGEN',
  DESTINATION: 'GASTOS DESTINO',
  CUSTOMS: 'ADUANA',
  INSURANCE: 'SEGURO',
  LAST_MILE: 'ULTIMA MILLA',
  SURCHARGE: 'RECARGOS',
}

const SECTION_ORDER = [
  'FREIGHT',
  'SURCHARGE',
  'ORIGIN',
  'DESTINATION',
  'CUSTOMS',
  'INSURANCE',
  'LAST_MILE',
]

const SHIPMENT_LABELS: Record<string, string> = {
  LCL: 'LCL (Grupaje)',
  FCL_20: "FCL 20'",
  FCL_40: "FCL 40'",
  FCL_40HC: "FCL 40' HC",
  AIR: 'Aereo',
}

// ── Colors ────────────────────────────────────────────────────────────────────

const BLUE = '#1B2A6B'
const ORANGE = '#F47920'
const GRAY_LIGHT = '#F5F5F5'
const GRAY_MID = '#E5E7EB'
const GRAY_TEXT = '#6B7280'

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1F2937',
    paddingTop: 36,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: BLUE,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: ORANGE,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  headerTagline: {
    fontSize: 8,
    color: GRAY_TEXT,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  quoteNumber: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
  },
  headerMeta: {
    fontSize: 8,
    color: GRAY_TEXT,
    marginTop: 4,
    textAlign: 'right',
  },

  // Section title
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 14,
  },

  // Info grid (two columns)
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  infoBox: {
    flex: 1,
    backgroundColor: GRAY_LIGHT,
    borderRadius: 4,
    padding: 10,
  },
  infoBoxTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_TEXT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 8,
    color: GRAY_TEXT,
    width: 90,
  },
  infoValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    flex: 1,
  },

  // Route highlight
  routeBox: {
    backgroundColor: BLUE,
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  routeArrow: {
    fontSize: 12,
    color: ORANGE,
    marginHorizontal: 10,
  },
  routeMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 6,
  },
  routeMetaItem: {
    fontSize: 8,
    color: GRAY_TEXT,
  },
  routeMetaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
  },

  // Breakdown table
  table: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: GRAY_MID,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLUE,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  tableHeaderCellRight: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  colDesc: { flex: 1 },
  colCost: { width: 80, textAlign: 'right' },

  sectionGroupHeader: {
    flexDirection: 'row',
    backgroundColor: GRAY_LIGHT,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: GRAY_MID,
  },
  sectionGroupLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: GRAY_MID,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: GRAY_MID,
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    fontSize: 8,
    color: '#374151',
    paddingLeft: 8,
  },
  tableCellRight: {
    fontSize: 8,
    color: '#374151',
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  subtotalRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#F0F4FF',
    borderTopWidth: 1,
    borderTopColor: GRAY_MID,
  },
  subtotalLabel: {
    flex: 1,
    fontSize: 7,
    color: GRAY_TEXT,
    textAlign: 'right',
    paddingRight: 4,
  },
  subtotalValue: {
    width: 80,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    textAlign: 'right',
  },

  // Totals
  totalsSection: {
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: BLUE,
  },
  totalRowUSD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#EEF1FA',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  totalRowCLP: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5ED',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  totalLabelUSD: {
    color: BLUE,
  },
  totalLabelCLP: {
    color: ORANGE,
  },
  totalValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },
  totalValueUSD: {
    color: BLUE,
  },
  totalValueCLP: {
    color: ORANGE,
  },
  exchangeRate: {
    textAlign: 'right',
    fontSize: 7,
    color: GRAY_TEXT,
    marginTop: 4,
  },

  // Disclaimer
  disclaimer: {
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    padding: 8,
  },
  disclaimerText: {
    fontSize: 7,
    color: '#92400E',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: GRAY_MID,
    paddingTop: 8,
  },
  footerLeft: {
    fontSize: 7,
    color: GRAY_TEXT,
  },
  footerRight: {
    fontSize: 7,
    color: GRAY_TEXT,
  },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatUSD(n: number): string {
  return `US$ ${n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function groupItems(
  items: QuotePDFLineItem[]
): Record<string, QuotePDFLineItem[]> {
  const groups: Record<string, QuotePDFLineItem[]> = {}
  for (const item of items) {
    if (!groups[item.type]) groups[item.type] = []
    groups[item.type].push(item)
  }
  return groups
}

function sectionTotal(items: QuotePDFLineItem[]): number {
  return items.reduce((s, i) => s + i.cost, 0)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuotePDF({ data }: { data: QuotePDFData }) {
  const grouped = groupItems(data.items)

  const cargoDetails: { label: string; value: string }[] = [
    { label: 'Mercaderia', value: data.commodity },
  ]
  if (data.hsCode) cargoDetails.push({ label: 'HS Code', value: data.hsCode })
  if (data.cbm != null)
    cargoDetails.push({ label: 'Volumen', value: `${data.cbm} CBM` })
  if (data.weightKg != null)
    cargoDetails.push({ label: 'Peso', value: `${data.weightKg} kg` })
  if (data.containerQty != null)
    cargoDetails.push({
      label: 'Contenedores',
      value: `${data.containerQty} x ${SHIPMENT_LABELS[data.shipmentType] || data.shipmentType}`,
    })
  if (data.chargeableKg != null)
    cargoDetails.push({
      label: 'Peso cobrable',
      value: `${data.chargeableKg} kg`,
    })
  if (data.cargoValueUSD != null)
    cargoDetails.push({
      label: 'Valor mercaderia',
      value: formatUSD(data.cargoValueUSD),
    })

  return (
    <Document
      title={`Cotizacion ${data.number}`}
      author="IMC Cargo"
      subject="Cotizacion Internacional de Flete"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>IMC CARGO</Text>
            <Text style={styles.headerSubtitle}>Cotizacion Internacional</Text>
            <Text style={styles.headerTagline}>
              Soluciones logisticas integrales para su comercio exterior
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteNumber}>{data.number}</Text>
            <Text style={styles.headerMeta}>
              Fecha: {formatDate(data.createdAt)}
            </Text>
            <Text style={styles.headerMeta}>
              Valida hasta: {formatDate(data.validUntil)}
            </Text>
          </View>
        </View>

        {/* ── Client + Route info ── */}
        <View style={styles.infoGrid}>
          {/* Client info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Informacion del Cliente</Text>
            {data.clientName ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre:</Text>
                <Text style={styles.infoValue}>{data.clientName}</Text>
              </View>
            ) : null}
            {data.clientCompany ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Empresa:</Text>
                <Text style={styles.infoValue}>{data.clientCompany}</Text>
              </View>
            ) : null}
            {data.clientEmail ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{data.clientEmail}</Text>
              </View>
            ) : null}
            {!data.clientName && !data.clientCompany && !data.clientEmail ? (
              <Text style={{ fontSize: 8, color: GRAY_TEXT }}>
                Sin informacion de cliente
              </Text>
            ) : null}
          </View>

          {/* Cargo info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Informacion de Carga</Text>
            {cargoDetails.map((d, i) => (
              <View style={styles.infoRow} key={i}>
                <Text style={styles.infoLabel}>{d.label}:</Text>
                <Text style={styles.infoValue}>{d.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Route ── */}
        <Text style={styles.sectionTitle}>Ruta de Envio</Text>
        <View style={styles.routeBox}>
          <Text style={styles.routeText}>{data.originPort}</Text>
          <Text style={styles.routeArrow}> → </Text>
          <Text style={styles.routeText}>{data.destPort}</Text>
        </View>
        <View style={styles.routeMeta}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Text style={styles.routeMetaItem}>Incoterm: </Text>
            <Text style={styles.routeMetaValue}>{data.incoterm}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Text style={styles.routeMetaItem}>Tipo: </Text>
            <Text style={styles.routeMetaValue}>
              {SHIPMENT_LABELS[data.shipmentType] || data.shipmentType}
            </Text>
          </View>
        </View>

        {/* ── Breakdown table ── */}
        <Text style={styles.sectionTitle}>Desglose de Costos</Text>
        <View style={styles.table}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>
              Concepto
            </Text>
            <Text style={[styles.tableHeaderCellRight, styles.colCost]}>
              Costo (USD)
            </Text>
          </View>

          {/* Groups */}
          {SECTION_ORDER.map((sectionKey) => {
            const items = grouped[sectionKey]
            if (!items || items.length === 0) return null

            return (
              <View key={sectionKey}>
                {/* Group header */}
                <View style={styles.sectionGroupHeader}>
                  <Text style={[styles.sectionGroupLabel, styles.colDesc]}>
                    {SECTION_LABELS[sectionKey] || sectionKey}
                  </Text>
                </View>

                {/* Items */}
                {items.map((item, idx) => (
                  <View
                    key={`${sectionKey}-${idx}`}
                    style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                  >
                    <Text style={[styles.tableCell, styles.colDesc]}>
                      {item.description}
                    </Text>
                    <Text style={[styles.tableCellRight, styles.colCost]}>
                      {formatUSD(item.cost)}
                    </Text>
                  </View>
                ))}

                {/* Section subtotal */}
                <View style={styles.subtotalRow}>
                  <Text style={styles.subtotalLabel}>
                    Subtotal {SECTION_LABELS[sectionKey] || sectionKey}
                  </Text>
                  <Text style={styles.subtotalValue}>
                    {formatUSD(sectionTotal(items))}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRowUSD}>
            <Text style={[styles.totalLabel, styles.totalLabelUSD]}>
              TOTAL USD
            </Text>
            <Text style={[styles.totalValue, styles.totalValueUSD]}>
              {formatUSD(data.totalCostUSD)}
            </Text>
          </View>
          {data.totalCostCLP != null && (
            <View style={styles.totalRowCLP}>
              <Text style={[styles.totalLabel, styles.totalLabelCLP]}>
                TOTAL CLP
              </Text>
              <Text style={[styles.totalValue, styles.totalValueCLP]}>
                {`CLP$ ${data.totalCostCLP.toLocaleString('es-CL')}`}
              </Text>
            </View>
          )}
          {data.usdClpRate != null && (
            <Text style={styles.exchangeRate}>
              Tipo de cambio utilizado: 1 USD ={' '}
              {data.usdClpRate.toLocaleString('es-CL')} CLP
            </Text>
          )}
        </View>

        {/* ── Disclaimer ── */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            * Los valores de aduana son estimados y pueden variar segun la
            clasificacion arancelaria definitiva. Esta cotizacion es valida por
            15 dias desde la fecha de emision. Los precios estan expresados en
            dolares americanos (USD) salvo indicacion contraria.
          </Text>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>
            IMC CARGO — Cotizacion Internacional de Flete
          </Text>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) =>
              `Pagina ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
