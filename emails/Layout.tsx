// emails/Layout.tsx — shell base para todos los emails transaccionales.
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export default function EmailLayout({
  preview,
  children,
}: {
  preview: string
  children: React.ReactNode
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Logo + tagline */}
          <Section style={brand}>
            <Text style={brandText}>IMC Industriales</Text>
            <Text style={brandTag}>Marketplace B2B · Chile</Text>
          </Section>

          {children}

          <Hr style={divider} />

          <Section>
            <Text style={footer}>
              Este es un email automático de IMC Industriales. Si tienes dudas,
              respóndenos directamente a este correo.
            </Text>
            <Text style={footerSmall}>
              © {new Date().getFullYear()} IMC Industriales · Santiago, Chile
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f1f5f9',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: '32px 0',
}

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '32px',
}

const brand = {
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: '20px',
  marginBottom: '24px',
}

const brandText = {
  color: '#1B2A6B',
  fontSize: '20px',
  fontWeight: '700' as const,
  margin: 0,
}

const brandTag = {
  color: '#64748b',
  fontSize: '11px',
  letterSpacing: '0.06em',
  margin: '2px 0 0',
  textTransform: 'uppercase' as const,
}

const divider = {
  borderTop: '1px solid #e2e8f0',
  margin: '28px 0 16px',
}

const footer = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 8px',
}

const footerSmall = {
  color: '#94a3b8',
  fontSize: '11px',
  margin: 0,
}
