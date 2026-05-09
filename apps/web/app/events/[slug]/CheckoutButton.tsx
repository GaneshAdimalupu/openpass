'use client'

import { useState } from 'react'
import { CheckoutModal } from '@openpass/ui'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CheckoutButton({ event }: { event: any }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-gradient-to-r from-[#85adff] to-[#0070eb] py-5 rounded-2xl text-[#002c65] font-bold text-lg shadow-[0_0_20px_rgba(0,112,235,0.4)] active:scale-95 transition-all duration-200 uppercase tracking-tight font-headline flex items-center justify-center gap-3"
      >
        <span>RSVP NOW</span>
        <span className="material-symbols-outlined text-xl">arrow_forward</span>
      </button>

      {open && (
        <CheckoutModal
          eventId={event.id}
          title={event.title}
          formSchema={event.formSchema || []}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
