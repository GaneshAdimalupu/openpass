// frontend/src/pages/Landing.jsx

import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Orgs / Logos ──────────────────────────────────────────────────────────────

const LOGOS = [
  { abbr: "IEEE",      color: "#60a5fa" },
  { abbr: "μLearn",   color: "#a78bfa" },
  { abbr: "ELEVATE",  color: "#4ade80" },
  { abbr: "TinkerHub",color: "#fb923c" },
  { abbr: "GTech",    color: "#e8ff47" },
  { abbr: "GDSC",     color: "#60a5fa" },
  { abbr: "FOSS",     color: "#4ade80" },
  { abbr: "IEDC",     color: "#f472b6" },
  { abbr: "DevFest",  color: "#e8ff47" },
  { abbr: "InitCrew", color: "#a78bfa" },
];

function Marquee() {
  const items = [...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <div style={{ position: "relative", overflow: "hidden", padding: "28px 0" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "140px", zIndex: 2, pointerEvents: "none", background: "linear-gradient(to right, #0a0a0f, transparent)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "140px", zIndex: 2, pointerEvents: "none", background: "linear-gradient(to left, #0a0a0f, transparent)" }} />
      <div style={{ display: "flex", width: "max-content", animation: "marquee 35s linear infinite" }}>
        {items.map((logo, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 24px", whiteSpace: "nowrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: `1px solid ${logo.color}44`, borderRadius: "100px", padding: "8px 18px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: logo.color, flexShrink: 0 }} />
              <span style={{ fontSize: "14px", fontWeight: "700", color: logo.color, letterSpacing: "0.3px" }}>{logo.abbr}</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }`}</style>
    </div>
  );
}

// ── Full-page Ripple Background ───────────────────────────────────────────────

function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H, t = 0, animId;
    let mx = -999, my = -999;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const onMouseMove = (e) => { mx = e.clientX; my = e.clientY; };
    const onMouseLeave = () => { mx = -999; my = -999; };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, W, H);

      const cols = 32, rows = 20;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = (i / cols) * W;
          const y = (j / rows) * H;
          const dx = mx - x, dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const wave  = Math.sin(t * 2   + i * 0.4 + j * 0.6) * 7;
          const wave2 = Math.cos(t * 1.3 + i * 0.3 - j * 0.4) * 4;
          const mouseWave = dist < 180
            ? Math.sin(dist * 0.08 - t * 4) * (1 - dist / 180) * 22 : 0;

          const ox = Math.cos(t + j * 0.5) * (wave + wave2 + mouseWave);
          const oy = Math.sin(t + i * 0.5) * (wave + wave2 + mouseWave);

          const idlePulse  = 0.5 + Math.sin(t * 1.5 + i * 0.3 + j * 0.5) * 0.2;
          const mouseBright = Math.max(0, 1 - dist / 200) * 0.5;
          const bright = idlePulse + mouseBright;
          const dotR   = 1.5 + Math.max(0, 1 - dist / 100) * 2;

          let dotColor;
          if      (dist < 80)  dotColor = `rgba(232,255,71,${Math.min(1, bright)})`;
          else if (dist < 180) dotColor = `rgba(74,222,128,${Math.min(1, bright * 0.9)})`;
          else                 dotColor = `rgba(180,220,80,${Math.min(1, bright * 0.55)})`;

          ctx.beginPath();
          ctx.arc(x + ox, y + oy, dotR, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();
        }
      }

      t += 0.018;
      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",   // ← covers the ENTIRE page always
        top: 0, left: 0,
        width: "100vw", height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "100vh", color: "#fff", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>

      {/* Full-page background — fixed, behind everything */}
      <Background />

      {/* All content sits above background via zIndex */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Nav */}
        <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>🎟️</span>
            <span style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px", color: "#e8ff47" }}>OpenPass</span>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            {user ? (
              <Link to="/dashboard" style={btn("#e8ff47", "#0a0a0f")}>Dashboard →</Link>
            ) : (
              <>
                <Link to="/login" style={btn("transparent", "#fff", "1px solid #333")}>Login</Link>
                <Link to="/register" style={btn("#e8ff47", "#0a0a0f")}>Get Started</Link>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <section style={{ padding: "180px 48px 100px", textAlign: "center" }}>
          {/* Soft centre vignette so text is readable */}
          <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(10,10,15,0.5) 0%, transparent 100%)" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>
            <div style={{ display: "inline-block", background: "rgba(26,26,46,0.8)", border: "1px solid #2a2a4e", borderRadius: "100px", padding: "6px 18px", fontSize: "13px", color: "#e8ff47", marginBottom: "32px", letterSpacing: "0.5px" }}>
              ✦ Open Source · Free Forever
            </div>
            <h1 style={{ fontSize: "clamp(48px, 8vw, 88px)", fontWeight: "800", lineHeight: "1.05", letterSpacing: "-3px", margin: "0 0 24px", textShadow: "0 2px 40px rgba(0,0,0,0.9)" }}>
              Events that feel<br /><span style={{ color: "#e8ff47" }}>effortless.</span>
            </h1>
            <p style={{ fontSize: "20px", color: "#bbb", maxWidth: "520px", margin: "0 auto 48px", lineHeight: "1.6", textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}>
              Create events, sell tickets, generate QR passes, and check in attendees — all in one open-source platform.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" style={btn("#e8ff47", "#0a0a0f", "none", "18px 36px", "16px")}>Start for free →</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" style={btn("rgba(255,255,255,0.08)", "#fff", "1px solid #444", "18px 36px", "16px")}>⭐ Star on GitHub</a>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <Marquee />

        {/* Features */}
        <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 48px 120px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {[
              { icon: "🗓️", title: "Create Events",    desc: "Publish events in seconds with custom slugs, venues, and dates." },
              { icon: "🎫", title: "Sell Tickets",     desc: "Free or paid ticket tiers with quantity limits and availability tracking." },
              { icon: "📧", title: "Email QR Passes",  desc: "Attendees instantly receive a beautiful HTML email with their unique QR code." },
              { icon: "📱", title: "QR Check-in",      desc: "Scan QR codes with any camera. Real-time check-in with duplicate detection." },
              { icon: "📊", title: "Live Dashboard",   desc: "Watch registrations roll in. Check-in rates, ticket breakdowns, attendee lists." },
              { icon: "🔓", title: "Open Source",      desc: "MIT licensed. Self-host it, fork it, contribute to it. Yours forever." },
            ].map((f) => (
              <div key={f.title}
                style={{ background: "rgba(17,17,24,0.85)", backdropFilter: "blur(12px)", border: "1px solid #1e1e2e", borderRadius: "16px", padding: "32px", transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#e8ff4744"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e2e"}
              >
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 8px", color: "#fff" }}>{f.title}</h3>
                <p style={{ fontSize: "15px", color: "#666", margin: 0, lineHeight: "1.6" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid #1a1a2e", padding: "32px 48px", textAlign: "center", color: "#444", fontSize: "14px" }}>
          Built with ❤️ in Kerala · OpenPass is open source
        </footer>

      </div>
    </div>
  );
}

function btn(bg, color, border = "none", padding = "10px 20px", fontSize = "14px") {
  return { background: bg, color, border, padding, fontSize, borderRadius: "8px", fontWeight: "600", cursor: "pointer", textDecoration: "none", display: "inline-block" };
}