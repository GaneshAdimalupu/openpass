// frontend/src/pages/Register.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const data = await api.signup(form);
    if (data.access_token) {
      login(data.access_token, data.user);
      navigate("/dashboard");
    } else {
      setError(data.detail || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Create account" subtitle="Start managing events for free">
      <form onSubmit={handleSubmit}>
        <Field label="Full Name" type="text" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        {error && <p style={{ color: "#ff6b6b", fontSize: "14px", margin: "0 0 16px" }}>{error}</p>}
        <button type="submit" style={submitBtn} disabled={loading}>
          {loading ? "Creating account..." : "Create account →"}
        </button>
      </form>
      <p style={{ textAlign: "center", color: "#666", fontSize: "14px", marginTop: "24px" }}>
        Already have an account? <Link to="/login" style={{ color: "#e8ff47" }}>Sign in</Link>
      </p>
    </AuthLayout>
  );
}

// ── Shared Auth Layout ────────────────────────────────────────────────────────

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", marginBottom: "40px", justifyContent: "center" }}>
          <span style={{ fontSize: "20px" }}>🎟️</span>
          <span style={{ fontSize: "18px", fontWeight: "700", color: "#e8ff47" }}>OpenPass</span>
        </Link>
        <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: "20px", padding: "40px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#fff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>{title}</h1>
          <p style={{ color: "#555", fontSize: "15px", margin: "0 0 32px" }}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Shared Form Field ─────────────────────────────────────────────────────────

export function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#888", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required
        style={{ width: "100%", background: "#0a0a0f", border: "1px solid #2a2a3e", borderRadius: "10px", padding: "12px 16px", color: "#fff", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
      />
    </div>
  );
}

export const submitBtn = {
  width: "100%", background: "#e8ff47", color: "#0a0a0f", border: "none",
  borderRadius: "10px", padding: "14px", fontSize: "15px", fontWeight: "700",
  cursor: "pointer", fontFamily: "inherit",
};
