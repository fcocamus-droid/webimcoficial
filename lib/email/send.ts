/**
 * Central email sending function with graceful Resend fallback.
 *
 * When RESEND_API_KEY is set, sends via Resend.
 * When not set (dev or pending config), logs the email to console.
 *
 * Returns { sent: boolean, mode: 'resend' | 'dev' | 'error', error? }
 */

type SendResult = { sent: boolean; mode: 'resend' | 'dev' | 'error'; error?: string }

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = from || process.env.RESEND_FROM || process.env.EMAIL_FROM || 'IMC Cargo <noreply@imccargo.cl>'

  if (!apiKey) {
    console.log(`[EMAIL · DEV MODE] to=${Array.isArray(to) ? to.join(',') : to} subject="${subject}"`)
    console.log(`[EMAIL · DEV MODE] No RESEND_API_KEY set. Email NOT sent.`)
    return { sent: false, mode: 'dev', error: 'RESEND_API_KEY not configured' }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    })

    if ((result as any).error) {
      console.error('[EMAIL · RESEND ERROR]', (result as any).error)
      return { sent: false, mode: 'error', error: JSON.stringify((result as any).error) }
    }

    return { sent: true, mode: 'resend' }
  } catch (e: any) {
    console.error('[EMAIL · EXCEPTION]', e?.message || e)
    return { sent: false, mode: 'error', error: e?.message || String(e) }
  }
}
