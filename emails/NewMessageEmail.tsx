// Email al destinatario cuando alguien le envía un mensaje en una RFQ.
import { Button, Heading, Section, Text } from '@react-email/components'
import EmailLayout from './Layout'

export default function NewMessageEmail({
  appUrl,
  rfqId,
  rfqNumber,
  rfqTitle,
  fromName,
  body,
}: {
  appUrl: string
  rfqId: string
  rfqNumber: string
  rfqTitle: string
  fromName: string
  body: string
}) {
  const url = `${appUrl}/panel/mensajes?rfq=${rfqId}`
  return (
    <EmailLayout preview={`${fromName} te escribió sobre ${rfqNumber}`}>
      <Section>
        <Text style={tag}>💬 Nuevo mensaje · {rfqNumber}</Text>
        <Heading style={h1}>{fromName} te escribió</Heading>
        <Text style={p}>
          Sobre la cotización <strong>{rfqTitle}</strong>:
        </Text>
      </Section>

      <Section>
        <Text style={quote}>{truncate(body, 500)}</Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
        <Button href={url} style={btn}>
          Responder mensaje →
        </Button>
      </Section>

      <Text style={tipText}>
        💡 Responde rápido. Las conversaciones activas suelen cerrar más
        negocios.
      </Text>
    </EmailLayout>
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
