/**
 * IMC Cargo email templates (HTML)
 *
 * All emails share a navy/orange branded shell with the IMC logo and
 * footer. Each template returns { subject, html, text }.
 */

const NAVY = '#1B2A6B'
const ORANGE = '#F47920'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://webimcoficial.vercel.app'

function shell({ title, preheader, children, ctaText, ctaUrl }: {
  title: string
  preheader: string
  children: string
  ctaText?: string
  ctaUrl?: string
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<span style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:32px 16px;background:#f1f5f9;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,${NAVY} 0%,#2D3F8E 100%);padding:24px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td>
              <div style="display:inline-block;width:40px;height:40px;background:${ORANGE};border-radius:10px;text-align:center;line-height:40px;color:#fff;font-weight:800;font-size:13px;vertical-align:middle;">IMC</div>
              <span style="display:inline-block;margin-left:12px;color:#fff;font-weight:700;font-size:18px;vertical-align:middle;">IMC Cargo</span>
            </td>
            <td align="right">
              <span style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:1px;text-transform:uppercase;">${title}</span>
            </td>
          </tr>
        </table>
      </td></tr>
      <!-- Content -->
      <tr><td style="padding:32px;color:#1e293b;font-size:15px;line-height:1.6;">${children}
        ${ctaText && ctaUrl ? `
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${ctaUrl}" style="display:inline-block;background:${ORANGE};color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:10px;font-size:15px;">${ctaText}</a>
        </div>` : ''}
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f8fafc;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 4px;color:#64748b;font-size:12px;">
          <strong style="color:${NAVY};">IMC Cargo</strong> · Freight Forwarder · Casilla Miami · Importadora
        </p>
        <p style="margin:0;color:#94a3b8;font-size:11px;">
          ${APP_URL} · ventas@imccargo.cl · +56 9 9001 4375
        </p>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:11px;">
      © ${new Date().getFullYear()} IMC Cargo. Recibiste este mensaje porque eres cliente o usuario registrado.
    </p>
  </td></tr>
</table>
</body>
</html>`
}

function textShell(title: string, content: string) {
  return `IMC Cargo · ${title}\n\n${content}\n\n—\nIMC Cargo · ventas@imccargo.cl · ${APP_URL}`
}

// ===== TEMPLATES =====

export function resetPasswordEmail({ name, resetUrl }: { name?: string | null; resetUrl: string }) {
  const greeting = name ? `Hola ${name},` : 'Hola,'
  return {
    subject: 'Restablece tu contraseña - IMC Cargo',
    html: shell({
      title: 'Restablecer contraseña',
      preheader: 'Define una nueva contraseña para tu cuenta IMC Cargo',
      ctaText: 'Restablecer contraseña',
      ctaUrl: resetUrl,
      children: `
        <h1 style="margin:0 0 16px;color:${NAVY};font-size:22px;">Restablece tu contraseña</h1>
        <p style="margin:0 0 12px;">${greeting}</p>
        <p style="margin:0 0 12px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva.</p>
        <p style="margin:16px 0 0;color:#64748b;font-size:13px;">Este enlace expira en <strong>24 horas</strong>. Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p style="margin:12px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">
          O copia este enlace: <span style="color:${ORANGE};">${resetUrl}</span>
        </p>
      `,
    }),
    text: textShell('Restablecer contraseña',
      `${greeting}\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n${resetUrl}\n\nEste enlace expira en 24 horas.`
    ),
  }
}

export function verifyEmailEmail({ name, verifyUrl }: { name?: string | null; verifyUrl: string }) {
  return {
    subject: 'Verifica tu correo - IMC Cargo',
    html: shell({
      title: 'Verificar correo',
      preheader: 'Confirma tu correo para activar tu cuenta IMC Cargo',
      ctaText: 'Verificar mi correo',
      ctaUrl: verifyUrl,
      children: `
        <h1 style="margin:0 0 16px;color:${NAVY};font-size:22px;">¡Bienvenido a IMC Cargo!</h1>
        <p style="margin:0 0 12px;">${name ? `Hola ${name},` : 'Hola,'}</p>
        <p style="margin:0 0 12px;">Estás a un click de activar tu cuenta. Confirma tu correo para empezar a cotizar fletes internacionales, usar tu casilla en Miami y más.</p>
      `,
    }),
    text: textShell('Verificar correo',
      `¡Bienvenido a IMC Cargo!\n\nConfirma tu correo:\n${verifyUrl}`
    ),
  }
}

export function preAlertReceivedEmail({
  clientName,
  preAlertCode,
  packageCode,
  description,
  whr,
  weight,
}: {
  clientName?: string | null
  preAlertCode: string
  packageCode: string
  description: string
  whr?: string | null
  weight?: number | null
}) {
  return {
    subject: `📦 Paquete ${packageCode} recibido en Miami - IMC Cargo`,
    html: shell({
      title: 'Paquete recibido',
      preheader: `Tu paquete ${packageCode} llegó a nuestra bodega Miami`,
      ctaText: 'Ver mi paquete',
      ctaUrl: `${APP_URL}/box/historial`,
      children: `
        <h1 style="margin:0 0 16px;color:${NAVY};font-size:22px;">📦 Tu paquete llegó a Miami</h1>
        <p style="margin:0 0 16px;">${clientName ? `Hola ${clientName},` : 'Hola,'}</p>
        <p style="margin:0 0 16px;">Recibimos tu paquete asociado a la pre-alerta <strong style="color:${ORANGE};">${preAlertCode}</strong>:</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Código IMC</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:700;">${packageCode}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Descripción</td><td style="padding:6px 0;text-align:right;">${description}</td></tr>
          ${whr ? `<tr><td style="padding:6px 0;color:#64748b;font-size:12px;">WHR</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${whr}</td></tr>` : ''}
          ${weight ? `<tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Peso</td><td style="padding:6px 0;text-align:right;">${weight.toFixed(2)} lb</td></tr>` : ''}
        </table>
        <p style="margin:0;color:#64748b;font-size:14px;">Está en bodega esperando consolidación con el próximo embarque.</p>
      `,
    }),
    text: textShell('Paquete recibido en Miami',
      `Tu paquete ${packageCode} (pre-alerta ${preAlertCode}) llegó a Miami.\nDescripción: ${description}${whr ? `\nWHR: ${whr}` : ''}\n\nVer en ${APP_URL}/box/historial`
    ),
  }
}

export function operationStageEmail({
  clientName,
  operationCode,
  quoteNumber,
  newStage,
  description,
}: {
  clientName?: string | null
  operationCode: string
  quoteNumber: string
  newStage: 'PENDING' | 'IN_ORIGIN' | 'IN_TRANSIT' | 'AT_DESTINATION' | 'DELIVERED'
  description?: string
}) {
  const STAGE_INFO = {
    PENDING: { emoji: '🟠', label: 'Pendiente de activación', msg: 'Tu operación fue creada y está pendiente de activación.' },
    IN_ORIGIN: { emoji: '🔴', label: 'En origen', msg: 'Tu carga está siendo procesada en el puerto de origen.' },
    IN_TRANSIT: { emoji: '🔵', label: 'En tránsito', msg: 'Tu carga ya está en camino hacia Chile.' },
    AT_DESTINATION: { emoji: '🟣', label: 'En destino', msg: 'Tu carga llegó a Chile y está en proceso de aduana.' },
    DELIVERED: { emoji: '🟢', label: 'Entregada', msg: '¡Tu carga fue entregada exitosamente!' },
  }
  const info = STAGE_INFO[newStage]
  return {
    subject: `${info.emoji} Operación ${operationCode}: ${info.label}`,
    html: shell({
      title: `Etapa: ${info.label}`,
      preheader: info.msg,
      ctaText: 'Ver detalle de operación',
      ctaUrl: `${APP_URL}/operaciones`,
      children: `
        <h1 style="margin:0 0 16px;color:${NAVY};font-size:22px;">${info.emoji} ${info.label}</h1>
        <p style="margin:0 0 16px;">${clientName ? `Hola ${clientName},` : 'Hola,'}</p>
        <p style="margin:0 0 16px;">${info.msg}</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Operación</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:700;color:${NAVY};">${operationCode}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Cotización</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${quoteNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Nueva etapa</td><td style="padding:6px 0;text-align:right;font-weight:700;color:${ORANGE};">${info.label}</td></tr>
        </table>
        ${description ? `<p style="margin:0;color:#475569;font-size:14px;font-style:italic;">"${description}"</p>` : ''}
      `,
    }),
    text: textShell(`Operación ${operationCode}: ${info.label}`,
      `${info.msg}\n\nOperación: ${operationCode}\nCotización: ${quoteNumber}\nNueva etapa: ${info.label}\n\nVer en ${APP_URL}/operaciones`
    ),
  }
}

export function quoteSentEmail({
  clientName,
  quoteNumber,
  totalUSD,
  validUntil,
  quoteId,
}: {
  clientName?: string | null
  quoteNumber: string
  totalUSD: number
  validUntil: Date | string
  quoteId: string
}) {
  return {
    subject: `Tu cotización ${quoteNumber} está lista - IMC Cargo`,
    html: shell({
      title: 'Cotización lista',
      preheader: `Cotización ${quoteNumber} por USD ${totalUSD.toLocaleString('en-US')}`,
      ctaText: 'Ver y activar cotización',
      ctaUrl: `${APP_URL}/mis-cotizaciones/${quoteId}`,
      children: `
        <h1 style="margin:0 0 16px;color:${NAVY};font-size:22px;">📋 Tu cotización está lista</h1>
        <p style="margin:0 0 16px;">${clientName ? `Hola ${clientName},` : 'Hola,'}</p>
        <p style="margin:0 0 16px;">Hemos preparado tu cotización de flete internacional.</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0;">
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Número</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:700;color:${NAVY};">${quoteNumber}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Total</td><td style="padding:6px 0;text-align:right;font-weight:700;color:${ORANGE};font-size:18px;">USD $${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:12px;">Válida hasta</td><td style="padding:6px 0;text-align:right;">${new Date(validUntil).toLocaleDateString('es-CL')}</td></tr>
        </table>
        <p style="margin:0;color:#64748b;font-size:14px;">Para activar la operación y comenzar el seguimiento, haz clic en el botón.</p>
      `,
    }),
    text: textShell('Cotización lista',
      `Tu cotización ${quoteNumber} por USD ${totalUSD} está lista.\nVer y activar: ${APP_URL}/mis-cotizaciones/${quoteId}`
    ),
  }
}
