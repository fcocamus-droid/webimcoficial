'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

type Thread = {
  rfqId: string
  rfqNumber: string
  rfqTitle: string
  rfqStatus: string
  otherUserId: string
  otherUserName: string | null
  otherUserAvatarUrl: string | null
  lastMessage: string
  lastFromMe: boolean
  lastAt: string
  unreadCount: number
}

type Message = {
  id: string
  rfqId: string | null
  fromUserId: string
  toUserId: string
  body: string
  readAt: string | null
  createdAt: string
  fromUser: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
  }
}

type ThreadDetail = {
  rfq: {
    id: string
    number: string
    title: string
    status: string
    product: { slug: string; title: string } | null
  }
  other: {
    id: string
    name: string | null
    email: string
    avatarUrl: string | null
    role: string
  } | null
  otherCompany: {
    razonSocial: string
    slug: string
    logoUrl: string | null
    verified: boolean
  } | null
  messages: Message[]
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Abierta',
  RESPONDED: 'Con respuestas',
  CLOSED: 'Cerrada',
  CANCELLED: 'Cancelada',
}

export default function MensajesClient({
  currentUserId,
  initialRfqId,
  initialOtherUserId,
}: {
  currentUserId: string
  initialRfqId?: string
  initialOtherUserId?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [active, setActive] = useState<{ rfqId: string; with: string } | null>(
    initialRfqId && initialOtherUserId
      ? { rfqId: initialRfqId, with: initialOtherUserId }
      : null
  )
  const [detail, setDetail] = useState<ThreadDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [composing, setComposing] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cargar lista de hilos
  const loadThreads = async () => {
    setLoadingThreads(true)
    try {
      const r = await fetch('/api/messages/threads')
      const j = await r.json()
      setThreads(j.threads || [])
      // Si no hay activo y hay hilos, abrir el primero
      if (!active && j.threads?.length > 0) {
        const first = j.threads[0]
        setActive({ rfqId: first.rfqId, with: first.otherUserId })
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingThreads(false)
    }
  }

  useEffect(() => {
    loadThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cargar detalle del hilo activo
  useEffect(() => {
    if (!active) {
      setDetail(null)
      return
    }
    setLoadingDetail(true)
    fetch(
      `/api/messages/threads/${active.rfqId}?with=${active.with}`
    )
      .then((r) => r.json())
      .then((j) => {
        if (j.error) {
          setDetail(null)
          return
        }
        setDetail(j)
        // Refrescar contador de unread en sidebar
        setThreads((arr) =>
          arr.map((t) =>
            t.rfqId === active.rfqId && t.otherUserId === active.with
              ? { ...t, unreadCount: 0 }
              : t
          )
        )
      })
      .finally(() => setLoadingDetail(false))
  }, [active?.rfqId, active?.with])

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [detail?.messages?.length])

  // Sincronizar query params con el hilo activo
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || '')
    if (active) {
      sp.set('rfq', active.rfqId)
      sp.set('with', active.with)
    } else {
      sp.delete('rfq')
      sp.delete('with')
    }
    const qs = sp.toString()
    router.replace(`/panel/mensajes${qs ? `?${qs}` : ''}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.rfqId, active?.with])

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!active || !composing.trim()) return
    setSending(true)
    setSendError(null)
    try {
      const r = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfqId: active.rfqId,
          toUserId: active.with,
          body: composing.trim(),
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setSendError(j.error || 'Error al enviar')
        return
      }
      // Append optimistic
      setDetail((d) =>
        d
          ? {
              ...d,
              messages: [...d.messages, j.message],
            }
          : d
      )
      setComposing('')
      // Refrescar lista de hilos para actualizar último mensaje
      loadThreads()
    } catch {
      setSendError('Error de red')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden grid md:grid-cols-[320px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
      {/* Sidebar */}
      <aside className="border-r border-slate-200 overflow-y-auto">
        {loadingThreads ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Cargando hilos…
          </div>
        ) : threads.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Sin conversaciones
            </p>
            <p className="text-xs text-slate-600">
              Apenas envíes o recibas una cotización, aquí aparecerán los
              mensajes con la contraparte.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {threads.map((t) => {
              const isActive =
                active?.rfqId === t.rfqId && active?.with === t.otherUserId
              return (
                <li key={`${t.rfqId}-${t.otherUserId}`}>
                  <button
                    onClick={() =>
                      setActive({ rfqId: t.rfqId, with: t.otherUserId })
                    }
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                      isActive ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {t.otherUserAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.otherUserAvatarUrl}
                          alt={t.otherUserName ?? ''}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-navy-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {(t.otherUserName || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {t.otherUserName || 'Sin nombre'}
                          </p>
                          {t.unreadCount > 0 && (
                            <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                              {t.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-500 mb-1 truncate">
                          {t.rfqNumber} · {t.rfqTitle}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {t.lastFromMe ? 'Tú: ' : ''}
                          {t.lastMessage}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatRelative(t.lastAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      {/* Conversación */}
      <section className="flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <div className="text-5xl mb-3">💬</div>
              <p className="text-slate-600 max-w-sm">
                Selecciona una conversación de la lista para verla aquí.
              </p>
            </div>
          </div>
        ) : loadingDetail ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            Cargando conversación…
          </div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            No se pudo cargar.
          </div>
        ) : (
          <>
            {/* Header del hilo */}
            <header className="border-b border-slate-200 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {detail.otherCompany?.logoUrl || detail.other?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      detail.otherCompany?.logoUrl ||
                      detail.other?.avatarUrl ||
                      ''
                    }
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-navy-600 text-white text-sm font-bold flex items-center justify-center">
                    {(detail.otherCompany?.razonSocial ||
                      detail.other?.name ||
                      '?')
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900 truncate">
                      {detail.otherCompany?.razonSocial ||
                        detail.other?.name ||
                        'Sin nombre'}
                    </p>
                    {detail.otherCompany?.verified && (
                      <span className="text-xs font-semibold text-verified-600">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono truncate">
                    {detail.rfq.number} · {detail.rfq.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={
                    detail.rfq.id
                      ? isBuyer(currentUserId, detail)
                        ? `/panel/comprador/rfqs/${detail.rfq.id}`
                        : `/panel/vendedor/solicitudes/${detail.rfq.id}`
                      : '#'
                  }
                  className="text-xs font-medium text-amber-600 hover:underline"
                >
                  Ver RFQ →
                </Link>
              </div>
            </header>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {detail.messages.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-10">
                  Aún no hay mensajes. Sé el primero en escribir.
                </p>
              ) : (
                detail.messages.map((m) => {
                  const mine = m.fromUserId === currentUserId
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          mine
                            ? 'bg-navy-600 text-white rounded-br-md'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-line text-sm leading-relaxed">
                          {m.body}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${mine ? 'text-blue-200' : 'text-slate-400'}`}
                        >
                          {formatTime(m.createdAt)}
                          {mine && m.readAt && <span> · leído</span>}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form
              onSubmit={onSend}
              className="border-t border-slate-200 p-3 bg-white"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={composing}
                  onChange={(e) => setComposing(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onSend(e as any)
                    }
                  }}
                  placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter salto de línea)"
                  rows={2}
                  className="input-base flex-1 resize-none"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !composing.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
              {sendError && (
                <p className="error-text mt-2">{sendError}</p>
              )}
            </form>
          </>
        )}
      </section>
    </div>
  )
}

function isBuyer(currentUserId: string, detail: ThreadDetail): boolean {
  // Si soy el destinatario y el otro es seller, soy buyer. Heurística simple:
  // si el rol de la contraparte es SELLER, soy BUYER.
  return detail.other?.role === 'SELLER'
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const days = Math.floor(h / 24)
  if (days < 7) return `hace ${days} d`
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}
