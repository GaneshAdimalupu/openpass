// frontend/src/pages/Register.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { submitBtn } from "../styles/SharedStyles";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ✅ Improved validation
  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Minimum 8 characters required";
    }

    return newErrors;
  };

  // ✅ Improved submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const data = await api.signup(form);

      if (data?.access_token) {
        login(data.access_token, data.user);
        navigate("/dashboard");
      } else {
        setErrors({ api: data?.detail || "Signup failed" });
      }
    } catch (err) {
      setErrors({ api: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start managing events for free"
    >
      <form onSubmit={handleSubmit}>
        <Field
          id="name"
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          error={errors.name}
        />

        <Field
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          error={errors.email}
        />

        <Field
          id="password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          error={errors.password}
        />

        {errors.api && <p style={errorText}>{errors.api}</p>}

        <button type="submit" style={submitBtn} disabled={loading}>
          {loading ? "Creating account..." : "Create account →"}
        </button>
      </form>

      <p style={footerText}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#e8ff47" }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={layout}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <Link to="/" style={logo}>
          <span>🎟️</span>
          <span style={{ fontWeight: "700", color: "#e8ff47" }}>OpenPass</span>
        </Link>

        <div style={card}>
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Field Component
// ─────────────────────────────────────────────────────────────

export function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div style={{ marginBottom: "20px", position: "relative" }}>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>

      <input
        id={id}
        type={isPassword && showPassword ? "text" : type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />

      {isPassword && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowPassword(!showPassword)}
          style={eyeBtn}
        >
          {showPassword ? (
            <EyeSlashIcon style={icon} />
          ) : (
            <EyeIcon style={icon} />
          )}
        </button>
      )}

      {error && <p style={errorSmall}>{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const layout = {
  minHeight: "100vh",
  background: "#0a0a0f",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  fontFamily: "'DM Sans', sans-serif",
};

const card = {
  background: "#111118",
  border: "1px solid #1e1e2e",
  borderRadius: "20px",
  padding: "40px",
};

const logo = {
  display: "flex",
  justifyContent: "center",
  gap: "8px",
  textDecoration: "none",
  marginBottom: "40px",
  color: "#fff",
};

const titleStyle = {
  fontSize: "26px",
  fontWeight: "800",
  color: "#fff",
  marginBottom: "8px",
};

const subtitleStyle = {
  color: "#555",
  marginBottom: "32px",
};

const labelStyle = {
  fontSize: "13px",
  color: "#888",
  marginBottom: "6px",
  display: "block",
};

const inputStyle = {
  width: "100%",
  background: "#0a0a0f",
  border: "1px solid #2a2a3e",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "#fff",
  fontSize: "15px",
  outline: "none",
};

const eyeBtn = {
  position: "absolute",
  right: "10px",
  top: "36px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

const icon = { width: "20px", height: "20px", color: "#888" };

const errorText = {
  color: "#ff6b6b",
  fontSize: "14px",
  marginBottom: "12px",
};

const errorSmall = {
  color: "#ff6b6b",
  fontSize: "12px",
  marginTop: "4px",
};

const footerText = {
  textAlign: "center",
  color: "#666",
  fontSize: "14px",
  marginTop: "24px",
};
