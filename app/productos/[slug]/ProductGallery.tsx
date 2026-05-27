'use client'

import { useState } from 'react'

type Image = { id: string; url: string; alt: string }

export default function ProductGallery({
  images,
  title,
}: {
  images: Image[]
  title: string
}) {
  const [active, setActive] = useState(0)
  if (images.length === 0) {
    return (
      <div className="aspect-square bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 text-6xl">
        📦
      </div>
    )
  }
  const current = images[active] ?? images[0]
  return (
    <div>
      <div className="aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt || title}
          className="absolute inset-0 w-full h-full object-contain p-4"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActive(idx)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                idx === active
                  ? 'border-navy-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
