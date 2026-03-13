// frontend/src/pages/TicketView.jsx

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import api from "../api";

export default function TicketView() {
  const { qrToken } = useParams();
  const [ticket, setTicket] = useState(null);
  const [event, setEvent] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTicket(qrToken).then(async (data) => {
      if (data.id) {
        setTicket(data);
        const eventData = await api.getEvent(data.event_id);
        setEvent(eventData);
        const qr = await QRCode.toDataURL(qrToken, { width: 250, margin: 2, color: { dark: "#0a0a0f", light: "#ffffff" } });
        setQrDataUrl(qr);
      }
      setLoading(false);
    });
  }, [qrToken]);

  if (loading) return <div style={centerStyle}>Loading...</div>;
  if (!ticket) return <div style={centerStyle}>Ticket not found 🎟️</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        {/* Ticket Card */}
        <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "20px", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #1a2a0a 0%, #0a1a20 100%)", padding: "28px 28px 24px", borderBottom: "2px dashed #1e1e2e" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px" }}>🎟️</span>
              <span style={{ fontWeight: "700", color: "#e8ff47", fontSize: "16px" }}>OpenPass</span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
              {event?.title || "Event"}
            </h2>
            {event && (
              <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>
                📅 {new Date(event.start_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                {event.venue && ` · 📍 ${event.venue}`}
              </p>
            )}
          </div>

          {/* QR Code */}
          <div style={{ padding: "28px", textAlign: "center", borderBottom: "2px dashed #1e1e2e" }}>
            {qrDataUrl && (
              <div style={{ display: "inline-block", background: "#fff", padding: "12px", borderRadius: "12px" }}>
                <img src={qrDataUrl} alt="QR Code" style={{ display: "block", width: "200px", height: "200px" }} />
              </div>
            )}
            <p style={{ color: "#444", fontSize: "12px", marginTop: "12px", marginBottom: "0" }}>Show this at the entrance</p>
          </div>

          {/* Attendee Info */}
          <div style={{ padding: "24px 28px" }}>
            <Row label="Name" value={ticket.name} />
            <Row label="Email" value={ticket.email} />
            {ticket.phone && <Row label="Phone" value={ticket.phone} />}
            <Row label="Status" value={ticket.is_checked_in ? "✅ Checked In" : "⏳ Not checked in yet"} highlight={ticket.is_checked_in} />
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1e1e2e" }}>
              <p style={{ margin: 0, fontSize: "11px", color: "#333", wordBreak: "break-all", fontFamily: "monospace" }}>
                ID: {ticket.qr_code}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
      <span style={{ fontSize: "13px", color: "#555", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
      <span style={{ fontSize: "14px", fontWeight: "600", color: highlight ? "#4ade80" : "#fff" }}>{value}</span>
    </div>
  );
}

const centerStyle = { minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontFamily: "sans-serif" };
