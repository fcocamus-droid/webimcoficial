// Email al SELLER cuando recibe una reseña de un buyer.
import { Button, Heading, Section, Text } from '@react-email/components'
import EmailLayout from './Layout'

export default function NewReviewEmail({
  appUrl,
  sellerName,
  buyerName,
  rfqNumber,
  rfqTitle,
  rating,
  comment,
}: {
  appUrl: string
  sellerName: string
  buyerName: string
  rfqNumber: string
  rfqTitle: string
  rating: number
  comment: string | null
}) {
  const url = `${appUrl}/panel/vendedor/resenas`
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)

  return (
    <EmailLayout preview={`Recibiste una reseña ${rating}/5 de ${buyerName}`}>
      <Section>
        <Text style={tag}>⭐ Nueva reseña · {rfqNumber}</Text>
        <Heading style={h1}>{sellerName}, recibiste una reseña</Heading>
        <Text style={p}>
          <strong>{buyerName}</strong> reseñó tu servicio en la venta{' '}
          <strong>{rfqTitle}</strong>.
        </Text>
      </Section>

      <Section style={card}>
        <Text style={starsStyle}>{stars}</Text>
        <Text style={ratingText}>{rating} de 5</Text>
        {comment && (
          <Text style={comm}>{`"${truncate(comment, 400)}"`}</Text>
        )}
      </Section>

      <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
        <Button href={url} style={btn}>
          Ver mis reseñas →
        </Button>
      </Section>

      <Text style={tipText}>
        💡 Las reseñas se muestran en tu perfil público y aumentan la
        confianza de futuros compradores.
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

const card = {
  backgroundColor: '#fffbeb',
  border: '2px solid #f59e0b',
  borderRadius: '10px',
  padding: '18px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const starsStyle = {
  color: '#f59e0b',
  fontSize: '28px',
  letterSpacing: '4px',
  margin: '0 0 4px',
}

const ratingText = {
  color: '#1B2A6B',
  fontSize: '14px',
  fontWeight: '700' as const,
  margin: '0 0 12px',
}

const comm = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '20px',
  fontStyle: 'italic' as const,
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

const tipText = {
  color: '#64748b',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: '12px 0 0',
}
