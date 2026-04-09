'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createEventAction } from '../../actions/event'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Location {
  lat: number
  lng: number
  address: string
}

interface AttendeeField {
  id: string
  label: string
  type: 'text' | 'email' | 'select' | 'checkbox'
  required: boolean
  options?: string
}

interface EventForm {
  // Step 1
  title: string
  category: string
  organization: string
  description: string
  // Step 2
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  isVirtual: boolean
  meetingLink: string
  venueSearch: string
  location: Location | null
  // Step 3
  capacity: string
  registrationDeadline: string
  requireApproval: boolean
  customFields: AttendeeField[]
  // Step 4
  websiteUrl: string
  twitterHandle: string
  tags: string
  bannerColor: string
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  type: string
  importance: number
}

// ─── Dynamic map (no SSR — Leaflet needs window) ────────────────────────────────

const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-2xl bg-[#131313] flex items-center justify-center border border-white/5">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-4xl text-[#85adff]/40 animate-pulse">
          map
        </span>
        <span className="text-sm text-[#adaaaa] font-body">Loading map…</span>
      </div>
    </div>
  ),
})

// ─── Constants ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Info', icon: 'edit' },
  { id: 2, label: 'Date & Venue', icon: 'location_on' },
  { id: 3, label: 'Attendee Experience', icon: 'confirmation_number' },
  { id: 4, label: 'Promotion', icon: 'campaign' },
  { id: 5, label: 'Review', icon: 'visibility' },
]

const CATEGORIES = [
  'Hackathon',
  'Workshop',
  'Meetup',
  'Conference',
  'Summit',
  'Webinar',
  'Bootcamp',
  'Social',
  'Other',
]

const DRAFT_KEY = 'openpass_event_draft'

// ─── Shared styles ──────────────────────────────────────────────────────────────

const inputCls = [
  'w-full bg-[#201f1f] border border-transparent',
  'focus:border-[#0070eb]/50 focus:ring-0 focus:outline-none',
  'rounded-xl py-4 px-5 text-white',
  'placeholder:text-[#494847] transition-all font-body text-sm',
].join(' ')

const labelCls =
  'block text-[10px] font-bold tracking-widest text-[#85adff] uppercase mb-2 font-headline'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 8)
}

function buildSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const [step, setStep] = useState(1)

  const defaultForm: EventForm = {
    title: '',
    category: 'Hackathon',
    organization: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
    isVirtual: false,
    meetingLink: '',
    venueSearch: '',
    location: null,
    capacity: '',
    registrationDeadline: '',
    requireApproval: false,
    customFields: [],
    websiteUrl: '',
    twitterHandle: '',
    tags: '',
    bannerColor: '#85adff',
  }

  const [form, setForm] = useState<EventForm>(defaultForm)
  const [draftSaved, setDraftSaved] = useState(false)
  const [draftTime, setDraftTime] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  // Search state
  const [venueQuery, setVenueQuery] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Custom field modal
  const [addingField, setAddingField] = useState(false)
  const [newField, setNewField] = useState<Omit<AttendeeField, 'id'>>({
    label: '',
    type: 'text',
    required: false,
    options: '',
  })

  // ── Load draft on mount ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setForm(parsed.form ?? defaultForm)
        setStep(parsed.step ?? 1)
        setDraftTime(parsed.savedAt ?? null)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Close search dropdown on outside click ──
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const update = useCallback(
    <K extends keyof EventForm>(key: K, val: EventForm[K]) =>
      setForm((f) => ({ ...f, [key]: val })),
    []
  )

  // ── Save draft ──
  const saveDraft = useCallback(() => {
    try {
      const savedAt = new Date().toLocaleTimeString()
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, savedAt }))
      setDraftTime(savedAt)
      setDraftSaved(true)
      setTimeout(() => setDraftSaved(false), 2000)
    } catch {
      /* ignore */
    }
  }, [form, step])

  // Auto-save every 30 s
  useEffect(() => {
    const t = setInterval(saveDraft, 30_000)
    return () => clearInterval(t)
  }, [saveDraft])

  // ── Geocode search (up to 8 results, broader query) ──
  const searchVenue = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          q
        )}&format=json&limit=8&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data: NominatimResult[] = await res.json()
      setSearchResults(data)
      setShowResults(true)
    } catch {
      setSearchResults([])
    } finally {
      setGeocoding(false)
    }
  }, [])

  // Debounce venue search as user types
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleVenueInput = (val: string) => {
    setVenueQuery(val)
    update('venueSearch', val)
    setShowResults(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length >= 3) {
      debounceRef.current = setTimeout(() => searchVenue(val), 500)
    } else {
      setSearchResults([])
    }
  }

  const selectResult = useCallback(
    (r: NominatimResult) => {
      const loc: Location = {
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        address: r.display_name,
      }
      update('location', loc)
      setVenueQuery(r.display_name)
      update('venueSearch', r.display_name)
      setShowResults(false)
      setSearchResults([])
    },
    [update]
  )

  const handleLocationSelect = useCallback(
    (loc: Location) => {
      update('location', loc)
      setVenueQuery(loc.address)
      update('venueSearch', loc.address)
      setShowResults(false)
    },
    [update]
  )

  // ── Add custom field ──
  const addCustomField = () => {
    if (!newField.label.trim()) return
    update('customFields', [...form.customFields, { ...newField, id: uid() }])
    setNewField({ label: '', type: 'text', required: false, options: '' })
    setAddingField(false)
  }

  const removeField = (id: string) =>
    update(
      'customFields',
      form.customFields.filter((f) => f.id !== id)
    )

  // ── Publish ──
  const handlePublish = async () => {
    if (!form.title.trim()) {
      setStep(1)
      return
    }
    setPublishing(true)
    setPublishError(null)
    try {
      await createEventAction({
        title: form.title,
        description: form.description,
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate,
        endTime: form.endTime,
        venue: form.isVirtual ? 'Virtual Event' : form.venueSearch || '',
        location: form.isVirtual ? null : form.location,
        category: form.category,
        organization: form.organization,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        registrationDeadline: form.registrationDeadline || null,
        requireApproval: form.requireApproval,
        formSchema: form.customFields,
        websiteUrl: form.websiteUrl || undefined,
        twitterHandle: form.twitterHandle || undefined,
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      })

      localStorage.removeItem(DRAFT_KEY)
      setPublished(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e?.message === 'NEXT_REDIRECT' || e?.digest?.startsWith('NEXT_REDIRECT')) {
        throw e
      }
      setPublishError(e instanceof Error ? e.message : 'Failed to publish. Try again.')
    } finally {
      setPublishing(false)
    }
  }

  // ── Validation per step ──
  const stepValid = () => {
    if (step === 1) return form.title.trim().length > 0
    if (step === 2) return form.startDate.length > 0 && (form.isVirtual || form.location !== null)
    return true
  }

  // ─── Published success screen ───────────────────────────────────────────────
  if (published) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-[#85adff]/20 flex items-center justify-center mx-auto">
            <span
              className="material-symbols-outlined text-5xl text-[#85adff]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-white">
            Event Live!
          </h1>
          <p className="text-[#adaaaa] font-body">
            <span className="text-white font-bold">{form.title}</span> has been published. Attendees
            can now register.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-[#201f1f] text-white rounded-xl font-bold font-headline text-sm hover:bg-[#262626] transition-all"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/events"
              className="px-6 py-3 bg-gradient-to-br from-[#85adff] to-[#0070eb] text-[#002c65] rounded-xl font-bold font-headline text-sm hover:scale-105 transition-all"
            >
              View Event
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white selection:bg-[#0070eb]/30">
      {/* ── Top Bar ── */}
      <header className="fixed top-0 w-full z-50 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-6 md:px-8">
        <Link href="/" className="text-xl font-black tracking-tighter text-white font-headline">
          OpenPass
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {['Events', 'Analytics', 'Settings', 'Help'].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-[#adaaaa] hover:text-white transition-colors font-headline text-sm"
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {draftTime && (
            <span className="hidden md:block text-[10px] text-[#494847] font-mono">
              Draft saved {draftTime}
            </span>
          )}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#85adff] to-[#0070eb] flex items-center justify-center text-[#002c65] font-black text-sm">
            J
          </div>
        </div>
      </header>

      {/* ── Side Nav ── */}
      <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-60 bg-[#0e0e0e] border-r border-white/5 flex-col z-40">
        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#85adff]/10 border border-[#85adff]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#85adff] text-lg">
                auto_fix_high
              </span>
            </div>
            <div>
              <p className="text-white font-black text-sm font-headline">Event Wizard</p>
              <p className="text-[#adaaaa] text-xs font-body">Step {step} of 5</p>
            </div>
          </div>
        </div>

        <nav className="flex-1">
          {STEPS.map((s) => {
            const active = s.id === step
            const done = s.id < step
            const locked = s.id > step
            return (
              <button
                key={s.id}
                onClick={() => !locked && setStep(s.id)}
                className={[
                  'w-full flex items-center gap-3 py-3.5 px-5 text-sm transition-all text-left',
                  active
                    ? 'bg-gradient-to-r from-[#85adff]/10 to-transparent text-[#85adff] border-r-2 border-[#0070eb]'
                    : done
                      ? 'text-[#adaaaa] hover:text-white hover:bg-white/3'
                      : locked
                        ? 'text-[#2c2c2c] cursor-not-allowed'
                        : '',
                ].join(' ')}
              >
                <span
                  className="material-symbols-outlined text-base shrink-0"
                  style={active || done ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {done ? 'check_circle' : s.icon}
                </span>
                <span className="font-headline font-semibold">{s.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-5 border-t border-white/5 space-y-2">
          <button
            onClick={saveDraft}
            className={[
              'w-full py-3 rounded-xl font-semibold text-sm font-headline transition-all flex items-center justify-center gap-2',
              draftSaved
                ? 'bg-[#85adff]/20 text-[#85adff]'
                : 'bg-[#262626] text-white hover:bg-[#2c2c2c]',
            ].join(' ')}
          >
            <span className="material-symbols-outlined text-base">
              {draftSaved ? 'check' : 'save'}
            </span>
            {draftSaved ? 'Saved!' : 'Save Draft'}
          </button>
          {draftTime && (
            <p className="text-[10px] text-[#494847] text-center font-mono">
              Last saved {draftTime}
            </p>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="lg:ml-60 pt-16 min-h-screen flex flex-col pb-28">
        {/* Page header */}
        <section className="px-6 md:px-12 pt-10 pb-6">
          <div className="max-w-6xl mx-auto">
            <h1
              className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter mb-6
              bg-gradient-to-r from-white to-[#adaaaa] bg-clip-text text-transparent"
            >
              Launch Your Movement
            </h1>
            <p className="text-[#adaaaa] text-base font-body mb-8">
              Every great open source project starts with a community gathering. Set up your free
              event in minutes.
            </p>

            {/* Stepper */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { n: 1, label: 'Basic Info' },
                { n: 2, label: 'Date & Venue' },
                { n: 3, label: 'Attendee Experience' },
              ].map((s, i, arr) => (
                <div key={s.n} className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => s.n <= step && setStep(s.n)}
                    className="flex items-center gap-2 group"
                  >
                    <div
                      className={[
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                        s.n < step
                          ? 'bg-[#85adff]/20 border border-[#85adff]/40'
                          : s.n === step
                            ? 'bg-[#85adff] ring-4 ring-[#85adff]/20'
                            : 'bg-[#201f1f] border border-white/5',
                      ].join(' ')}
                    >
                      {s.n < step ? (
                        <span className="material-symbols-outlined text-[#85adff] text-sm">
                          check
                        </span>
                      ) : (
                        <span className={s.n === step ? 'text-[#002c65]' : 'text-[#494847]'}>
                          {s.n}
                        </span>
                      )}
                    </div>
                    <span
                      className={[
                        'text-sm font-semibold font-headline transition-colors',
                        s.n === step ? 'text-white' : 'text-[#494847]',
                      ].join(' ')}
                    >
                      {s.label}
                    </span>
                  </button>
                  {i < arr.length - 1 && <div className="h-px w-8 bg-[#262626]" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form + Preview */}
        <section className="px-6 md:px-12 flex-1">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* ── LEFT: Steps ── */}
            <div className="lg:col-span-7 space-y-8">
              {/* ── STEP 1: Basic Info ── */}
              {step === 1 && (
                <div className="space-y-7">
                  <div>
                    <label className={labelCls}>Event Title *</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Kerala FOSS Hackathon 2025"
                      value={form.title}
                      onChange={(e) => update('title', e.target.value)}
                    />
                    {form.title && (
                      <p className="text-[10px] text-[#494847] mt-1.5 font-mono">
                        slug: {buildSlug(form.title)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Category</label>
                      <div className="relative">
                        <select
                          className={inputCls + ' appearance-none cursor-pointer pr-10'}
                          value={form.category}
                          onChange={(e) => update('category', e.target.value)}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c} className="bg-[#201f1f]">
                              {c}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#adaaaa] pointer-events-none text-lg">
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Organization</label>
                      <input
                        className={inputCls}
                        placeholder="e.g. FOSS United Kerala"
                        value={form.organization}
                        onChange={(e) => update('organization', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                      className={inputCls + ' resize-none leading-relaxed'}
                      rows={5}
                      placeholder="What's the goal of this gathering? Share the vision…"
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                    />
                    <p className="text-[10px] text-[#494847] mt-1.5 text-right font-mono">
                      {form.description.length} chars
                    </p>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Date & Venue ── */}
              {step === 2 && (
                <div className="space-y-8">
                  {/* Date & Time */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#85adff]">
                        calendar_today
                      </span>
                      <h2 className="font-headline text-base font-bold uppercase tracking-widest">
                        Date & Time
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {(
                        [
                          {
                            label: 'Start Date *',
                            key: 'startDate',
                            type: 'date',
                            icon: 'calendar_month',
                          },
                          { label: 'Start Time', key: 'startTime', type: 'time', icon: 'schedule' },
                          {
                            label: 'End Date',
                            key: 'endDate',
                            type: 'date',
                            icon: 'calendar_month',
                          },
                          { label: 'End Time', key: 'endTime', type: 'time', icon: 'schedule' },
                        ] as const
                      ).map(({ label, key, type, icon }) => (
                        <div key={key}>
                          <label className={labelCls}>{label}</label>
                          <div className="bg-[#262626] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:ring-1 focus-within:ring-[#0070eb]/40 transition-all group">
                            <input
                              type={type}
                              className="bg-transparent border-none focus:ring-0 focus:outline-none text-white w-full text-sm font-body [color-scheme:dark]"
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              value={(form as any)[key]}
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              onChange={(e) => update(key as any, e.target.value)}
                            />
                            <span className="material-symbols-outlined text-[#adaaaa] group-focus-within:text-[#85adff] transition-colors text-lg shrink-0">
                              {icon}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#85adff]">
                          location_on
                        </span>
                        <h2 className="font-headline text-base font-bold uppercase tracking-widest">
                          Venue
                        </h2>
                      </div>
                      {/* Virtual toggle */}
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <span className="text-xs font-bold text-[#adaaaa] uppercase tracking-widest font-headline">
                          Virtual
                        </span>
                        <div
                          role="switch"
                          aria-checked={form.isVirtual}
                          onClick={() => update('isVirtual', !form.isVirtual)}
                          className={[
                            'w-11 h-6 rounded-full relative transition-all duration-300 cursor-pointer',
                            form.isVirtual ? 'bg-[#0070eb]' : 'bg-[#262626]',
                          ].join(' ')}
                        >
                          <div
                            className={[
                              'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300',
                              form.isVirtual ? 'left-6' : 'left-1',
                            ].join(' ')}
                          />
                        </div>
                      </label>
                    </div>

                    {form.isVirtual ? (
                      <div className="space-y-4">
                        <div>
                          <label className={labelCls}>Meeting Link</label>
                          <input
                            className={inputCls}
                            type="url"
                            placeholder="https://meet.google.com/xxx-xxxx-xxx"
                            value={form.meetingLink}
                            onChange={(e) => update('meetingLink', e.target.value)}
                          />
                        </div>
                        <div className="h-36 rounded-2xl bg-[#131313] flex flex-col items-center justify-center gap-2 border border-dashed border-white/10">
                          <span className="material-symbols-outlined text-4xl text-[#85adff]/30">
                            videocam
                          </span>
                          <p className="text-[#494847] text-sm font-body">No physical venue</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Search with dropdown */}
                        <div ref={searchRef} className="relative z-50">
                          <div className="bg-[#262626] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:ring-1 focus-within:ring-[#0070eb]/40 transition-all">
                            <span className="material-symbols-outlined text-[#adaaaa] text-lg">
                              search
                            </span>
                            <input
                              className="bg-transparent border-none focus:ring-0 focus:outline-none text-white w-full text-sm font-body placeholder:text-[#494847]"
                              placeholder="Type a venue name, city, or address…"
                              value={venueQuery}
                              onChange={(e) => handleVenueInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') searchVenue(venueQuery)
                              }}
                              onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            />
                            {geocoding ? (
                              <span className="material-symbols-outlined text-[#85adff] text-lg animate-spin">
                                progress_activity
                              </span>
                            ) : (
                              <button
                                onClick={() => searchVenue(venueQuery)}
                                className="shrink-0 px-3 py-1 rounded-lg bg-[#85adff]/10 text-[#85adff] text-xs font-bold hover:bg-[#85adff]/20 transition-all font-headline"
                              >
                                Search
                              </button>
                            )}
                          </div>

                          {/* Dropdown results */}
                          {showResults && searchResults.length > 0 && (
                            <div className="absolute z-[9999] w-full mt-1.5 bg-[#1a1919] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/60">
                              {searchResults.map((r, i) => (
                                <button
                                  key={i}
                                  onClick={() => selectResult(r)}
                                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#262626] border-b border-white/5 last:border-0 font-body transition-colors flex items-start gap-3 group"
                                >
                                  <span className="material-symbols-outlined text-[#85adff]/50 group-hover:text-[#85adff] transition-colors text-base mt-0.5 shrink-0">
                                    location_on
                                  </span>
                                  <span className="line-clamp-2 leading-snug">
                                    {r.display_name}
                                  </span>
                                </button>
                              ))}
                              <div className="px-4 py-2 bg-[#131313] flex items-center gap-2">
                                <span className="text-[10px] text-[#494847] font-mono">
                                  Powered by OpenStreetMap
                                </span>
                              </div>
                            </div>
                          )}

                          {showResults &&
                            searchResults.length === 0 &&
                            !geocoding &&
                            venueQuery.length >= 3 && (
                              <div className="absolute z-[9999] w-full mt-1.5 bg-[#1a1919] border border-white/10 rounded-xl overflow-hidden">
                                <div className="px-4 py-4 text-sm text-[#adaaaa] font-body flex items-center gap-3">
                                  <span className="material-symbols-outlined text-[#494847] text-lg">
                                    search_off
                                  </span>
                                  No results for &quot;{venueQuery}&quot;. Try a different search.
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Map */}
                        <EventMap
                          location={form.location}
                          onLocationSelect={handleLocationSelect}
                        />

                        {/* Selected location chip */}
                        {form.location && (
                          <div className="bg-[#131313] rounded-xl p-4 border border-[#85adff]/20 flex items-start gap-3">
                            <span
                              className="material-symbols-outlined text-[#85adff] text-lg mt-0.5 shrink-0"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              location_on
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-[#85adff] uppercase tracking-widest mb-1 font-headline">
                                Selected Venue
                              </p>
                              <p className="text-sm text-white font-body leading-relaxed line-clamp-2">
                                {form.location.address}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-mono text-[#494847]">
                                  {form.location.lat.toFixed(6)}, {form.location.lng.toFixed(6)}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                update('location', null)
                                setVenueQuery('')
                              }}
                              className="text-[#494847] hover:text-white transition-colors shrink-0"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 3: Attendee Experience ── */}
              {step === 3 && (
                <div className="space-y-7">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>Max Capacity</label>
                      <input
                        className={inputCls}
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        value={form.capacity}
                        onChange={(e) => update('capacity', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Registration Deadline</label>
                      <div className="bg-[#262626] rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:ring-1 focus-within:ring-[#0070eb]/40 transition-all">
                        <input
                          type="date"
                          className="bg-transparent border-none focus:ring-0 focus:outline-none text-white w-full text-sm font-body [color-scheme:dark]"
                          value={form.registrationDeadline}
                          onChange={(e) => update('registrationDeadline', e.target.value)}
                        />
                        <span className="material-symbols-outlined text-[#adaaaa] text-lg shrink-0">
                          event_available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Require Approval toggle */}
                  <div className="flex items-center justify-between p-5 bg-[#201f1f] rounded-2xl">
                    <div>
                      <p className="font-bold text-white text-sm font-headline">Require Approval</p>
                      <p className="text-xs text-[#adaaaa] font-body mt-0.5">
                        Manually approve each registration before confirming
                      </p>
                    </div>
                    <div
                      role="switch"
                      aria-checked={form.requireApproval}
                      onClick={() => update('requireApproval', !form.requireApproval)}
                      className={[
                        'w-11 h-6 rounded-full relative transition-all duration-300 cursor-pointer shrink-0',
                        form.requireApproval ? 'bg-[#0070eb]' : 'bg-[#262626]',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300',
                          form.requireApproval ? 'left-6' : 'left-1',
                        ].join(' ')}
                      />
                    </div>
                  </div>

                  {/* Custom fields */}
                  <div className="space-y-3">
                    <label className={labelCls}>Custom Registration Questions</label>
                    {form.customFields.length > 0 && (
                      <div className="space-y-2">
                        {form.customFields.map((f) => (
                          <div
                            key={f.id}
                            className="flex items-center justify-between bg-[#201f1f] rounded-xl px-4 py-3 group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-[#85adff] text-base">
                                {f.type === 'checkbox'
                                  ? 'check_box'
                                  : f.type === 'select'
                                    ? 'list'
                                    : 'short_text'}
                              </span>
                              <div>
                                <p className="text-sm text-white font-body">{f.label}</p>
                                <p className="text-[10px] text-[#494847] font-mono uppercase">
                                  {f.type}
                                  {f.required ? ' · required' : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeField(f.id)}
                              className="text-[#494847] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add field modal-lite */}
                    {addingField ? (
                      <div className="bg-[#131313] rounded-2xl p-5 border border-[#85adff]/20 space-y-4">
                        <p className="text-xs font-bold text-[#85adff] uppercase tracking-widest font-headline">
                          New Field
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className={labelCls}>Question Label</label>
                            <input
                              className={inputCls}
                              placeholder="e.g. GitHub handle"
                              value={newField.label}
                              onChange={(e) =>
                                setNewField((f) => ({ ...f, label: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Field Type</label>
                            <select
                              className={inputCls + ' appearance-none'}
                              value={newField.type}
                              onChange={(e) =>
                                setNewField((f) => ({
                                  ...f,
                                  type: e.target.value as AttendeeField['type'],
                                }))
                              }
                            >
                              <option value="text" className="bg-[#201f1f]">
                                Short Text
                              </option>
                              <option value="email" className="bg-[#201f1f]">
                                Email
                              </option>
                              <option value="select" className="bg-[#201f1f]">
                                Dropdown
                              </option>
                              <option value="checkbox" className="bg-[#201f1f]">
                                Checkbox
                              </option>
                            </select>
                          </div>
                          <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <div
                                onClick={() =>
                                  setNewField((f) => ({ ...f, required: !f.required }))
                                }
                                className={[
                                  'w-9 h-5 rounded-full relative transition-all duration-200 cursor-pointer',
                                  newField.required ? 'bg-[#0070eb]' : 'bg-[#262626]',
                                ].join(' ')}
                              >
                                <div
                                  className={[
                                    'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200',
                                    newField.required ? 'left-4' : 'left-0.5',
                                  ].join(' ')}
                                />
                              </div>
                              <span className="text-xs text-[#adaaaa] font-body">Required</span>
                            </label>
                          </div>
                          {newField.type === 'select' && (
                            <div className="col-span-2">
                              <label className={labelCls}>Options (comma-separated)</label>
                              <input
                                className={inputCls}
                                placeholder="Option A, Option B, Option C"
                                value={newField.options}
                                onChange={(e) =>
                                  setNewField((f) => ({ ...f, options: e.target.value }))
                                }
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={addCustomField}
                            disabled={!newField.label.trim()}
                            className="px-5 py-2 bg-gradient-to-br from-[#85adff] to-[#0070eb] text-[#002c65] rounded-xl font-bold text-sm font-headline disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                          >
                            Add Field
                          </button>
                          <button
                            onClick={() => setAddingField(false)}
                            className="px-5 py-2 bg-[#262626] text-[#adaaaa] rounded-xl font-bold text-sm font-headline hover:text-white transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingField(true)}
                        className="w-full border border-dashed border-white/10 rounded-2xl p-5 flex flex-col items-center gap-2 text-[#adaaaa] hover:border-[#85adff]/30 hover:text-[#85adff] transition-all"
                      >
                        <span className="material-symbols-outlined text-3xl">add_circle</span>
                        <p className="text-sm font-body">Add a custom question</p>
                        <p className="text-xs text-[#494847] font-body">
                          GitHub handle, T-shirt size, dietary restrictions…
                        </p>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 4: Promotion ── */}
              {step === 4 && (
                <div className="space-y-7">
                  <div>
                    <label className={labelCls}>Event Website</label>
                    <input
                      className={inputCls}
                      type="url"
                      placeholder="https://yourevent.dev"
                      value={form.websiteUrl}
                      onChange={(e) => update('websiteUrl', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Twitter / X Handle</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#494847] font-body text-sm">
                        @
                      </span>
                      <input
                        className={inputCls + ' pl-9'}
                        placeholder="yourhandle"
                        value={form.twitterHandle}
                        onChange={(e) => update('twitterHandle', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Tags</label>
                    <input
                      className={inputCls}
                      placeholder="opensource, kerala, foss, hackathon"
                      value={form.tags}
                      onChange={(e) => update('tags', e.target.value)}
                    />
                    <p className="text-[10px] text-[#494847] mt-1.5 font-body">
                      Comma-separated — helps attendees discover your event
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Accent Color</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none"
                        value={form.bannerColor}
                        onChange={(e) => update('bannerColor', e.target.value)}
                      />
                      <div>
                        <p className="text-sm text-white font-body">{form.bannerColor}</p>
                        <p className="text-xs text-[#494847] font-body">
                          Used on your event page header
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 5: Review ── */}
              {step === 5 && (
                <div className="space-y-5">
                  <p className="text-[#adaaaa] font-body text-sm">
                    Review your event details before publishing.
                  </p>

                  {publishError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm font-body">
                      <span className="material-symbols-outlined text-base">error</span>
                      {publishError}
                    </div>
                  )}

                  {[
                    { label: 'Title', value: form.title || '—' },
                    { label: 'Category', value: form.category },
                    { label: 'Organization', value: form.organization || '—' },
                    {
                      label: 'Start',
                      value: form.startDate ? `${form.startDate} ${form.startTime}` : '—',
                    },
                    { label: 'End', value: form.endDate ? `${form.endDate} ${form.endTime}` : '—' },
                    {
                      label: 'Venue',
                      value: form.isVirtual
                        ? 'Virtual Event'
                        : form.location?.address.split(',').slice(0, 2).join(', ') || '—',
                    },
                    {
                      label: 'Capacity',
                      value: form.capacity ? `${form.capacity} attendees` : 'Unlimited',
                    },
                    {
                      label: 'Approval',
                      value: form.requireApproval ? 'Manual approval' : 'Auto-approve',
                    },
                    {
                      label: 'Custom Fields',
                      value: form.customFields.length
                        ? `${form.customFields.length} question(s)`
                        : 'None',
                    },
                    { label: 'Tags', value: form.tags || 'None' },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-start gap-4 py-3 border-b border-white/5"
                    >
                      <span className="text-xs font-bold text-[#494847] uppercase tracking-widest w-32 shrink-0 pt-0.5 font-headline">
                        {label}
                      </span>
                      <span className="text-sm text-white font-body">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Live Preview ── */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-5">
                <p className="text-[10px] font-bold text-[#adaaaa] tracking-[0.2em] uppercase font-headline">
                  Live Preview
                </p>

                {/* Ticket card */}
                <div
                  className="rounded-[2rem] overflow-hidden p-7 relative"
                  style={{
                    background: 'rgba(38,38,38,0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(73,72,71,0.15)',
                    boxShadow: '0 0 40px -10px rgba(0,112,235,0.3)',
                  }}
                >
                  <div
                    className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[60px] pointer-events-none"
                    style={{ background: `${form.bannerColor}20` }}
                  />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div
                        className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase font-headline"
                        style={{
                          background: `${form.bannerColor}20`,
                          color: form.bannerColor,
                          border: `1px solid ${form.bannerColor}30`,
                        }}
                      >
                        {step === 5 ? 'Ready to Publish' : 'Preview'}
                      </div>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'rgba(38,38,38,0.6)',
                          border: '1px solid rgba(73,72,71,0.2)',
                        }}
                      >
                        <span
                          className="material-symbols-outlined text-[#85adff]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          confirmation_number
                        </span>
                      </div>
                    </div>

                    <h3 className="font-headline text-xl font-extrabold leading-tight mb-5 text-white">
                      {form.title || 'Your Event Title'}
                    </h3>

                    {form.description && (
                      <p className="text-[#adaaaa] text-xs font-body leading-relaxed mb-4 line-clamp-3">
                        {form.description}
                      </p>
                    )}

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 text-[#adaaaa]">
                        <span
                          className="material-symbols-outlined text-base"
                          style={{ color: form.bannerColor, opacity: 0.7 }}
                        >
                          calendar_today
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {form.startDate
                              ? `${form.startDate}${form.endDate ? ` — ${form.endDate}` : ''}`
                              : 'Date TBD'}
                          </p>
                          {form.startTime && <p className="text-[10px]">{form.startTime} START</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[#adaaaa]">
                        <span
                          className="material-symbols-outlined text-base"
                          style={{ color: form.bannerColor, opacity: 0.7 }}
                        >
                          location_on
                        </span>
                        <p className="text-sm font-semibold text-white">
                          {form.isVirtual
                            ? 'Virtual Event'
                            : form.location
                              ? form.location.address.split(',').slice(0, 2).join(', ')
                              : 'Venue TBD'}
                        </p>
                      </div>
                      {form.capacity && (
                        <div className="flex items-center gap-3 text-[#adaaaa]">
                          <span
                            className="material-symbols-outlined text-base"
                            style={{ color: form.bannerColor, opacity: 0.7 }}
                          >
                            people
                          </span>
                          <p className="text-sm text-white">{form.capacity} max attendees</p>
                        </div>
                      )}
                    </div>

                    {/* Tear line */}
                    <div className="my-5 flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-[#0e0e0e] -ml-9" />
                      <div className="flex-1 border-t-2 border-dashed border-white/10" />
                      <div className="w-4 h-4 rounded-full bg-[#0e0e0e] -mr-9" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[#adaaaa] font-bold tracking-widest uppercase font-headline">
                          Access
                        </p>
                        <p
                          className="text-sm font-bold font-headline"
                          style={{ color: form.bannerColor }}
                        >
                          Free / OSS
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#adaaaa] font-bold tracking-widest uppercase font-headline mb-1">
                          Category
                        </p>
                        <p className="text-xs font-mono text-[#adaaaa]">{form.category}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR hint */}
                <div
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{
                    background: 'rgba(38,38,38,0.4)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(133,173,255,0.1)',
                  }}
                >
                  <div className="w-10 h-10 bg-[#85adff]/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#85adff] text-base">
                      qr_code_2
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-headline">Dynamic QR Generation</h4>
                    <p className="text-xs text-[#adaaaa] font-body mt-0.5">
                      Each attendee gets a unique QR-coded entry pass.
                    </p>
                  </div>
                </div>

                {/* Step validation hint */}
                {!stepValid() && (
                  <div className="bg-[#ff716c]/10 border border-[#ff716c]/20 rounded-xl p-3 flex items-center gap-2 text-[#ff716c] text-xs font-body">
                    <span className="material-symbols-outlined text-base">warning</span>
                    {step === 1
                      ? 'Add an event title to continue.'
                      : step === 2
                        ? 'Pick a start date and a venue to continue.'
                        : 'Fill in required fields.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer actions ── */}
      <footer className="fixed bottom-0 right-0 left-0 lg:left-60 bg-[#0e0e0e]/95 backdrop-blur-md border-t border-white/5 py-4 px-8 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={() => (step === 1 ? undefined : setStep((s) => s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 text-[#adaaaa] font-bold hover:text-white transition-colors group disabled:opacity-30 font-headline text-sm"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform text-lg">
              arrow_back
            </span>
            {step === 1 ? 'Discard Draft' : `Back: ${STEPS[step - 2]?.label}`}
          </button>

          <div className="flex items-center gap-4">
            {/* Mobile save draft */}
            <button
              onClick={saveDraft}
              className="lg:hidden flex items-center gap-1.5 text-[#adaaaa] hover:text-white transition-colors text-sm font-headline"
            >
              <span className="material-symbols-outlined text-base">save</span>
              Save
            </button>

            <button
              onClick={() => (step < 5 ? setStep((s) => s + 1) : handlePublish())}
              disabled={publishing || (step < 5 && !stepValid())}
              className={[
                'px-7 py-3 rounded-2xl font-extrabold text-sm font-headline transition-all flex items-center gap-2',
                'bg-gradient-to-br from-[#85adff] to-[#0070eb] text-[#002c65]',
                'shadow-lg shadow-[#85adff]/20 hover:shadow-[#85adff]/40',
                'hover:scale-[1.02] active:scale-[0.98]',
                'disabled:opacity-40 disabled:pointer-events-none',
              ].join(' ')}
            >
              {publishing ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">
                    progress_activity
                  </span>
                  Publishing…
                </>
              ) : step === 5 ? (
                <>
                  Publish Event{' '}
                  <span className="material-symbols-outlined text-lg">rocket_launch</span>
                </>
              ) : (
                <>
                  Next: {STEPS[step]?.label}{' '}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
