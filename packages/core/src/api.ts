export const API_URL = '/api'

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  }

  const res = await fetch(`${API_URL}${endpoint}`, mergedOptions)

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Failed to parse JSON response')
  }

  if (!res.ok) {
    throw new Error(data?.error || `API error: ${res.status}`)
  }

  return data
}
