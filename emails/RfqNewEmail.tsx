// Email al SELLER cuando llega una nueva RFQ en su categoría / producto.
import { Button, Heading, Hr, Section, Text } from '@react-email/components'
import EmailLayout from './Layout'

export default function RfqNewEmail({
  appUrl,
  rfqId,
  rfqNumber,
  rfqTitle,
  rfqDescription,
  quantity,
  unit,
  buyerName,
  buyerCompany,
  categoryName,
  productTitle,
  deliveryDeadline,
}: {
  appUrl: string
  rfqId: string
  rfqNumber: string
  rfqTitle: string
  rfqDescription: string
  quantity: number
  unit: string
  buyerName: string | null
  buyerCompany: string | null
  categoryName: string | null
  productTitle: string | null
  deliveryDeadline: string | null
}) {
  const url = `${appUrl}/panel/vendedor/solicitudes/${rfqId}`
  const buyerLabel = buyerCompany || buyerName || 'Comprador empresarial'

  return (
    <EmailLayout preview={`Nueva solicitud: ${rfqTitle}`}>
      <Section>
        <Text style={tag}>📨 Nueva cotización · {rfqNumber}</Text>
        <Heading style={h1}>{rfqTitle}</Heading>
        <Text style={p}>
          <strong>{buyerLabel}</strong> envió una solicitud de cotización en{' '}
          {productTitle
            ? `tu producto "${productTitle}"`
            : categoryName
              ? `la categoría ${categoryName}`
              : 'una de tus categorías'}
          .
        </Text>
      </Section>

      <Section style={card}>
        <Row label="Cantidad" value={`${quantity} ${unit}`} />
        {deliveryDeadline && (
          <Row label="Fecha de entrega" value={deliveryDeadline} />
        )}
        {categoryName && <Row label="Categoría" value={categoryName} />}
      </Section>

      <Section>
        <Text style={subhead}>Descripción del comprador</Text>
        <Text style={quote}>{truncate(rfqDescription, 500)}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
        <Button href={url} style={btn}>
          Responder cotización →
        </Button>
      </Section>

      <Hr style={hr} />
      <Text style={tipText}>
        💡 Las primeras respuestas suelen ganar el negocio. Responde con precio,
        lead time y cualquier observación relevante.
      </Text>
    </EmailLayout>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={rowText}>
      <span style={rowLabel}>{label}: </span>
      <strong>{value}</strong>
    </Text>
  )
}

function truncate(t: string, n: number) {
  if (t.length <= n) return t
  return t.slice(0, n).trimEnd() + '…'
}

const tag = {
  color: '#d97706',
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
  backgroundColor: '#f1f5f9',
  borderRadius: '10px',
  padding: '16px',
  margin: '16px 0',
}

const rowText = {
  color: '#334155',
  fontSize: '14px',
  margin: '0 0 6px',
}

const rowLabel = {
  color: '#64748b',
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
  backgroundColor: '#1B2A6B',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  textDecoration: 'none',
}

const hr = {
  borderTop: '1px solid #e2e8f0',
  margin: '20px 0 12px',
}

const tipText = {
  color: '#64748b',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: 0,
}
