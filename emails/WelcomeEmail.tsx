import { Button, Heading, Section, Text } from '@react-email/components'
import EmailLayout from './Layout'

export default function WelcomeEmail({
  name,
  appUrl,
  role,
}: {
  name: string
  appUrl: string
  role: 'SELLER' | 'BUYER'
}) {
  const isSeller = role === 'SELLER'
  const panelUrl = `${appUrl}/panel/${isSeller ? 'vendedor' : 'comprador'}`

  return (
    <EmailLayout
      preview={
        isSeller
          ? 'Bienvenido al marketplace B2B industrial de Chile'
          : 'Empieza a cotizar con fabricantes verificados'
      }
    >
      <Section>
        <Heading style={h1}>¡Bienvenido, {name}!</Heading>
        <Text style={p}>
          Tu cuenta en <strong>IMC Industriales</strong> ya está activa. Somos
          el marketplace B2B que conecta fabricantes e importadores chilenos
          con compradores empresariales.
        </Text>

        {isSeller ? (
          <>
            <Text style={p}>Como fabricante / importador puedes:</Text>
            <Text style={li}>· Publicar tu catálogo con fotos y precios</Text>
            <Text style={li}>· Recibir solicitudes de cotización (RFQ)</Text>
            <Text style={li}>· Conversar directamente con compradores</Text>
            <Text style={li}>· Verificar tu empresa con certificaciones</Text>
          </>
        ) : (
          <>
            <Text style={p}>Como comprador empresarial puedes:</Text>
            <Text style={li}>· Buscar productos por categoría</Text>
            <Text style={li}>· Enviar RFQs a uno o varios proveedores</Text>
            <Text style={li}>· Comparar precios, plazos y condiciones</Text>
            <Text style={li}>· Guardar favoritos para compra recurrente</Text>
          </>
        )}
      </Section>

      <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
        <Button href={panelUrl} style={btn}>
          Entrar a mi panel
        </Button>
      </Section>
    </EmailLayout>
  )
}

const h1 = {
  color: '#1B2A6B',
  fontSize: '24px',
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

const btn = {
  backgroundColor: '#f59e0b',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 24px',
  textDecoration: 'none',
}
