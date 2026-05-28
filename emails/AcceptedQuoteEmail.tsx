// Email al SELLER cuando el comprador acepta su cotización.
import { Button, Heading, Section, Text } from '@react-email/components'
import EmailLayout from './Layout'

export default function AcceptedQuoteEmail({
  appUrl,
  rfqId,
  rfqNumber,
  rfqTitle,
  sellerName,
  totalPrice,
  quantity,
  unit,
}: {
  appUrl: string
  rfqId: string
  rfqNumber: string
  rfqTitle: string
  sellerName: string
  totalPrice: string
  quantity: number
  unit: string
}) {
  const url = `${appUrl}/panel/vendedor/solicitudes/${rfqId}`
  return (
    <EmailLayout preview={`Ganaste la cotización ${rfqNumber}`}>
      <Section>
        <Text style={tag}>🎉 ¡Ganaste! · {rfqNumber}</Text>
        <Heading style={h1}>{sellerName}, te aceptaron la cotización</Heading>
        <Text style={p}>
          El comprador eligió tu cotización para <strong>{rfqTitle}</strong>.
          ¡Felicitaciones por cerrar esta venta!
        </Text>
      </Section>

      <Section style={card}>
        <Text style={priceLabel}>Total cerrado (neto)</Text>
        <Text style={priceBig}>{totalPrice}</Text>
        <Text style={priceSub}>
          {quantity} {unit}
        </Text>
      </Section>

      <Section>
        <Text style={p}>
          Los próximos pasos son entre ustedes dos:
        </Text>
        <Text style={li}>· Confirma plazos y condiciones de entrega</Text>
        <Text style={li}>· Coordina facturación y pago según tu política</Text>
        <Text style={li}>· Usa el chat del marketplace para seguimiento</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
        <Button href={url} style={btn}>
          Ver detalle de la venta →
        </Button>
      </Section>
    </EmailLayout>
  )
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

const li = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 4px 8px',
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

const btn = {
  backgroundColor: '#1B2A6B',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  textDecoration: 'none',
}
