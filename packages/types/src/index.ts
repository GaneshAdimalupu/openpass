import { z } from 'zod'

// You can export your Prisma generated types directly so the frontend
// doesn't need to install Prisma!
export type { Event, User, Registration, Role } from '@openpass/db'

// Add any custom types here
export interface LocationData {
  lat: number
  lng: number
  address: string
}

// Add the input type we used in the core package earlier
export type CreateEventInput = {
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  venue: string
  location?: LocationData | null
  category: string
  organization?: string
  capacity?: number | null
  registrationDeadline?: string | null
  requireApproval: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formSchema: any[]
  websiteUrl?: string | null
  twitterHandle?: string | null
  tags: string[]
}

export const createRegistrationSchema = z.object({
  eventId: z.string(),
  formData: z.any().optional(),
})

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  total: number
  page: number
  limit: number
}>
