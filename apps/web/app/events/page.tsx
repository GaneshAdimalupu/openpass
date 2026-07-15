import { redirect } from 'next/navigation'

// The explore page now lives at the root (/). Redirect any old /events links.
export default function EventsPage() {
  redirect('/')
}
