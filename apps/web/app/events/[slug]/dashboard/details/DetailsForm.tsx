'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEventAction } from '../../../../actions/event'

export function DetailsForm({ event }: { event: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Format dates for inputs (YYYY-MM-DDTHH:MM)
  const formatForInput = (date: Date) => {
    if (!date) return ''
    const d = new Date(date)
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const [formData, setFormData] = useState({
    title: event.title || '',
    category: event.category || '',
    description: event.description || '',
    venue: event.venue || '',
    startAt: formatForInput(event.startAt),
    endAt: formatForInput(event.endAt),
    // Dummy state for FOSS UI parity
    status: 'Published',
    shortBio: '',
    showSpeakersTab: true,
    livestreamLink: '',
    recordedVideoLink: '',
    mapLink: '',
    isPaid: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const startDate = formData.startAt.split('T')[0]
      const startTime = formData.startAt.split('T')[1]
      const endDate = formData.endAt.split('T')[0]
      const endTime = formData.endAt.split('T')[1]

      await updateEventAction(event.id, {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        venue: formData.venue,
        startDate,
        startTime,
        endDate,
        endTime,
      })
      alert('Event details updated successfully!')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to update event details')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = [
    'w-full bg-[#1c1c1c] border border-transparent',
    'focus:border-[#444] focus:ring-0 focus:outline-none',
    'rounded-md py-2 px-3 text-white',
    'placeholder:text-[#666] transition-all font-body text-[13px]',
  ].join(' ')

  const labelCls = 'block text-[11px] font-semibold text-[#888] mb-1.5 font-body'
  const sectionTitleCls = 'text-[14px] font-bold text-white mb-4 font-body tracking-tight'
  const helpTextCls = 'text-[11px] text-[#666] mt-1.5 leading-relaxed'

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Header Area */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white font-body tracking-tight">
              {event.title}
            </h1>
            <span className="bg-[#2a2a2a] text-[#888] px-2 py-0.5 rounded text-[10px] font-bold border border-[#333]">
              Concluded
            </span>
          </div>
          <p className="text-[#888] text-[13px] flex items-center gap-2">
            {event.category}
            <span className="w-1 h-1 rounded-full bg-[#555]"></span>
            {new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(event.startAt))}
            {' - '}
            {new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(new Date(event.endAt))}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 bg-[#2a1111] border border-[#3f1616] text-[#ff4444] rounded-md hover:bg-[#3f1616] text-[13px] font-medium transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">block</span>
            Unpublish Event
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-[#2a2a2a] border border-[#333] text-white rounded-md hover:bg-[#333] text-[13px] font-medium transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            {loading ? 'Saving...' : 'Update Details'}
          </button>
        </div>
      </div>

      <div className="space-y-10">
        {/* Banner Image */}
        <div>
          <h2 className={sectionTitleCls}>Banner Image</h2>
          <div className="flex flex-col gap-3">
            <div className="w-[280px] h-[280px] bg-gradient-to-br from-[#85adff] to-[#0070eb] rounded-xl flex items-center justify-center overflow-hidden relative border border-[#333]">
              {event.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">{event.title}</span>
              )}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                className="px-3 py-1.5 bg-[#2a2a2a] border border-[#333] text-white rounded-md text-[12px] font-medium hover:bg-[#333] transition-colors"
              >
                Change Image
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-[#2a1111] border border-[#3f1616] text-[#ff4444] rounded-md text-[12px] font-medium hover:bg-[#3f1616] transition-colors"
              >
                Remove Image
              </button>
            </div>
            <p className={helpTextCls}>
              The ideal dimensions for a banner image are: 280px x 280px (WxH) (1:1)
            </p>
          </div>
        </div>

        {/* Event Details */}
        <div>
          <h2 className={sectionTitleCls}>Event Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className={labelCls}>Event Permalink</label>
              <input
                type="text"
                readOnly
                value={event.slug}
                className={`${inputCls} bg-[#161616] text-[#666] cursor-not-allowed`}
              />
              <p className={helpTextCls}>
                This text will be added to the event URL, creating a link in the format:
                &lt;event-page&gt;/&lt;event-permalink&gt;. Use '-' instead of spaces.
              </p>
            </div>
            <div>
              <label className={labelCls}>Event Link</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={`openpass.org/events/${event.slug}`}
                  className={`${inputCls} bg-[#161616] text-[#666] cursor-not-allowed pr-10`}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-[#666] hover:text-[#888]"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
              <p className={helpTextCls}>
                The event URL will appear as shown above, using the structure:
                &lt;event-page&gt;/&lt;event-permalink&gt;.
              </p>
              <div className="mt-2">
                <a
                  href={`/events/${event.slug}`}
                  target="_blank"
                  className="text-[11px] font-medium text-[#888] border border-[#333] rounded px-2 py-1 hover:bg-[#2a2a2a] inline-flex items-center gap-1 transition-colors"
                >
                  See on Website{' '}
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              </div>
            </div>

            <div>
              <label className={labelCls}>Event Name</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Event Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`${inputCls} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23666%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] pr-8`}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Concluded">Concluded</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <p className={helpTextCls}>Current status of the event.</p>
            </div>

            <div>
              <label className={labelCls}>Event Type</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`${inputCls} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%23666%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] pr-8`}
              >
                <option value="Conference">Conference</option>
                <option value="Meetup">Meetup</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Short Event Bio</label>
              <input
                type="text"
                value={formData.shortBio}
                onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
                className={inputCls}
              />
              <p className={helpTextCls}>
                This bio may be used in OG images and in event cards. Typically it is a one-liner.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={formData.showSpeakersTab}
                onChange={(e) => setFormData({ ...formData, showSpeakersTab: e.target.checked })}
                className="w-3.5 h-3.5 rounded border border-[#333] bg-[#1c1c1c] checked:bg-[#fff] focus:ring-0 appearance-none flex items-center justify-center checked:before:content-['✓'] checked:before:text-black checked:before:text-[10px] checked:before:font-bold"
              />
              <span className="text-white font-medium text-[13px]">Show Speakers Tab</span>
            </label>
          </div>

          <div className="mt-8">
            <label className={labelCls}>Event Description</label>
            <div className="border border-[#222] rounded-md overflow-hidden bg-[#1c1c1c]">
              <div className="flex items-center gap-1 border-b border-[#222] px-2 py-1.5 bg-[#161616]">
                {[
                  'H1',
                  'T',
                  'B',
                  'I',
                  'list',
                  'format_list_numbered',
                  'format_align_left',
                  'format_align_center',
                  'link',
                  'format_quote',
                  'code',
                  'horizontal_rule',
                  'image',
                  'undo',
                  'redo',
                ].map((icon, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#2a2a2a] text-[#888]"
                  >
                    <span
                      className={
                        icon.length > 2
                          ? 'material-symbols-outlined text-[16px]'
                          : 'font-bold font-serif text-[13px]'
                      }
                    >
                      {icon}
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                rows={16}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-transparent p-4 text-[#bbb] focus:outline-none text-[13px] font-body resize-y leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Event Timeline */}
        <div>
          <h2 className={sectionTitleCls}>Event Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className={labelCls}>Event Start Date & Time</label>
              <input
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                className={inputCls}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className={labelCls}>Event End Date & Time</label>
              <input
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                className={inputCls}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>

        {/* Livestreaming */}
        <div>
          <h2 className={sectionTitleCls}>Livestreaming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className={labelCls}>Livestream Link</label>
              <input
                type="url"
                value={formData.livestreamLink}
                onChange={(e) => setFormData({ ...formData, livestreamLink: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Recorded Video Link</label>
              <input
                type="url"
                value={formData.recordedVideoLink}
                onChange={(e) => setFormData({ ...formData, recordedVideoLink: e.target.value })}
                className={inputCls}
              />
              <p className={helpTextCls}>Provide a link to the event recording.</p>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div>
          <h2 className={sectionTitleCls}>Location Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className={labelCls}>Location</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className={inputCls}
              />
              <p className={helpTextCls}>Event Venue if offline else Jitsi meet or Online</p>
            </div>
            <div>
              <label className={labelCls}>Map Link</label>
              <input
                type="url"
                value={formData.mapLink}
                onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                className={inputCls}
              />
              <p className={helpTextCls}>
                Prefer OpenStreetMap (OSM) links, e.g., https://osmapp.org/
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Settings */}
        <div>
          <h2 className={sectionTitleCls}>Ticket Settings</h2>
          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="w-3.5 h-3.5 rounded border border-[#333] bg-[#1c1c1c] checked:bg-[#fff] focus:ring-0 appearance-none flex items-center justify-center checked:before:content-['✓'] checked:before:text-black checked:before:text-[10px] checked:before:font-bold"
              />
              <span className="text-white font-medium text-[13px]">Paid Event</span>
            </label>
          </div>
        </div>

        {/* Footer Padding for Scrolling */}
        <div className="h-20"></div>
      </div>
    </form>
  )
}
