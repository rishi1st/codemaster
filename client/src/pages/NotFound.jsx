import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Terminal, Home, ArrowLeft, Search } from "lucide-react";

const GLITCH_CHARS = "!@#$%^&*<>?/\\|{}[]~`";

const glitch = (text) =>
  text
    .split("")
    .map((c) =>
      Math.random() < 0.15
        ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        : c
    )
    .join("");

const NotFound = () => {
  const navigate  = useNavigate();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const [headline, setHeadline] = useState("404");
  const [visible,  setVisible]  = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const intervalRef  = useRef(null);
  const glitchCount  = useRef(0);

  // Entrance
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Glitch effect on "404" — runs 6 times then settles
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (glitchCount.current >= 6) {
        setHeadline("404");
        clearInterval(intervalRef.current);
        return;
      }
      setHeadline(glitch("404"));
      glitchCount.current += 1;
    }, 120);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Cursor glow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const move = (e) => {
      const rect = el.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener("mousemove", move);
    return () => el.removeEventListener("mousemove", move);
  }, []);

  const LINKS = [
    { to: "/",        icon: Home,     label: "Home",          show: true            },
    { to: "/problems",icon: Search,   label: "Problems",      show: isAuthenticated },
    { to: "/login",   icon: Terminal, label: "Sign In",       show: !isAuthenticated},
  ].filter((l) => l.show);

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#060810", fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, #0d1a3a 0%, #060810 60%)",
      }} />

      {/* Cursor glow */}
      <div className="absolute pointer-events-none" style={{
        left: cursorPos.x - 200, top: cursorPos.y - 200,
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 70%)",
      }} />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:
          "linear-gradient(rgba(239,68,68,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left:   `${8 + i * 11}%`,
            width:  `${2 + (i % 2)}px`,
            height: `${2 + (i % 2)}px`,
            background: i % 2 === 0 ? "#f87171" : "#818cf8",
            opacity: 0.25,
            animation: `floatUp ${10 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.8}s`,
          }} />
        ))}
      </div>

      {/* ── Card ── */}
      <div
        style={{
          textAlign: "center",
          padding: "clamp(40px, 6vw, 64px) clamp(28px, 6vw, 56px)",
          maxWidth: 480, width: "100%", margin: "0 16px",
          borderRadius: 20,
          border: "1px solid rgba(239,68,68,0.12)",
          background: "linear-gradient(135deg, #080c1a 0%, #060810 100%)",
          boxShadow: "0 0 0 1px rgba(239,68,68,0.05), 0 32px 80px rgba(0,0,0,0.8)",
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1), opacity 0.6s ease",
        }}
      >
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "20px 20px 0 0",
          background: "linear-gradient(90deg, #ef4444, #f87171, #818cf8)",
        }} />

        {/* Terminal label */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20, marginBottom: 24,
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, color: "#f87171", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Error
          </span>
        </div>

        {/* Glitch headline */}
        <div style={{
          fontSize: "clamp(72px,16vw,112px)",
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: 8,
          background: "linear-gradient(135deg, #ef4444, #f87171)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
          minHeight: "1.1em",
        }}>
          {headline}
        </div>

        {/* Terminal block */}
        <div style={{
          background: "rgba(6,8,16,0.8)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, padding: "12px 16px",
          marginBottom: 28, textAlign: "left",
        }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {["#ef4444","#f59e0b","#22c55e"].map((c, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          {[
            { text: "$ navigate --path " + window.location.pathname, color: "#22d3ee" },
            { text: "> ERROR 404: Route not found",                   color: "#f87171" },
            { text: "> Searched all registered paths...",             color: "#475569" },
            { text: "> Suggestion: check the URL or go home",         color: "#64748b" },
          ].map((line, i) => (
            <div key={i} style={{ fontSize: 12, color: line.color, lineHeight: 1.9, fontFamily: "inherit" }}>
              {line.text}
            </div>
          ))}
        </div>

        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28, lineHeight: 1.7 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: "100%", padding: "11px 20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, color: "#64748b",
              fontSize: 13, fontWeight: 500,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <ArrowLeft size={14} />
            Go Back
          </button>

          {LINKS.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "11px 20px",
              background: to === "/" ? "linear-gradient(135deg, #4f46e5, #6d28d9)" : "rgba(129,140,248,0.08)",
              border: to === "/" ? "1px solid rgba(129,140,248,0.3)" : "1px solid rgba(129,140,248,0.15)",
              borderRadius: 10,
              color: to === "/" ? "#f0f6ff" : "#94a3b8",
              fontSize: 13, fontWeight: 500,
              fontFamily: "inherit", textDecoration: "none",
              transition: "all 0.2s",
              boxShadow: to === "/" ? "0 4px 20px rgba(79,70,229,0.2)" : "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes floatUp {
          0%   { transform: translateY(100vh); opacity: 0; }
          10%  { opacity: 0.25; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
