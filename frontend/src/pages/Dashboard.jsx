// frontend/src/pages/Dashboard.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.allEventsSummary().then((data) => {
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a2e" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <span>🎟️</span>
          <span style={{ fontWeight: "700", color: "#e8ff47", fontSize: "18px" }}>OpenPass</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#666", fontSize: "14px" }}>Hi, {user?.name} 👋</span>
          <button onClick={() => { logout(); navigate("/"); }} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
            Logout
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-1px" }}>My Events</h1>
            <p style={{ color: "#555", margin: 0 }}>{events.length} event{events.length !== 1 ? "s" : ""} total</p>
          </div>
          <Link to="/events/create" style={{ background: "#e8ff47", color: "#0a0a0f", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", textDecoration: "none", fontSize: "15px" }}>
            + New Event
          </Link>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#444", padding: "80px" }}>Loading...</div>
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EventCard({ event }) {
  const checkInRate = event.total_registered > 0
    ? Math.round((event.total_checked_in / event.total_registered) * 100)
    : 0;

  return (
    <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px", transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", color: event.is_published ? "#4ade80" : "#888", background: event.is_published ? "#0f2a1a" : "#1a1a1a", padding: "4px 10px", borderRadius: "100px" }}>
          {event.is_published ? "● Live" : "○ Draft"}
        </span>
        <span style={{ fontSize: "13px", color: "#444" }}>
          {new Date(event.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 20px", lineHeight: "1.3" }}>{event.title}</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        <Stat label="Registered" value={event.total_registered} />
        <Stat label="Checked In" value={event.total_checked_in} />
      </div>

      {/* Progress bar */}
      <div style={{ background: "#1a1a2e", borderRadius: "100px", height: "4px", marginBottom: "20px" }}>
        <div style={{ background: "#e8ff47", width: `${checkInRate}%`, height: "100%", borderRadius: "100px", transition: "width 0.5s" }} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <Link to={`/events/${event.slug}`} style={smallBtn("#1a1a2e", "#fff")}>Dashboard</Link>
        <Link to={`/checkin/${event.slug}`} style={smallBtn("#e8ff47", "#0a0a0f")}>📱 Check-in</Link>
        <Link to={`/e/${event.slug}`} target="_blank" style={smallBtn("transparent", "#666", "1px solid #222")}>↗ View</Link>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: "#0a0a0f", borderRadius: "10px", padding: "12px" }}>
      <div style={{ fontSize: "22px", fontWeight: "800", color: "#fff" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "100px 40px", border: "2px dashed #1a1a2e", borderRadius: "20px" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎟️</div>
      <h3 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 8px" }}>No events yet</h3>
      <p style={{ color: "#555", marginBottom: "24px" }}>Create your first event and start accepting registrations</p>
      <Link to="/events/create" style={{ background: "#e8ff47", color: "#0a0a0f", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", textDecoration: "none" }}>
        + Create Event
      </Link>
    </div>
  );
}

function smallBtn(bg, color, border = "none") {
  return { background: bg, color, border, padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", textDecoration: "none", cursor: "pointer" };
}
