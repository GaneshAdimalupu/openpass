'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  createScheduleItemAction,
  updateScheduleItemAction,
  deleteScheduleItemAction,
} from '../../../../actions/schedule'
import { updateEventAction } from '../../../../actions/event'
import { X, Plus, Calendar, Clock, Link as LinkIcon, Trash, Video } from 'lucide-react'

// Map to standard FOSS United Types
const CATEGORIES = [
  { value: 'Talk', label: 'Talk', color: 'text-blue-400 bg-blue-500/10' },
  { value: 'Lightning Talk', label: 'Lightning Talk', color: 'text-purple-400 bg-purple-500/10' },
  { value: 'Workshop', label: 'Workshop', color: 'text-emerald-400 bg-emerald-500/10' },
  {
    value: 'Panel Discussion',
    label: 'Panel Discussion',
    color: 'text-primary-dim bg-primary-dim/10',
  },
  { value: 'Break', label: 'Break', color: 'text-zinc-400 bg-zinc-500/10' },
  { value: 'Other', label: 'Other', color: 'text-zinc-400 bg-zinc-500/10' },
]

function getCategoryStyles(category: string) {
  const found = CATEGORIES.find((t) => t.value === category)
  return found?.color || 'text-zinc-400 bg-zinc-500/10'
}

function formatDisplayTime(dateStr: string | Date) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function calculateDuration(start: string | Date, end: string | Date) {
  const diffMs = new Date(end).getTime() - new Date(start).getTime()
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}m`
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatDateTab(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ScheduleManager({ event, initialItems }: { event: any; initialItems: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Settings State
  const [showSchedule, setShowSchedule] = useState(event.showSchedule || false)
  const [halls, setHalls] = useState<string[]>(event.scheduleHalls || [])
  const [newHall, setNewHall] = useState('')
  const [dates, setDates] = useState<string[]>(event.scheduleDates || [])
  const [newDate, setNewDate] = useState('')

  // View State
  const [activeDate, setActiveDate] = useState<string | null>(dates[0] || null)
  const [groupBy, setGroupBy] = useState('Hall')
  const [sortBy, setSortBy] = useState('Start Time')
  const [showOnlyNew, setShowOnlyNew] = useState(false)

  // Panel State
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'Talk',
    venue: '',
    date: activeDate || '',
    startTime: '10:00',
    endTime: '10:30',
    proposalId: '',
    videoLink: '',
  })

  // Save Event Settings (Halls, Dates, Show Schedule)
  const saveEventSettings = async (updates: any) => {
    startTransition(async () => {
      try {
        await updateEventAction(event.id, updates)
        router.refresh()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  // Hall Management
  const addHall = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newHall.trim()) {
      e.preventDefault()
      if (!halls.includes(newHall.trim())) {
        const updated = [...halls, newHall.trim()]
        setHalls(updated)
        saveEventSettings({ scheduleHalls: updated })
      }
      setNewHall('')
    }
  }
  const removeHall = (hall: string) => {
    const updated = halls.filter((h) => h !== hall)
    setHalls(updated)
    saveEventSettings({ scheduleHalls: updated })
  }

  // Date Management
  const addDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value
    if (dateVal && !dates.includes(dateVal)) {
      const updated = [...dates, dateVal].sort()
      setDates(updated)
      if (!activeDate) setActiveDate(dateVal)
      saveEventSettings({ scheduleDates: updated })
    }
    setNewDate('')
  }
  const removeDate = (date: string) => {
    const updated = dates.filter((d) => d !== date)
    setDates(updated)
    if (activeDate === date) setActiveDate(updated[0] || null)
    saveEventSettings({ scheduleDates: updated })
  }

  // Panel Management
  const openAddPanel = () => {
    setEditingItem(null)
    setFormData({
      title: '',
      type: 'Talk',
      venue: halls[0] || '',
      date: activeDate || dates[0] || '',
      startTime: '10:00',
      endTime: '10:30',
      proposalId: '',
      videoLink: '',
    })
    setPanelOpen(true)
  }

  const openEditPanel = (item: any) => {
    const start = new Date(item.startTime)
    const end = new Date(item.endTime)
    setEditingItem(item)
    setFormData({
      title: item.title,
      type: item.type,
      venue: item.venue || '',
      date: start.toISOString().split('T')[0],
      startTime: start.toTimeString().slice(0, 5),
      endTime: end.toTimeString().slice(0, 5),
      proposalId: item.proposalId || '',
      videoLink: item.videoLink || '',
    })
    setPanelOpen(true)
  }

  // Save Item
  const handleSaveItem = async () => {
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Please fill all required fields')
      return
    }

    startTransition(async () => {
      try {
        const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`)
        const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`)

        const payload = {
          eventId: event.id,
          title: formData.title,
          type: formData.type,
          venue: formData.venue,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          proposalId: formData.proposalId,
          videoLink: formData.videoLink,
        }

        if (editingItem) {
          await updateScheduleItemAction(editingItem.id, event.id, payload)
        } else {
          await createScheduleItemAction(payload)
        }

        setPanelOpen(false)
        router.refresh()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const handleDeleteItem = async () => {
    if (!editingItem) return
    if (!confirm('Are you sure you want to delete this item?')) return

    startTransition(async () => {
      try {
        await deleteScheduleItemAction(editingItem.id, event.id)
        setPanelOpen(false)
        router.refresh()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  // Filter & Group Items
  const filteredItems = initialItems.filter((item) => {
    const itemDate = new Date(item.startTime).toISOString().split('T')[0]
    return itemDate === activeDate
  })

  // Grouping logic (simplified to Hall grouping for now as requested)
  const groupedItems = filteredItems.reduce((acc: any, item) => {
    const groupKey = groupBy === 'Hall' ? item.venue || 'Unassigned' : 'All'
    if (!acc[groupKey]) acc[groupKey] = []
    acc[groupKey].push(item)
    return acc
  }, {})

  return (
    <div className="flex h-[calc(100vh-130px)]">
      {/* Left Pane: Schedule Builder */}
      <div
        className={`flex-1 overflow-y-auto pr-6 transition-all duration-300 ${panelOpen ? 'max-w-[60%]' : 'max-w-full'}`}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between p-4 bg-blue-500/10 text-blue-400 rounded-md mb-6 text-sm border border-blue-500/20">
            <div className="flex items-center gap-2">
              <span>Please find platform docs for adding event schedule</span>
              <a href="#" className="font-semibold hover:underline">
                Read more
              </a>
            </div>
            <button className="text-blue-400 hover:text-blue-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-300">Show Schedule</span>
            <button
              onClick={() => {
                const newVal = !showSchedule
                setShowSchedule(newVal)
                saveEventSettings({ showSchedule: newVal })
              }}
              className={`w-10 h-5 rounded-full relative transition-colors ${showSchedule ? 'bg-zinc-200' : 'bg-zinc-700'}`}
            >
              <div
                className={`w-3 h-3 bg-zinc-900 rounded-full absolute top-1 transition-all ${showSchedule ? 'left-6' : 'left-1'}`}
              />
            </button>
          </div>
          <p className="text-xs text-zinc-500 mb-4">Show the schedule on the event page</p>

          <a
            href="#"
            className="text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-2 mb-8"
          >
            Go to Schedule Page ↗
          </a>

          {/* Hall Options Builder */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
                </svg>
                Hall Options
              </span>
            </div>
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-lg p-2 min-h-[100px]">
              <div className="flex flex-wrap gap-2 mb-2">
                {halls.map((hall) => (
                  <div
                    key={hall}
                    className="flex items-center gap-2 px-3 py-1 bg-zinc-800 text-zinc-300 rounded text-sm"
                  >
                    {hall}
                    <button
                      onClick={() => removeHall(hall)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={newHall}
                onChange={(e) => setNewHall(e.target.value)}
                onKeyDown={addHall}
                placeholder="Type hall name and press Enter"
                className="w-full bg-transparent border-none text-zinc-300 text-sm focus:outline-none focus:ring-0 placeholder-zinc-600 px-2 py-1"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Separate each option with a new line or Enter
            </p>
          </div>

          {/* Date Tabs */}
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setActiveDate(date)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  activeDate === date
                    ? 'border-zinc-500 text-zinc-200 bg-zinc-800'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {formatDateTab(date)}
                <X
                  className="w-3 h-3 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeDate(date)
                  }}
                />
              </button>
            ))}
            <div className="relative">
              <label className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm border border-zinc-800 text-zinc-400 hover:border-zinc-600 cursor-pointer">
                <Plus className="w-4 h-4" /> Add Date
                <input
                  type="date"
                  className="absolute opacity-0 w-0 h-0"
                  onChange={addDate}
                  value={newDate}
                />
              </label>
            </div>
          </div>

          {activeDate ? (
            <div>
              <h2 className="text-xl font-bold text-zinc-100 mb-6">
                {formatDateTab(activeDate).split(' ')[0]} {formatDateTab(activeDate).split(' ')[1]}
              </h2>

              <div className="flex items-center justify-between bg-[#1C1C1E] p-4 rounded-lg border border-zinc-800 mb-8">
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Group By</label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                      className="bg-transparent text-sm text-zinc-300 border-none focus:ring-0 p-0"
                    >
                      <option value="Hall">Hall</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-sm text-zinc-300 border-none focus:ring-0 p-0"
                    >
                      <option value="Start Time">Start Time</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-300">Show Only New Items</span>
                    <button
                      onClick={() => setShowOnlyNew(!showOnlyNew)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${showOnlyNew ? 'bg-zinc-200' : 'bg-zinc-700'}`}
                    >
                      <div
                        className={`w-2.5 h-2.5 bg-zinc-900 rounded-full absolute top-[3px] transition-all ${showOnlyNew ? 'left-5' : 'left-[3px]'}`}
                      />
                    </button>
                  </div>
                  <span className="text-xs text-zinc-500">0 new item(s)</span>
                </div>
              </div>

              <div className="text-xs text-zinc-500 mb-4">
                Showing {filteredItems.length} of {filteredItems.length} items
              </div>

              {/* Schedule List */}
              <div className="space-y-8">
                {Object.entries(groupedItems).map(([groupName, items]: [string, any]) => (
                  <div key={groupName}>
                    {groupBy !== 'None' && (
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          {groupName}
                        </h3>
                        <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full">
                          {items.length}
                        </span>
                      </div>
                    )}
                    <div className="space-y-2">
                      {items.map((item: any) => (
                        <div
                          key={item.id}
                          onClick={() => openEditPanel(item)}
                          className="group relative bg-[#1C1C1E] border border-zinc-800 rounded-lg p-4 cursor-pointer hover:border-zinc-700 transition-colors flex justify-between items-start overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                          <div className="pl-3">
                            <h4 className="text-sm font-medium text-zinc-200 mb-2">{item.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDisplayTime(item.startTime)} -{' '}
                                {formatDisplayTime(item.endTime)}
                              </span>
                              <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                                {calculateDuration(item.startTime, item.endTime)}
                              </span>
                              {item.venue && (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="w-3 h-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
                                  </svg>
                                  {item.venue}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${getCategoryStyles(item.type)}`}
                            >
                              {item.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Schedule Button */}
              <button
                onClick={openAddPanel}
                className="w-full mt-4 py-3 bg-[#1C1C1E] border border-zinc-800 border-dashed rounded-lg text-sm text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Schedule
              </button>
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-12 border border-zinc-800 border-dashed rounded-lg">
              Select a date to add a schedule
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Slide-over Form */}
      {panelOpen && (
        <div className="w-[40%] bg-[#121212] border-l border-zinc-800 flex flex-col h-full animate-in slide-in-from-right">
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-lg font-semibold text-zinc-100 mb-6">
              {editingItem ? 'Modify Schedule' : 'Add Schedule Item'}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Linked Proposal</label>
                <select
                  value={formData.proposalId}
                  onChange={(e) => setFormData({ ...formData, proposalId: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  <option value="">Choose a proposal from approved submissions</option>
                  {/* Will map proposals here in future */}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="e.g. Opening Keynote"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Hall <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  <option value="">Select Hall</option>
                  {halls.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-md px-3 py-2 pl-9 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                    />
                    <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 mb-1">Start Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-md px-3 py-2 pl-9 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                    />
                    <Clock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-zinc-500 mb-1">End Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-md px-3 py-2 pl-9 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                    />
                    <Clock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">Talk Video Link</label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.videoLink}
                    onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                    className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-md px-3 py-2 pl-9 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                    placeholder="https://..."
                  />
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-zinc-800 bg-[#121212] flex items-center justify-between gap-4">
            {editingItem ? (
              <button
                onClick={handleDeleteItem}
                disabled={isPending}
                className="p-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
              >
                <Trash className="w-5 h-5" />
              </button>
            ) : (
              <div /> // Spacer
            )}
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setPanelOpen(false)}
                className="flex-1 py-2 text-sm text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={isPending}
                className="flex-1 py-2 bg-zinc-200 text-zinc-900 rounded-md text-sm font-medium hover:bg-white transition-colors flex justify-center items-center gap-2"
              >
                {isPending ? (
                  'Saving...'
                ) : (
                  <>
                    Save{' '}
                    <span className="text-[10px] bg-zinc-300 px-1 rounded font-mono text-zinc-600">
                      ctrl + s
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
