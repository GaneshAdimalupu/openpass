'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPartnerAction, deletePartnerAction } from '../../../../actions/partner'

export function PartnersManager({
  event,
  initialPartners,
}: {
  event: any
  initialPartners: any[]
}) {
  const router = useRouter()
  const [partners, setPartners] = useState(initialPartners)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTier, setModalTier] = useState<'SPONSOR' | 'COMMUNITY'>('SPONSOR')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    logoUrl: '',
  })

  const sponsors = partners.filter((p) => p.tier === 'SPONSOR')
  const communityPartners = partners.filter((p) => p.tier === 'COMMUNITY')

  const [sponsorTier, setSponsorTier] = useState('PLATINUM')

  const handleOpenModal = (tier: 'SPONSOR' | 'COMMUNITY') => {
    setModalTier(tier)
    setSponsorTier('PLATINUM')
    setFormData({ name: '', website: '', logoUrl: '' })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newPartner = await createPartnerAction({
        eventId: event.id,
        name: formData.name,
        website: formData.website,
        logoUrl: formData.logoUrl,
        tier: modalTier === 'SPONSOR' ? sponsorTier : 'COMMUNITY',
      })
      setPartners([...partners, newPartner])
      setIsModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to add partner')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (partnerId: string) => {
    if (!confirm('Are you sure you want to remove this partner?')) return
    try {
      await deletePartnerAction(partnerId, event.id)
      setPartners(partners.filter((p) => p.id !== partnerId))
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to remove partner')
    }
  }

  const handleFakeUpload = () => {
    const url = window.prompt('Enter Logo Image URL (file upload simulation):')
    if (url) {
      setFormData({ ...formData, logoUrl: url })
    }
  }

  return (
    <div className="w-full text-white font-body">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <span className="bg-[#2a2a2a] text-[#888] px-2 py-0.5 rounded text-[10px] font-bold border border-[#333]">
            {event.isPublished ? 'Published' : 'Draft'}
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

      <div className="space-y-12">
        {/* Sponsors Section */}
        <section>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-[18px] font-bold tracking-tight">Sponsors</h2>
            <span className="text-[#666] text-[11px]">
              (Recommended to keep logo in 2:1 aspect ratio)
            </span>
          </div>

          <button
            onClick={() => handleOpenModal('SPONSOR')}
            className="mb-4 px-3 py-1.5 bg-[#2a2a2a] border border-[#333] text-white rounded-md hover:bg-[#333] text-[13px] font-medium transition-colors"
          >
            Add Sponsor
          </button>

          {sponsors.length === 0 ? (
            <p className="text-[#888] text-[13px]">No sponsors added for this event.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="relative group border border-[#333] bg-[#1c1c1c] rounded-lg p-4 flex flex-col items-center justify-center text-center"
                >
                  {sponsor.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="max-w-full max-h-16 object-contain mb-3"
                    />
                  ) : (
                    <div className="w-full h-16 bg-[#2a2a2a] rounded mb-3 flex items-center justify-center text-[#666] text-xs">
                      No Logo
                    </div>
                  )}
                  <h3 className="text-sm font-bold truncate w-full">{sponsor.name}</h3>
                  {sponsor.website && (
                    <a
                      href={sponsor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#85adff] text-[11px] hover:underline truncate w-full mt-1"
                    >
                      {sponsor.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(sponsor.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/40 transition-all"
                    title="Remove Sponsor"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Community Partners Section */}
        <section>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-[18px] font-bold tracking-tight">Community Partners</h2>
          </div>

          <button
            onClick={() => handleOpenModal('COMMUNITY')}
            className="mb-4 px-3 py-1.5 bg-[#2a2a2a] border border-[#333] text-white rounded-md hover:bg-[#333] text-[13px] font-medium transition-colors"
          >
            Add Partner
          </button>

          {communityPartners.length === 0 ? (
            <p className="text-[#888] text-[13px]">No partners added for this event.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {communityPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="relative group border border-[#333] bg-[#1c1c1c] rounded-lg p-4 flex flex-col items-center justify-center text-center"
                >
                  {partner.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="max-w-full max-h-16 object-contain mb-3"
                    />
                  ) : (
                    <div className="w-full h-16 bg-[#2a2a2a] rounded mb-3 flex items-center justify-center text-[#666] text-xs">
                      No Logo
                    </div>
                  )}
                  <h3 className="text-sm font-bold truncate w-full">{partner.name}</h3>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#85adff] text-[11px] hover:underline truncate w-full mt-1"
                    >
                      {partner.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/40 transition-all"
                    title="Remove Partner"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#242424] border border-[#333] rounded-xl w-full max-w-[440px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-white tracking-tight">
                Add {modalTier === 'SPONSOR' ? 'Sponsor' : 'Community Partner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888] hover:text-white transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
              {modalTier === 'SPONSOR' && (
                <div>
                  <label className="block text-[12px] text-[#888] mb-1.5">
                    Sponsorship Tier <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={sponsorTier}
                      onChange={(e) => setSponsorTier(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 px-3 text-white text-[13px] outline-none appearance-none"
                    >
                      <option value="PLATINUM">Platinum</option>
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                      <option value="BRONZE">Bronze</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#888] text-[18px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  {modalTier === 'SPONSOR' ? 'Sponsor Name' : 'Community Name'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 px-3 text-white text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  Website Link <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#888] text-[16px]">
                    link
                  </span>
                  <input
                    type="url"
                    required
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 pl-9 pr-3 text-white text-[13px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  {modalTier === 'SPONSOR' ? 'Sponsor Image' : 'Community Logo'}
                </label>

                {formData.logoUrl ? (
                  <div className="relative w-full h-32 bg-[#1c1c1c] rounded-md border border-[#333] flex items-center justify-center p-4 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.logoUrl}
                      alt="Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                      <button
                        type="button"
                        onClick={handleFakeUpload}
                        className="text-xs text-white bg-[#333] px-3 py-1.5 rounded"
                      >
                        Change Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleFakeUpload}
                    className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-transparent rounded-md border border-[#333] hover:border-[#555] transition-colors cursor-pointer text-[#666] hover:text-[#888]"
                  >
                    <span className="material-symbols-outlined text-[24px]">image</span>
                    <span className="text-[12px]">Click to browse files</span>
                  </button>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-white text-black rounded-md text-[13px] font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
