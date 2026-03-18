// frontend/src/pages/Login.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthLayout, Field } from "./Register";
import { submitBtn } from "../styles/SharedStyles";
import api from "../api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = await api.login(form);
    if (data.access_token) {
      login(data.access_token, data.user);
      navigate("/dashboard");
    } else {
      setError(data.detail || "Login failed");
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your organizer account"
    >
      <form onSubmit={handleSubmit}>
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
        />
        {error && (
          <p style={{ color: "#ff6b6b", fontSize: "14px", margin: "0 0 16px" }}>
            {error}
          </p>
        )}
        <button type="submit" style={submitBtn} disabled={loading}>
          {loading ? "Signing in..." : "Sign in →"}
        </button>
      </form>
      <p
        style={{
          textAlign: "center",
          color: "#666",
          fontSize: "14px",
          marginTop: "24px",
        }}
      >
        No account?{" "}
        <Link to="/register" style={{ color: "#e8ff47" }}>
          Sign up free
        </Link>
      </p>
    </AuthLayout>
  );
}
