// Email al BUYER cuando un seller responde su RFQ.
import { Button, Heading, Section, Text } from '@react-email/components'
import EmailLayout from './Layout'

export default function RfqResponseEmail({
  appUrl,
  rfqId,
  rfqNumber,
  rfqTitle,
  sellerCompany,
  pricePerUnit,
  totalPrice,
  unit,
  leadTimeDays,
  notes,
  isUpdate,
}: {
  appUrl: string
  rfqId: string
  rfqNumber: string
  rfqTitle: string
  sellerCompany: string
  pricePerUnit: string
  totalPrice: string
  unit: string
  leadTimeDays: number | null
  notes: string | null
  isUpdate: boolean
}) {
  const url = `${appUrl}/panel/comprador/rfqs/${rfqId}`

  return (
    <EmailLayout
      preview={`${sellerCompany} respondió tu cotización ${rfqNumber}`}
    >
      <Section>
        <Text style={tag}>
          {isUpdate ? '🔄 Cotización actualizada' : '💸 Nueva respuesta'} ·{' '}
          {rfqNumber}
        </Text>
        <Heading style={h1}>{rfqTitle}</Heading>
        <Text style={p}>
          <strong>{sellerCompany}</strong>{' '}
          {isUpdate
            ? 'actualizó su cotización con nuevos términos.'
            : 'te envió una cotización con precio y plazo.'}
        </Text>
      </Section>

      <Section style={card}>
        <Text style={priceLabel}>Precio total cotizado</Text>
        <Text style={priceBig}>{totalPrice}</Text>
        <Text style={priceSub}>
          {pricePerUnit} / {unit}
          {leadTimeDays !== null && ` · entrega en ${leadTimeDays} días`}
        </Text>
      </Section>

      {notes && (
        <Section>
          <Text style={subhead}>Notas del proveedor</Text>
          <Text style={quote}>{truncate(notes, 600)}</Text>
        </Section>
      )}

      <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
        <Button href={url} style={btn}>
          Ver y comparar respuestas →
        </Button>
      </Section>

      <Text style={tipText}>
        💡 Compara con las otras respuestas en tu panel. Cuando elijas, puedes
        cerrar la cotización para indicar que ya encontraste proveedor.
      </Text>
    </EmailLayout>
  )
}

function truncate(t: string, n: number) {
  if (t.length <= n) return t
  return t.slice(0, n).trimEnd() + '…'
}

const tag = {
  color: '#059669',
  fontSize: '12px',
  fontWeight: '700' as const,
  letterSpacing: '0.05em',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
}

const h1 = {
  color: '#1B2A6B',
  fontSize: '22px',
  fontWeight: '700' as const,
  margin: '0 0 12px',
}

const p = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 12px',
}

const card = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #10b981',
  borderRadius: '10px',
  padding: '18px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const priceLabel = {
  color: '#64748b',
  fontSize: '11px',
  fontWeight: '700' as const,
  letterSpacing: '0.06em',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
}

const priceBig = {
  color: '#1B2A6B',
  fontSize: '32px',
  fontWeight: '800' as const,
  margin: '0 0 4px',
}

const priceSub = {
  color: '#475569',
  fontSize: '13px',
  margin: 0,
}

const subhead = {
  color: '#64748b',
  fontSize: '11px',
  fontWeight: '700' as const,
  letterSpacing: '0.06em',
  margin: '8px 0 6px',
  textTransform: 'uppercase' as const,
}

const quote = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '20px',
  borderLeft: '3px solid #f59e0b',
  paddingLeft: '12px',
  margin: 0,
  whiteSpace: 'pre-line' as const,
}

const btn = {
  backgroundColor: '#f59e0b',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  textDecoration: 'none',
}

const tipText = {
  color: '#64748b',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: '12px 0 0',
}
