// Email al usuario que solicitó restablecer su contraseña.
import { Button, Heading, Section, Text } from '@react-email/components'
import EmailLayout from './Layout'

export default function ResetPasswordEmail({
  appUrl,
  name,
  token,
}: {
  appUrl: string
  name: string
  token: string
}) {
  const url = `${appUrl}/recuperar/${token}`
  return (
    <EmailLayout preview="Restablece tu contraseña en IMC Industriales">
      <Section>
        <Text style={tag}>🔑 Restablecer contraseña</Text>
        <Heading style={h1}>Hola {name}</Heading>
        <Text style={p}>
          Recibimos una solicitud para restablecer la contraseña de tu cuenta
          en IMC Industriales. Haz click en el botón para crear una nueva.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
        <Button href={url} style={btn}>
          Crear nueva contraseña →
        </Button>
      </Section>

      <Section>
        <Text style={small}>
          O copia este link en tu navegador:
          <br />
          <span style={mono}>{url}</span>
        </Text>
        <Text style={tipText}>
          ⏱ Este link expira en 1 hora. Si no fuiste tú quien solicitó el
          cambio, ignora este email y tu contraseña seguirá siendo la misma.
        </Text>
      </Section>
    </EmailLayout>
  )
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

const btn = {
  backgroundColor: '#f59e0b',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  textDecoration: 'none',
}

const small = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 12px',
}

const mono = {
  fontFamily: 'monospace',
  fontSize: '11px',
  color: '#1B2A6B',
  wordBreak: 'break-all' as const,
}

const tipText = {
  color: '#64748b',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: '8px 0 0',
}
