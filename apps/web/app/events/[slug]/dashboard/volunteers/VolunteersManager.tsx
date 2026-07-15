'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createVolunteerAction,
  updateVolunteerRoleAction,
  deleteVolunteerAction,
} from '../../../../actions/volunteer'

const ROLES = ['Core Team Member', 'Volunteer', 'Graphic Designer', 'Content Writer', 'Marketing']

export function VolunteersManager({
  event,
  initialVolunteers,
}: {
  event: any
  initialVolunteers: any[]
}) {
  const router = useRouter()
  const [volunteers, setVolunteers] = useState(initialVolunteers)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingVolunteer, setEditingVolunteer] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Volunteer',
    imageUrl: '',
  })

  const handleOpenAddModal = () => {
    setFormData({ name: '', email: '', role: 'Volunteer', imageUrl: '' })
    setIsAddModalOpen(true)
  }

  const handleOpenEditModal = (volunteer: any) => {
    setEditingVolunteer(volunteer)
    setFormData({
      name: volunteer.name,
      email: volunteer.email,
      role: volunteer.role,
      imageUrl: volunteer.imageUrl || '',
    })
    setIsEditModalOpen(true)
  }

  const handleFakeUpload = () => {
    const url = window.prompt('Enter Profile Image URL (file upload simulation):')
    if (url) {
      setFormData({ ...formData, imageUrl: url })
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newVolunteer = await createVolunteerAction({
        eventId: event.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        imageUrl: formData.imageUrl,
      })
      setVolunteers([newVolunteer, ...volunteers])
      setIsAddModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to add volunteer')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateVolunteerRoleAction(editingVolunteer.id, event.id, formData.role)
      setVolunteers(
        volunteers.map((v) => (v.id === editingVolunteer.id ? { ...v, role: formData.role } : v))
      )
      setIsEditModalOpen(false)
      setEditingVolunteer(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (volunteerId: string) => {
    if (!confirm('Are you sure you want to remove this volunteer?')) return
    try {
      await deleteVolunteerAction(volunteerId, event.id)
      setVolunteers(volunteers.filter((v) => v.id !== volunteerId))
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to remove volunteer')
    }
  }

  return (
    <div className="w-full text-white font-body">
      {/* Header Area */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
        </div>
        <p className="text-[#888] text-[13px] flex items-center gap-2 mb-4">
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
        <p className="text-[#888] text-[13px] mb-4">Manage volunteers of the event.</p>

        <button
          onClick={handleOpenAddModal}
          className="px-3 py-1.5 bg-[#2a2a2a] border border-[#333] text-white rounded-md hover:bg-[#333] text-[13px] font-medium transition-colors flex items-center gap-1 w-fit"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Volunteer
        </button>
      </div>

      {volunteers.length === 0 ? (
        <p className="text-[#888] text-[13px]">No volunteers added for this event.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers.map((volunteer) => (
            <div
              key={volunteer.id}
              className="border border-[#333] bg-[#1c1c1c] rounded-lg p-5 relative flex flex-col justify-between min-h-[120px]"
            >
              <div className="flex justify-between items-start w-full gap-2">
                <div className="flex flex-col gap-1 w-[70%]">
                  <h3 className="text-[15px] font-bold text-white truncate w-full">
                    {volunteer.name}
                  </h3>
                  <p className="text-[#888] text-[13px] truncate w-full">{volunteer.email}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(volunteer)}
                    className="px-2 py-1 bg-[#2a2a2a] text-[#aaa] rounded hover:bg-[#333] hover:text-white transition-colors text-[11px] font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(volunteer.id)}
                    className="px-2 py-1 bg-red-900/30 text-red-500 rounded hover:bg-red-900/50 transition-colors text-[11px] font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <span className="inline-block bg-[#1a2f4c] text-[#85adff] px-2.5 py-1 rounded-md text-[11px] font-medium">
                  {volunteer.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Volunteer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#242424] border border-[#333] rounded-xl w-full max-w-[440px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-white tracking-tight">Add New Member</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#888] hover:text-white transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="px-6 pb-6 space-y-5">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  Name <span className="text-red-500">*</span>
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
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 px-3 text-white text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  Enter the role of the member <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 px-3 text-white text-[13px] outline-none appearance-none"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#888] text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">Profile Image</label>

                {formData.imageUrl ? (
                  <div className="relative w-full h-32 bg-[#1c1c1c] rounded-md border border-[#333] flex items-center justify-center p-4 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="Profile Preview"
                      className="max-h-full max-w-full object-contain rounded-md"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                      <button
                        type="button"
                        onClick={handleFakeUpload}
                        className="text-xs text-white bg-[#333] px-3 py-1.5 rounded"
                      >
                        Change Image
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

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full py-2.5 bg-[#2a2a2a] text-[#aaa] rounded-md text-[13px] font-bold hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#333] text-white rounded-md text-[13px] font-bold hover:bg-[#444] transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#242424] border border-[#333] rounded-xl w-full max-w-[440px] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-white tracking-tight">Edit Member</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingVolunteer(null)
                }}
                className="text-[#888] hover:text-white transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="px-6 pb-6 space-y-5">
              <div>
                <label className="block text-[12px] text-[#888] mb-1.5">
                  Enter the new role of the member
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#1c1c1c] border border-transparent focus:border-[#444] rounded-md py-2.5 px-3 text-white text-[13px] outline-none appearance-none"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#888] text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingVolunteer(null)
                  }}
                  className="w-full py-2.5 bg-[#2a2a2a] text-[#aaa] rounded-md text-[13px] font-bold hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[#333] text-white rounded-md text-[13px] font-bold hover:bg-[#444] transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
