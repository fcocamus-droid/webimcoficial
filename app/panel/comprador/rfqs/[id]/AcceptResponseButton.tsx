'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AcceptResponseButton({
  rfqId,
  responseId,
  sellerName,
}: {
  rfqId: string
  responseId: string
  sellerName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onAccept = async () => {
    if (
      !confirm(
        `¿Aceptar la cotización de "${sellerName}"?\n\n` +
          `Esto cerrará la RFQ y notificará al proveedor por email. Las ` +
          `otras cotizaciones recibidas se marcarán como rechazadas.`
      )
    )
      return
    setLoading(true)
    try {
      const res = await fetch(`/api/buyer/rfqs/${rfqId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'No pudimos aceptar la cotización')
      }
    } catch {
      alert('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onAccept}
      disabled={loading}
      className="bg-verified-500 hover:bg-verified-600 text-white font-semibold text-sm px-4 py-2 rounded-lg disabled:opacity-60 flex items-center gap-2"
    >
      {loading ? 'Procesando…' : '🤝 Aceptar esta cotización'}
    </button>
  )
}
