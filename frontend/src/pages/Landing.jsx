// frontend/src/pages/Landing.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MAX_W = "1200px";
const PAD   = "0 48px";

// ── Logo Marquee ──────────────────────────────────────────────────────────────
const LOGOS = [
  { abbr: "INITCREW",  color: "#e8ff47" }, { abbr: "μLearn",   color: "#a78bfa" },
  { abbr: "LAUNCHPAD", color: "#fb923c" }, { abbr: "FAYA:80",  color: "#4ade80" },
  { abbr: "ELEVATE",   color: "#60a5fa" }, { abbr: "JIIMF",    color: "#f472b6" },
  { abbr: "GTech",     color: "#e8ff47" }, { abbr: "GDSC",     color: "#60a5fa" },
  { abbr: "sunbird",   color: "#4ade80" }, { abbr: "EkStep",   color: "#a78bfa" },
  { abbr: "IN50HRS",   color: "#fb923c" }, { abbr: "IEDC",     color: "#f472b6" },
];

function Marquee() {
  const items = [...LOGOS, ...LOGOS, ...LOGOS];
  return (
    <div style={{ position: "relative", overflow: "hidden", padding: "18px 0", borderTop: "1px solid #1e1e2e", borderBottom: "1px solid #1e1e2e" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100px", zIndex: 2, pointerEvents: "none", background: "linear-gradient(to right, #0a0a0f, transparent)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "100px", zIndex: 2, pointerEvents: "none", background: "linear-gradient(to left, #0a0a0f, transparent)" }} />
      <div style={{ display: "flex", width: "max-content", animation: "marquee 40s linear infinite" }}>
        {items.map((logo, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", border: `1px solid ${logo.color}44`, borderRadius: "100px", padding: "6px 14px" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: logo.color, flexShrink: 0 }} />
              <span style={{ fontSize: "12px", fontWeight: "700", color: logo.color, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{logo.abbr}</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}`}</style>
    </div>
  );
}

// ── Ripple Background ─────────────────────────────────────────────────────────
function Background() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H, t = 0, animId, mx = -999, my = -999;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i <= 32; i++) {
        for (let j = 0; j <= 20; j++) {
          const x = (i / 32) * W, y = (j / 20) * H;
          const dx = mx - x, dy = my - y, dist = Math.sqrt(dx * dx + dy * dy);
          const w1 = Math.sin(t * 2 + i * 0.4 + j * 0.6) * 7;
          const w2 = Math.cos(t * 1.3 + i * 0.3 - j * 0.4) * 4;
          const mw = dist < 180 ? Math.sin(dist * 0.08 - t * 4) * (1 - dist / 180) * 22 : 0;
          const ox = Math.cos(t + j * 0.5) * (w1 + w2 + mw);
          const oy = Math.sin(t + i * 0.5) * (w1 + w2 + mw);
          const bright = Math.min(1, 0.5 + Math.sin(t * 1.5 + i * 0.3 + j * 0.5) * 0.2 + Math.max(0, 1 - dist / 200) * 0.5);
          const dr = 1.5 + Math.max(0, 1 - dist / 100) * 2;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, dr, 0, Math.PI * 2);
          ctx.fillStyle = dist < 80
            ? `rgba(232,255,71,${bright})`
            : dist < 180
              ? `rgba(74,222,128,${bright * 0.9})`
              : `rgba(180,220,80,${bright * 0.55})`;
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
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none" }}
    />
  );
}

// Replacement for the FeaturesSection function in Landing.jsx

function FeaturesSection() {
  return (
    <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 48px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ color: "#e8ff47" }}>✦✦</span>
            <span style={{ fontSize: "13px", color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>Everything you need</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: "900", color: "#fff", letterSpacing: "-1px", margin: 0, lineHeight: "1.1" }}>
            Powerful features for<br />✦ Modern Organisers
          </h2>
        </div>
      </div>

      <style>{`
        .bento-grid { 
          display: grid; 
          gap: 16px; 
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: minmax(160px, auto);
        }
        
        .bento-card {
          background: rgba(17,17,24,0.6);
          backdrop-filter: blur(12px);
          border: 1px solid #1e1e2e;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, border-color 0.2s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }

        .bento-card:hover {
          border-color: #e8ff4744;
          transform: translateY(-2px);
        }

        .bento-img-container {
          width: 100%;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .bento-img-container img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 10px;
        }

        .col-4 { grid-column: span 4; }
        .col-5 { grid-column: span 5; }
        .col-7 { grid-column: span 7; }
        .col-8 { grid-column: span 8; }
        .row-2 { grid-row: span 2; }

        @media (max-width: 900px) {
          section { padding: 40px 24px !important; }
          .bento-grid { grid-template-columns: 1fr; }
          .col-4, .col-5, .col-7, .col-8 { grid-column: span 1; }
          .row-2 { grid-row: span 1; }
        }
      `}</style>

      <div className="bento-grid">
        {/* Card 1: Ticket Design (Tall) */}
{/* Card 1: Ticket Design (Tall) */}
<div className="bento-card col-4 row-2">
  <div className="bento-img-container" style={{ height: "70%", background: "linear-gradient(45deg, #0d1117, #1a1a2e)" }}>
    <img 
      src="/hero-person.png" 
      alt="Ticket design"
      style={{ 
        width: "100%", 
        height: "100%", 
        objectFit: "cover", 
        objectPosition: "center 20%"  /* Bias toward top for portraits */
      }}
    />
  </div>
  <div style={{ padding: "20px" }}>
    <div style={{ fontSize: "16px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>Branded Passes</div>
    <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.5" }}>Custom-designed tickets that serve as a micro-brand for your event.</div>
  </div>
</div>


        {/* Card 2: Yellow Call to Action */}
        <div className="bento-card col-8" style={{ background: "#e8ff47", border: "none", justifyContent: "center", padding: "30px" }}>
          <h3 style={{ color: "#0a0a0f", fontSize: "24px", fontWeight: "900", margin: "0 0 12px" }}>Ready to Host?</h3>
          <p style={{ color: "#2a2a0a", fontSize: "14px", margin: "0 0 20px", maxWidth: "400px" }}>Join the open-source movement for event management. Start your first event in under 2 minutes.</p>
          <Link to="/register" style={{ background: "#0a0a0f", color: "#e8ff47", padding: "12px 24px", borderRadius: "100px", fontWeight: "700", textDecoration: "none", width: "fit-content", fontSize: "14px" }}>
            Create Event Now →
          </Link>
        </div>

{/* Card 3: QR Scanner */}
<div className="bento-card col-4">
  <div className="bento-img-container" style={{ height: "140px", background: "linear-gradient(45deg, #0d1117, #1a1a2e)" }}>
    <img 
      src="/qr-scanner.png" 
      alt="QR Scanner"
      style={{ 
        width: "100%", 
        height: "100%", 
        objectFit: "cover", 
        objectPosition: "center"
      }}
    />
  </div>
  <div style={{ padding: "18px" }}>
    <div style={{ fontSize: "14px", fontWeight: "800", color: "#4ade80", marginBottom: "4px" }}>Instant Check-in</div>
    <div style={{ fontSize: "12px", color: "#555" }}>Zero-lag scanning for high-traffic events.</div>
  </div>
</div>


{/* Card 4: Ticket Flow (Wide) */}
<div className="bento-card col-4">
  <div className="bento-img-container" style={{ height: "140px" }}>
    <img 
      src="/ticket-flow.png" 
      alt="Process flow"
      style={{ 
        width: "100%", 
        height: "100%", 
        objectFit: "cover",  /* Fills container, crops edges */
        objectPosition: "center"
      }}
    />
  </div>
  <div style={{ padding: "18px" }}>
    <div style={{ fontSize: "14px", fontWeight: "800", color: "#fff", marginBottom: "4px" }}>
      End-to-End Flow
    </div>
    <div style={{ fontSize: "12px", color: "#555" }}>
      From registration to check-in, all in one place.
    </div>
  </div>
</div>


        {/* Card 5: Gamification */}
        <div className="bento-card col-5" style={{ padding: "24px", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <span style={{ background: "#1a2e1a", color: "#4ade80", padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "700" }}>NEW</span>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>Gamify Everything</div>
          <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.5" }}>Add lucky draws, referral points, and leaderboards to boost engagement.</div>
        </div>

        {/* Card 6: Analytics */}
        <div className="bento-card col-7" style={{ padding: "24px", background: "linear-gradient(to bottom right, rgba(232,255,71,0.05), transparent)" }}>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>Deep Insights</div>
          <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.5" }}>Track ticket sales, check-in rates, and attendee demographics in real-time. Export data whenever you need.</div>
        </div>
      </div>
    </section>
  );
}


// ── One Platform ──────────────────────────────────────────────────────────────
function OnePlatformSection() {
  const tasks = [
    "Flexible Registration Options", "Automated Certificate Generation",
    "Track Insights", "Create Customised Ticketing Experience",
    "Effortless Event Registration", "Streamlined Attendee Communication",
    "Offer Discounts for Attendees", "Boost Event Buzz with Pre-Event Campaigns",
    "Simplified Check-In Processes", "Enhance Engagement Through Gamification",
  ];
  return (
    <section style={{ borderTop: "1px solid #1e1e2e", borderBottom: "1px solid #1e1e2e", padding: "60px 0", background: "rgba(10,10,15,0.4)" }}>
      <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: PAD }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ color: "#e8ff47" }}>✦</span>
              <span style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: "900", color: "#fff", letterSpacing: "-1px" }}>Scattered Tasks</span>
              <span style={{ fontSize: "20px", color: "#e8ff47" }}>✛</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ color: "#e8ff47" }}>✦</span>
              <span style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: "900", color: "#fff", letterSpacing: "-1px" }}>
                We bring it under <span style={{ color: "#e8ff47" }}>One platform</span>
              </span>
            </div>
          </div>
          <Link to="/register" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a3a", color: "#fff", borderRadius: "100px", padding: "11px 22px", fontSize: "14px", fontWeight: "600", textDecoration: "none", whiteSpace: "nowrap" }}>
            → Learn More
          </Link>
        </div>

        <div style={{ background: "rgba(17,17,24,0.7)", backdropFilter: "blur(12px)", border: "1px solid #1e1e2e", borderRadius: "18px", padding: "32px", display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
          <div style={{ minWidth: "100px" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", border: "2px solid #2a2a3a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "22px", color: "#444" }}>?</span>
            </div>
            <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.5" }}>Your Amazing<br />Events?</div>
          </div>

          <span style={{ color: "#333", fontSize: "24px" }}>⇌</span>

          <div style={{ background: "#e8ff47", borderRadius: "100px", padding: "12px 24px", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span style={{ fontSize: "16px" }}>🎟️</span>
            <span style={{ fontSize: "15px", fontWeight: "900", color: "#0a0a0f" }}>OpenPass</span>
          </div>

          <div style={{ flex: 1, minWidth: "260px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {tasks.map((task, i) => (
              <div key={i} style={{
                background: i === 3 || i === 5 ? "#1a2e1a" : "rgba(255,255,255,0.03)",
                border: `1px solid ${i === 3 || i === 5 ? "#4ade8033" : "#1e1e2e"}`,
                borderRadius: "100px",
                padding: "5px 12px",
                fontSize: "12px",
                color: i === 3 || i === 5 ? "#4ade80" : "#555",
                whiteSpace: "nowrap",
              }}>
                {task}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

// ── CTA Section ───────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{ padding: "60px 48px", maxWidth: MAX_W, margin: "0 auto" }}>
      <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", padding: "clamp(48px,8vw,88px) clamp(24px,5vw,72px)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <img src="/cta-bg.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to bottom, rgba(0, 28, 10, 0.2) 0%, rgba(0, 18, 6, 0.39) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "640px" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,56px)", fontWeight: "900", color: "#fff", letterSpacing: "-2px", lineHeight: "1.05", margin: "0 0 16px" }}>
            Ready to Launch Your<br />Next Event?
          </h2>
          <p style={{ fontSize: "clamp(14px,1.4vw,16px)", color: "#4ade80", marginBottom: "32px", lineHeight: "1.6" }}>
            Be among the first organisers on OpenPass — free forever for early adopters.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" style={{ background: "#2d7a3a", color: "#e8ff47", borderRadius: "10px", padding: "13px 28px", fontSize: "15px", fontWeight: "800", textDecoration: "none" }}>
              Create Event Now
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" style={{ background: "transparent", color: "#fff", borderRadius: "10px", padding: "13px 28px", fontSize: "15px", fontWeight: "700", textDecoration: "none" }}>
              Star on GitHub ⭐
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Browse by Feature ─────────────────────────────────────────────────────────
function BrowseFeatures() {
  const [active, setActive] = useState(null);
  const features = [
    { num: "1", name: "Event Registration",   count: "5 features", desc: "Custom forms, multi-ticket types, group registration, waitlists, and confirmation flows." },
    { num: "2", name: "QR Check-in",          count: "4 features", desc: "Camera-based scanning, manual entry, duplicate detection, and real-time logs." },
    { num: "3", name: "Email & Comms",         count: "4 features", desc: "Automated ticket emails, reminders, confirmations, and custom HTML templates." },
    { num: "4", name: "Dashboard & Insights", count: "6 features", desc: "Live stats, ticket breakdowns, check-in rates, attendee exports, and trend charts." },
    { num: "5", name: "Organiser Tools",      count: "5 features", desc: "Multi-event management, team access, slug customisation, and event cloning." },
    { num: "6", name: "Attendee Experience",  count: "3 features", desc: "Personal ticket page, QR wallet pass, and event reminder notifications." },
    { num: "7", name: "Open Source",          count: "∞ features", desc: "MIT licensed, self-hostable, fully forkable. Contribute and make it yours." },
  ];
  return (
    <section style={{ borderTop: "1px solid #1e1e2e", padding: "60px 0" }}>
      <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: PAD }}>
        <h2 style={{ fontSize: "clamp(32px,6vw,72px)", fontWeight: "900", color: "#fff", letterSpacing: "-3px", marginBottom: "4px" }}>
          Browse by Feature
        </h2>
        <div>
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => setActive(active === i ? null : i)}
              style={{ borderBottom: "1px solid #1e1e2e", padding: "20px 0", cursor: "pointer", transition: "padding-left 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.paddingLeft = "8px"}
              onMouseLeave={e => e.currentTarget.style.paddingLeft = "0px"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "clamp(20px,3.5vw,44px)", fontWeight: "900", color: active === i ? "#e8ff47" : "#fff", letterSpacing: "-1px", transition: "color 0.2s" }}>
                  {f.num}. {f.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <span style={{ fontSize: "12px", color: "#333" }}>{f.count}</span>
                  <span style={{ color: active === i ? "#e8ff47" : "#2a2a3a", fontSize: "18px", transition: "color 0.2s" }}>✦</span>
                </div>
              </div>
              {active === i && (
                <div style={{ marginTop: "12px", fontSize: "14px", color: "#777", lineHeight: "1.7", maxWidth: "560px" }}>
                  {f.desc}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { heading: "Product",   links: ["Digital Ticketing", "QR Check-in", "Live Dashboard", "Open Source API"] },
    { heading: "Resources", links: ["Documentation", "GitHub", "Community", "Changelog"] },
    { heading: "Company",   links: ["About Us", "Privacy Policy", "Terms of Service", "Contact"] },
  ];
  return (
    <footer style={{ maxWidth: MAX_W, margin: "0 auto", padding: "0 48px 32px" }}>
      <div style={{ borderRadius: "16px", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)", padding: "28px 36px 20px", overflow: "hidden", position: "relative" }}>

        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "35%", height: "1px", background: "linear-gradient(to right, rgba(232,255,71,0.25), transparent)", pointerEvents: "none" }} />

        {/* Brand + columns */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "clamp(24px,4vw,64px)", marginBottom: "24px" }}>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ fontSize: "16px" }}>🎟️</span>
              <span style={{ fontSize: "15px", fontWeight: "800", color: "#e8ff47", letterSpacing: "-0.5px" }}>OpenPass</span>
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", lineHeight: "1.7", margin: "0 0 14px", maxWidth: "190px" }}>
              Open-source event management for the next generation of organisers. Made with ❤️ in Kerala.
            </p>
            <div style={{ display: "flex", gap: "7px" }}>
              {[["GitHub","⭐"], ["Email","✉️"], ["Docs","📄"]].map(([lbl, ico]) => (
                <a key={lbl} href="#" aria-label={lbl} title={lbl} style={{ width: "30px", height: "30px", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", textDecoration: "none" }}>
                  {ico}
                </a>
              ))}
            </div>
          </div>

          {cols.map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px" }}>
                {col.heading}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {col.links.map(link => (
                  <a key={link} href="#"
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.8)"}
                    onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
                  >{link}</a>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.18)" }}>© 2025 OpenPass. All rights reserved.</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.18)" }}>MIT License · Open Source</span>
        </div>

      </div>
    </footer>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: "100vh", color: "#fff", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
      <Background />
      <div style={{ position: "relative", zIndex: 1 }}>

        <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
          <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🎟️</span>
              <span style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px", color: "#e8ff47" }}>OpenPass</span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {user ? (
                <Link to="/dashboard" style={btn("#e8ff47", "#0a0a0f")}>Dashboard →</Link>
              ) : (
                <>
                  <Link to="/login" style={btn("transparent", "#fff", "1px solid #2a2a3a")}>Login</Link>
                  <Link to="/register" style={btn("#e8ff47", "#0a0a0f")}>Host With Us Now</Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <section style={{ maxWidth: MAX_W, margin: "0 auto", padding: "180px 48px 70px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(232,255,71,0.07)", border: "1px solid #e8ff4730", borderRadius: "100px", padding: "5px 14px", fontSize: "12px", color: "#e8ff47", marginBottom: "28px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#e8ff47", display: "inline-block" }} />
            Open source · Built in Kerala · Launching soon
          </div>
          <h1 style={{ fontSize: "clamp(40px,7vw,80px)", fontWeight: "900", lineHeight: "1.0", letterSpacing: "-3px", margin: "0 0 6px", textShadow: "0 2px 40px rgba(0,0,0,0.9)" }}>Where Events</h1>
          <h1 style={{ fontSize: "clamp(40px,7vw,80px)", fontWeight: "900", lineHeight: "1.0", letterSpacing: "-3px", margin: "0 0 6px", textShadow: "0 2px 40px rgba(0,0,0,0.9)" }}>Begin, and Memories</h1>
          <h1 style={{ fontSize: "clamp(40px,7vw,80px)", fontWeight: "900", lineHeight: "1.0", letterSpacing: "-3px", margin: "0 0 36px", textShadow: "0 2px 40px rgba(0,0,0,0.9)" }}>
            <span style={{ color: "#e8ff47" }}>Get Made</span> with OpenPass 🎟️
          </h1>
          <Link to="/register" style={{ ...btn("#e8ff47", "#0a0a0f", "none", "14px 28px", "15px"), display: "inline-flex", alignItems: "center", gap: "10px", borderRadius: "100px" }}>
            <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>→</span>
            Host With Us Now
          </Link>
        </section>

        <Marquee />
        <FeaturesSection />
        <OnePlatformSection />
        <CTASection />
        <BrowseFeatures />
        <Footer />

      </div>
    </div>
  );
}

function btn(bg, color, border = "none", padding = "9px 18px", fontSize = "14px") {
  return { background: bg, color, border, padding, fontSize, borderRadius: "8px", fontWeight: "700", cursor: "pointer", textDecoration: "none", display: "inline-block" };
}