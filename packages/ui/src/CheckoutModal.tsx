'use client'

import { useState } from 'react'
import { authClient } from '@openpass/auth/client'
import { apiFetch } from '@openpass/core'
import { useRouter } from 'next/navigation'

interface AttendeeField {
  id: string
  label: string
  type: 'text' | 'email' | 'select' | 'checkbox'
  required: boolean
  options?: string
}

export function CheckoutModal({
  eventId,
  formSchema,
  onClose,
  title,
}: {
  eventId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formSchema: any
  onClose: () => void
  title: string
}) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const schema: AttendeeField[] = Array.isArray(formSchema) ? formSchema : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateForm = (id: string, val: any) => {
    setFormData((prev) => ({ ...prev, [id]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/registrations', {
        method: 'POST',
        body: JSON.stringify({ eventId, formData }),
      })
      setQrCode(data.qrImage)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isPending) return null

  if (!session) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0e0e0e]/90 flex items-center justify-center p-4 backdrop-blur-md">
        <div className="bg-[#1a1919] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <span className="material-symbols-outlined text-4xl text-[#ff716c] mb-4">lock</span>
          <h2 className="text-xl font-headline font-bold text-white mb-2">Restricted Access</h2>
          <p className="text-[#adaaaa] font-body text-sm mb-6">
            You must create a free OpenPass account to attend events.
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white font-headline text-sm hover:bg-[#201f1f] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#85adff] to-[#0070eb] text-[#002c65] font-bold font-headline text-sm hover:scale-105 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0e0e0e]/80 flex flex-col items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#1a1919] border border-white/10 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden my-auto relative shrink-0">
        {/* Header */}
        <div className="bg-[#201f1f] px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-white text-lg">Event Registration</h2>
            <p className="font-body text-[#adaaaa] text-xs mt-1">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#85adff] hover:text-white transition-colors bg-[#85adff]/10 p-2 rounded-full"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {qrCode ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#85adff]/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-[#85adff]">task_alt</span>
              </div>
              <h3 className="text-3xl font-headline font-black text-white mb-2 tracking-tighter">
                Your Ticket is Ready
              </h3>
              <p className="text-[#adaaaa] font-body text-sm mb-6">
                Present this QR code at the entrance.
              </p>

              <div className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto border-4 border-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="Ticket QR" className="w-56 h-56 object-contain" />
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-4 bg-[#262626] text-white font-headline text-sm font-bold rounded-xl hover:bg-[#2c2c2c] transition-all"
                >
                  Go to Tickets
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {schema.length === 0 && (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-[#85adff]/50 mb-3">
                    airplane_ticket
                  </span>
                  <p className="text-white font-headline font-bold">Fast Checkout</p>
                  <p className="text-[#adaaaa] text-xs font-body max-w-xs mx-auto mt-2">
                    The organizer has not strictly required any custom forms. Confirm your spot
                    instantly.
                  </p>
                </div>
              )}

              {schema.map((field) => (
                <div key={field.id} className="space-y-2 text-left">
                  <label className="block text-xs font-bold tracking-widest text-[#85adff] uppercase font-headline">
                    {field.label} {field.required && <span className="text-[#ff716c]">*</span>}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      required={field.required}
                      onChange={(e) => updateForm(field.id, e.target.value)}
                      className="w-full bg-[#0e0e0e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#494847] focus:ring-1 focus:ring-[#85adff]"
                    />
                  )}

                  {field.type === 'email' && (
                    <input
                      type="email"
                      required={field.required}
                      onChange={(e) => updateForm(field.id, e.target.value)}
                      className="w-full bg-[#0e0e0e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-[#494847] focus:ring-1 focus:ring-[#85adff]"
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      required={field.required}
                      onChange={(e) => updateForm(field.id, e.target.value)}
                      className="w-full bg-[#0e0e0e] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[#85adff]"
                    >
                      <option value="">Select an option</option>
                      {field.options?.split(',').map((opt) => (
                        <option key={opt.trim()} value={opt.trim()}>
                          {opt.trim()}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-3 bg-[#0e0e0e] p-3 rounded-xl border border-white/10 text-left">
                      <input
                        type="checkbox"
                        required={field.required}
                        onChange={(e) => updateForm(field.id, e.target.checked)}
                        className="w-5 h-5 rounded border-white/20 text-[#0070eb] focus:ring-[#0070eb] focus:ring-offset-0 bg-[#262626]"
                      />
                      <span className="text-sm text-white font-body">Yes, I agree.</span>
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="bg-[#ff716c]/10 border border-[#ff716c]/20 rounded-xl p-3 flex items-start gap-3 text-left">
                  <span className="material-symbols-outlined text-[#ff716c] text-lg">error</span>
                  <p className="text-[#ff716c] text-sm font-body font-bold mt-0.5">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#85adff] to-[#0070eb] text-[#002c65] font-black font-headline text-sm rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  'Confirm Registration'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
