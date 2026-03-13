// frontend/src/pages/CheckIn.jsx

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../api";

export default function CheckIn() {
  const { slug } = useParams();
  const [result, setResult] = useState(null);
  const [manualToken, setManualToken] = useState("");
  const [mode, setMode] = useState("camera"); // camera | manual
  const scannerRef = useRef(null);
  const scannerInstance = useRef(null);

  useEffect(() => {
    if (mode === "camera") {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (scannerRef.current && !scannerInstance.current) {
          scannerInstance.current = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          );
          scannerInstance.current.render(
            async (decodedText) => {
              // Extract token from URL if full URL scanned
              const token = decodedText.includes("/ticket/")
                ? decodedText.split("/ticket/").pop()
                : decodedText;
              await handleScan(token);
            },
            (err) => {} // ignore scan errors
          );
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        if (scannerInstance.current) {
          scannerInstance.current.clear().catch(() => {});
          scannerInstance.current = null;
        }
      };
    }
  }, [mode]);

  const handleScan = async (token) => {
    if (scannerInstance.current) {
      scannerInstance.current.pause();
    }
    const data = await api.scanQR(token.trim());
    setResult(data);
  };

  const reset = () => {
    setResult(null);
    setManualToken("");
    if (scannerInstance.current) {
      scannerInstance.current.resume();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid #1a1a2e" }}>
        <Link to="/dashboard" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>← Dashboard</Link>
        <span style={{ fontWeight: "700", color: "#e8ff47" }}>📱 Check-in Scanner</span>
      </nav>

      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
          Scanning: <span style={{ color: "#e8ff47" }}>{slug}</span>
        </h1>
        <p style={{ color: "#555", marginBottom: "32px" }}>Scan attendee QR codes to check them in.</p>

        {/* Mode Toggle */}
        <div style={{ display: "flex", background: "#111118", border: "1px solid #1e1e2e", borderRadius: "10px", padding: "4px", marginBottom: "24px" }}>
          {["camera", "manual"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); }}
              style={{ flex: 1, background: mode === m ? "#e8ff47" : "transparent", color: mode === m ? "#0a0a0f" : "#666", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "600", cursor: "pointer", fontSize: "14px", fontFamily: "inherit", textTransform: "capitalize" }}>
              {m === "camera" ? "📷 Camera" : "⌨️ Manual"}
            </button>
          ))}
        </div>

        {/* Result Card */}
        {result && (
          <div style={{ background: result.success ? "#0f2a1a" : "#2a0f0f", border: `2px solid ${result.success ? "#4ade80" : "#ff6b6b"}`, borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
            <div style={{ fontSize: "40px", textAlign: "center", marginBottom: "12px" }}>
              {result.success ? "✅" : result.already_checked_in ? "⚠️" : "❌"}
            </div>
            <h3 style={{ textAlign: "center", fontSize: "18px", fontWeight: "800", margin: "0 0 16px", color: result.success ? "#4ade80" : result.already_checked_in ? "#fbbf24" : "#ff6b6b" }}>
              {result.message}
            </h3>
            {result.attendee_name && (
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "10px", padding: "14px" }}>
                <InfoRow label="Name" value={result.attendee_name} />
                <InfoRow label="Email" value={result.attendee_email} />
                <InfoRow label="Ticket" value={result.ticket_name} />
                {result.checked_in_at && (
                  <InfoRow label={result.already_checked_in ? "First check-in" : "Checked in at"} value={new Date(result.checked_in_at).toLocaleTimeString()} />
                )}
              </div>
            )}
            <button onClick={reset} style={{ width: "100%", background: "#e8ff47", color: "#0a0a0f", border: "none", borderRadius: "10px", padding: "12px", fontWeight: "700", cursor: "pointer", fontSize: "15px", marginTop: "16px", fontFamily: "inherit" }}>
              Scan Next →
            </button>
          </div>
        )}

        {/* Camera Scanner */}
        {mode === "camera" && !result && (
          <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", overflow: "hidden" }}>
            <div id="qr-reader" ref={scannerRef} />
          </div>
        )}

        {/* Manual Input */}
        {mode === "manual" && !result && (
          <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#666", marginBottom: "8px", textTransform: "uppercase" }}>
              QR Token
            </label>
            <input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualToken && handleScan(manualToken)}
              style={{ width: "100%", background: "#0a0a0f", border: "1px solid #2a2a3e", borderRadius: "10px", padding: "12px 16px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "monospace", marginBottom: "12px" }}
              placeholder="Paste QR token here..."
            />
            <button onClick={() => manualToken && handleScan(manualToken)}
              style={{ width: "100%", background: "#e8ff47", color: "#0a0a0f", border: "none", borderRadius: "10px", padding: "12px", fontWeight: "700", cursor: "pointer", fontSize: "15px", fontFamily: "inherit" }}>
              Check In
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
      <span style={{ color: "#666" }}>{label}</span>
      <span style={{ fontWeight: "600", color: "#fff" }}>{value}</span>
    </div>
  );
}
