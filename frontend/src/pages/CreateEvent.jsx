// frontend/src/pages/CreateEvent.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { Field, submitBtn } from "./Register";

export default function CreateEvent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", venue: "",
    start_date: "", end_date: "", slug: "", banner_url: "",
  });
  const [tickets, setTickets] = useState([{ name: "General", price: 0, total_quantity: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=details, 2=tickets

  const autoSlug = (title) => title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.slug) setForm({ ...form, slug: autoSlug(form.title) });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const eventData = await api.createEvent({
        ...form,
        slug: form.slug || autoSlug(form.title),
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      });
      if (eventData.id) {
        // Create tickets
        for (const t of tickets) {
          if (t.name) {
            await api.createTicket({
              event_id: eventData.id,
              name: t.name,
              price: parseFloat(t.price) || 0,
              total_quantity: t.total_quantity ? parseInt(t.total_quantity) : null,
            });
          }
        }
        // Publish
        await api.updateEvent(eventData.slug, { is_published: true });
        navigate(`/events/${eventData.slug}`);
      } else {
        setError(eventData.detail || "Failed to create event");
      }
    } catch (err) {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a2e" }}>
        <Link to="/dashboard" style={{ textDecoration: "none", color: "#666", fontSize: "14px" }}>← Back to Dashboard</Link>
        <span style={{ fontWeight: "700", color: "#e8ff47" }}>🎟️ OpenPass</span>
      </nav>

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "60px 40px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-1px" }}>
          {step === 1 ? "Create Event" : "Add Tickets"}
        </h1>
        <p style={{ color: "#555", marginBottom: "40px" }}>Step {step} of 2</p>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "40px" }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ height: "4px", flex: 1, borderRadius: "100px", background: s <= step ? "#e8ff47" : "#1a1a2e" }} />
          ))}
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext}>
            <Field label="Event Title" type="text" value={form.title} onChange={(v) => setForm({ ...form, title: v, slug: autoSlug(v) })} placeholder="DevFest Kerala 2025" />
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Tell attendees what to expect..." />
            </div>
            <Field label="Venue" type="text" value={form.venue} onChange={(v) => setForm({ ...form, venue: v })} placeholder="Technopark, Trivandrum" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Field label="Start Date & Time" type="datetime-local" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
              <Field label="End Date (optional)" type="datetime-local" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
            </div>
            <Field label="URL Slug" type="text" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="devfest-kerala-2025" />
            <p style={{ color: "#444", fontSize: "13px", marginTop: "-12px", marginBottom: "20px" }}>
              Your event page: /e/{form.slug || "your-slug"}
            </p>
            <button type="submit" style={submitBtn}>Next: Add Tickets →</button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {tickets.map((t, i) => (
              <div key={i} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontWeight: "600", fontSize: "15px" }}>Ticket {i + 1}</span>
                  {tickets.length > 1 && (
                    <button type="button" onClick={() => setTickets(tickets.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "13px" }}>Remove</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input value={t.name} onChange={(e) => { const n = [...tickets]; n[i].name = e.target.value; setTickets(n); }}
                      style={inputStyle} placeholder="General" />
                  </div>
                  <div>
                    <label style={labelStyle}>Price (₹)</label>
                    <input type="number" value={t.price} onChange={(e) => { const n = [...tickets]; n[i].price = e.target.value; setTickets(n); }}
                      style={inputStyle} placeholder="0" min="0" />
                  </div>
                  <div>
                    <label style={labelStyle}>Qty (blank=∞)</label>
                    <input type="number" value={t.total_quantity} onChange={(e) => { const n = [...tickets]; n[i].total_quantity = e.target.value; setTickets(n); }}
                      style={inputStyle} placeholder="∞" min="1" />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={() => setTickets([...tickets, { name: "", price: 0, total_quantity: "" }])}
              style={{ width: "100%", background: "transparent", border: "2px dashed #2a2a3e", color: "#555", padding: "14px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", marginBottom: "24px" }}>
              + Add Ticket Type
            </button>

            {error && <p style={{ color: "#ff6b6b", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={() => setStep(1)}
                style={{ flex: 1, background: "transparent", border: "1px solid #333", color: "#fff", padding: "14px", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
                ← Back
              </button>
              <button type="submit" style={{ ...submitBtn, flex: 2 }} disabled={loading}>
                {loading ? "Creating..." : "🚀 Create & Publish"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" };
const inputStyle = { width: "100%", background: "#0a0a0f", border: "1px solid #2a2a3e", borderRadius: "10px", padding: "12px 16px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
