// frontend/src/api/index.js

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const getToken = () => localStorage.getItem("token");
const headers = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const api = {
  signup: (data) => fetch(`${BASE_URL}/api/auth/signup`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),
  login: (data) => fetch(`${BASE_URL}/api/auth/login`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),
  me: () => fetch(`${BASE_URL}/api/auth/me`, { headers: headers() }).then((r) => r.json()),
  listEvents: () => fetch(`${BASE_URL}/api/events/`, { headers: headers() }).then((r) => r.json()),
  getEvent: (slug) => fetch(`${BASE_URL}/api/events/${slug}`).then((r) => r.json()),
  createEvent: (data) => fetch(`${BASE_URL}/api/events/`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),
  updateEvent: (slug, data) => fetch(`${BASE_URL}/api/events/${slug}`, { method: "PATCH", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),
  getEventTickets: (slug) => fetch(`${BASE_URL}/api/events/${slug}/tickets`).then((r) => r.json()),
  createTicket: (data) => fetch(`${BASE_URL}/api/tickets/`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),
  register: (slug, data) => fetch(`${BASE_URL}/api/registrations/${slug}`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),
  getTicket: (qrToken) => fetch(`${BASE_URL}/api/registrations/ticket/${qrToken}`).then((r) => r.json()),
  listRegistrations: (slug) => fetch(`${BASE_URL}/api/registrations/${slug}/list`, { headers: headers() }).then((r) => r.json()),
  scanQR: (qrToken) => fetch(`${BASE_URL}/api/checkin/scan`, { method: "POST", headers: headers(), body: JSON.stringify({ qr_token: qrToken }) }).then((r) => r.json()),
  dashboard: (slug) => fetch(`${BASE_URL}/api/dashboard/${slug}`, { headers: headers() }).then((r) => r.json()),
  allEventsSummary: () => fetch(`${BASE_URL}/api/dashboard/`, { headers: headers() }).then((r) => r.json()),
};

export default api;
