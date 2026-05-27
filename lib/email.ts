// lib/email.ts — wrapper de Resend para envío de emails transaccionales.
// Si RESEND_API_KEY no está configurada, los envíos se loguean en consola y
// el sistema continúa funcionando (no bloquea endpoints).

import { Resend } from 'resend'
import { render } from '@react-email/components'
import type { ReactElement } from 'react'

const DEFAULT_FROM = 'IMC Industriales <onboarding@resend.dev>'

let _resend: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (_resend) return _resend
  _resend = new Resend(key)
  return _resend
}

export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://webimcoficial.vercel.app'
  )
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  react?: ReactElement
  html?: string
  text?: string
  replyTo?: string
}

export async function sendEmail(input: SendEmailInput): Promise<{
  ok: boolean
  id?: string
  skipped?: boolean
  error?: string
}> {
  const resend = getResend()
  const from = process.env.RESEND_FROM || DEFAULT_FROM

  if (!resend) {
    const recipients = Array.isArray(input.to) ? input.to.join(', ') : input.to
    console.log(`[email:skipped] "${input.subject}" → ${recipients}`)
    return { ok: true, skipped: true }
  }

  try {
    let html = input.html
    if (input.react && !html) {
      html = await render(input.react)
    }

    const { data, error } = await resend.emails.send({
      from,
      to: input.to as any,
      subject: input.subject,
      html: html || '',
      text: input.text,
      replyTo: input.replyTo,
    } as any)

    if (error) {
      console.error('[email:error]', input.subject, error)
      return { ok: false, error: String(error.message || error) }
    }
    return { ok: true, id: data?.id }
  } catch (e: any) {
    console.error('[email:exception]', input.subject, e?.message || e)
    return { ok: false, error: e?.message || 'unknown' }
  }
}

/**
 * Envía un email sin bloquear el flujo principal. Cualquier error queda en logs.
 */
export function sendEmailAsync(input: SendEmailInput): void {
  sendEmail(input).catch((e) => {
    console.error('[email:async] failed', input.subject, e)
  })
}
