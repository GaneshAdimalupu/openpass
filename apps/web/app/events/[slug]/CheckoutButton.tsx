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
        className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-[#85adff] to-[#0070eb] text-[#002c65] font-black font-headline text-lg rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(133,173,255,0.3)] shadow-[#0070eb]/20 flex items-center justify-center gap-3"
      >
        <span>Secure Your Spot</span>
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
