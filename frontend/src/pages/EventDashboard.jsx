// frontend/src/pages/EventDashboard.jsx

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function EventDashboard() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboard(slug), api.listRegistrations(slug)]).then(([d, r]) => {
      setData(d); setRegistrations(Array.isArray(r) ? r : []);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div style={centerStyle}>Loading dashboard...</div>;
  if (!data || data.detail) return <div style={centerStyle}>Event not found</div>;

  const { event, stats, tickets_breakdown, recent_registrations } = data;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #1a1a2e", flexWrap: "wrap", gap: "12px" }}>
        <Link to="/dashboard" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>← My Events</Link>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link to={`/e/${slug}`} target="_blank" style={navBtn("transparent", "#888", "1px solid #222")}>↗ Public Page</Link>
          <Link to={`/checkin/${slug}`} style={navBtn("#e8ff47", "#0a0a0f")}>📱 Check-in Scanner</Link>
        </div>
      </nav>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px" }}>
        {/* Event Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: event.is_published ? "#4ade80" : "#888", background: event.is_published ? "#0f2a1a" : "#1a1a1a", padding: "4px 10px", borderRadius: "100px" }}>
              {event.is_published ? "● Live" : "○ Draft"}
            </span>
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-1px" }}>{event.title}</h1>
          <p style={{ color: "#555", margin: 0 }}>
            📅 {new Date(event.start_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {event.venue && ` · 📍 ${event.venue}`}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "40px" }}>
          <StatCard label="Total Registered" value={stats.total_registered} color="#e8ff47" />
          <StatCard label="Checked In" value={stats.total_checked_in} color="#4ade80" />
          <StatCard label="Not Checked In" value={stats.not_checked_in} color="#f87171" />
          <StatCard label="Check-in Rate" value={`${stats.check_in_rate}%`} color="#60a5fa" />
        </div>

        {/* Check-in progress bar */}
        <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontWeight: "700" }}>Check-in Progress</span>
            <span style={{ color: "#e8ff47", fontWeight: "700" }}>{stats.check_in_rate}%</span>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "100px", height: "8px" }}>
            <div style={{ background: "linear-gradient(90deg, #e8ff47, #4ade80)", width: `${stats.check_in_rate}%`, height: "100%", borderRadius: "100px", transition: "width 1s ease" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          {/* Tickets Breakdown */}
          <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontWeight: "700", margin: "0 0 20px", fontSize: "16px" }}>🎫 Ticket Breakdown</h3>
            {tickets_breakdown.map((t) => (
              <div key={t.ticket_name} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px" }}>{t.ticket_name}</span>
                  <span style={{ fontSize: "14px", color: "#888" }}>{t.registered_count}{t.total_quantity ? `/${t.total_quantity}` : ""}</span>
                </div>
                <div style={{ background: "#1a1a2e", borderRadius: "100px", height: "4px" }}>
                  <div style={{ background: "#e8ff47", width: `${t.total_quantity ? (t.registered_count / t.total_quantity) * 100 : 100}%`, height: "100%", borderRadius: "100px" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Registrations */}
          <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontWeight: "700", margin: "0 0 20px", fontSize: "16px" }}>🕐 Recent Registrations</h3>
            {recent_registrations.slice(0, 6).map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "12px", borderBottom: i < 5 ? "1px solid #1a1a2e" : "none" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>{r.name}</div>
                  <div style={{ fontSize: "12px", color: "#555" }}>{r.email}</div>
                </div>
                <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "100px", background: r.is_checked_in ? "#0f2a1a" : "#1a1a2e", color: r.is_checked_in ? "#4ade80" : "#555", fontWeight: "700" }}>
                  {r.is_checked_in ? "✓ In" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Full Attendee List */}
        <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px" }}>
          <h3 style={{ fontWeight: "700", margin: "0 0 20px", fontSize: "16px" }}>👥 All Attendees ({registrations.length})</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e2e" }}>
                  {["Name", "Email", "Ticket", "Registered", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#555", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #111" }}>
                    <td style={{ padding: "12px", fontWeight: "600" }}>{r.name}</td>
                    <td style={{ padding: "12px", color: "#888" }}>{r.email}</td>
                    <td style={{ padding: "12px", color: "#888" }}>{r.ticket_id ? "General" : "—"}</td>
                    <td style={{ padding: "12px", color: "#555", fontSize: "13px" }}>{new Date(r.registered_at).toLocaleDateString("en-IN")}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ fontSize: "12px", padding: "3px 8px", borderRadius: "100px", background: r.is_checked_in ? "#0f2a1a" : "#1a1a2e", color: r.is_checked_in ? "#4ade80" : "#666", fontWeight: "700" }}>
                        {r.is_checked_in ? "✓ Checked In" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrations.length === 0 && (
              <p style={{ textAlign: "center", color: "#444", padding: "40px" }}>No registrations yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px" }}>
      <div style={{ fontSize: "36px", fontWeight: "800", color, letterSpacing: "-1px" }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#555", marginTop: "4px", fontWeight: "600" }}>{label}</div>
    </div>
  );
}

const centerStyle = { minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontFamily: "sans-serif" };
function navBtn(bg, color, border = "none") {
  return { background: bg, color, border, padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", textDecoration: "none" };
}
