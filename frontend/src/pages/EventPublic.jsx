// frontend/src/pages/EventPublic.jsx

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function EventPublic() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", ticket_id: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getEvent(slug), api.getEventTickets(slug)]).then(([e, t]) => {
      setEvent(e); setTickets(Array.isArray(t) ? t : []);
      if (t.length > 0) setForm((f) => ({ ...f, ticket_id: t[0].id }));
      setLoading(false);
    });
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    const data = await api.register(slug, form);
    if (data.id) setSuccess(data);
    else setError(data.detail || "Registration failed. Please try again.");
    setSubmitting(false);
  };

  if (loading) return <Loader />;
  if (!event || event.detail) return <NotFound />;

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#fff", margin: "0 0 8px" }}>You're registered!</h2>
            <p style={{ color: "#666", marginBottom: "24px" }}>Check your email for your QR ticket.</p>
            <div style={{ background: "#0a0a0f", borderRadius: "12px", padding: "20px", textAlign: "left", marginBottom: "24px" }}>
              <p style={{ margin: "0 0 8px", color: "#888", fontSize: "13px" }}>TICKET ID</p>
              <code style={{ color: "#e8ff47", fontSize: "14px", wordBreak: "break-all" }}>{success.qr_code}</code>
            </div>
            <a href={`/ticket/${success.qr_code}`} style={{ background: "#e8ff47", color: "#0a0a0f", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", textDecoration: "none", display: "inline-block" }}>
              View My Ticket
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Event Banner */}
      {event.banner_url && (
        <div style={{ width: "100%", height: "200px", background: `url(${event.banner_url}) center/cover`, borderRadius: "16px 16px 0 0", marginBottom: "-16px" }} />
      )}

      <div style={{ ...cardStyle, borderRadius: event.banner_url ? "0 0 16px 16px" : "16px" }}>
        {/* Event Info */}
        <div style={{ marginBottom: "32px", paddingBottom: "32px", borderBottom: "1px solid #1e1e2e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#4ade80", background: "#0f2a1a", padding: "3px 10px", borderRadius: "100px", letterSpacing: "0.5px" }}>● OPEN</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", margin: "0 0 12px", letterSpacing: "-0.5px" }}>{event.title}</h1>
          {event.description && <p style={{ color: "#666", lineHeight: "1.6", margin: "0 0 16px" }}>{event.description}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <span style={{ color: "#888", fontSize: "14px" }}>
              📅 {new Date(event.start_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            {event.venue && <span style={{ color: "#888", fontSize: "14px" }}>📍 {event.venue}</span>}
          </div>
        </div>

        {/* Ticket Selection */}
        {tickets.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Select Ticket</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {tickets.map((t) => (
                <div key={t.id} onClick={() => t.is_available && setForm({ ...form, ticket_id: t.id })}
                  style={{ background: form.ticket_id === t.id ? "#1a2a0a" : "#0a0a0f", border: `2px solid ${form.ticket_id === t.id ? "#e8ff47" : "#1e1e2e"}`, borderRadius: "10px", padding: "14px 16px", cursor: t.is_available ? "pointer" : "not-allowed", opacity: t.is_available ? 1 : 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: "600", fontSize: "15px" }}>{t.name}</span>
                    {t.remaining !== null && <span style={{ fontSize: "12px", color: "#666", marginLeft: "8px" }}>{t.remaining} left</span>}
                  </div>
                  <span style={{ fontWeight: "700", color: "#e8ff47" }}>{t.price === 0 ? "Free" : `₹${t.price}`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Your name" />
            </div>
            <div>
              <label style={labelStyle}>Phone (optional)</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+91 ..." />
            </div>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} placeholder="ticket will be sent here" />
          </div>

          {error && <p style={{ color: "#ff6b6b", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}

          <button type="submit" disabled={submitting} style={{ width: "100%", background: "#e8ff47", color: "#0a0a0f", border: "none", borderRadius: "10px", padding: "14px", fontSize: "16px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
            {submitting ? "Registering..." : "Register & Get Ticket →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const pageStyle = { minHeight: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", fontFamily: "'DM Sans', sans-serif", color: "#fff" };
const cardStyle = { width: "100%", maxWidth: "520px", background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "32px" };
const labelStyle = { display: "block", fontSize: "12px", fontWeight: "700", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle = { width: "100%", background: "#0a0a0f", border: "1px solid #2a2a3e", borderRadius: "10px", padding: "12px 16px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "0" };

function Loader() {
  return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontFamily: "sans-serif" }}>Loading...</div>;
}
function NotFound() {
  return <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontFamily: "sans-serif", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "48px" }}>🎟️</span><p>Event not found</p></div>;
}
