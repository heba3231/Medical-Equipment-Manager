import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import hospitalImg from "../Images/hospital.png";
import ot from "../Images/OT.png";
import sterilization from "../Images/sterilization.png";

const slides = [
  {
    badge: "ICU Department",
    title: "Intensive Care Unit",
    desc: "Real-time monitoring of all critical life-support equipment",
    bg: "linear-gradient(135deg, #004d32, #006341, #1a7a55)",
    img: hospitalImg,
  },
  {
    badge: "Radiology",
    title: "Radiology & Imaging",
    desc: "Track MRI, CT scanners, and X-ray machines across all shifts",
    bg: "linear-gradient(135deg, #004d32, #0a5a3a, #2d8a60)",
    img: ot,
  },
  {
    badge: "Maintenance",
    title: "Scheduled Maintenance",
    desc: "Stay ahead of failures with proactive maintenance scheduling",
    bg: "linear-gradient(135deg, #3d2a00, #6b4a00, #8a6110)",
    img: sterilization,
  },
  {
    badge: "Laboratory",
    title: "Laboratory Equipment",
    desc: "Full lifecycle management from procurement to retirement",
    bg: "linear-gradient(135deg, #002a3d, #003d5c, #005a7a)",
    img: hospitalImg,
  },
];

function HeroSlider() {
  const [cur, setCur] = useState(0);
  const timer = useRef(null);

  const go = (n) => setCur((n + slides.length) % slides.length);
  const startTimer = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => setCur((c) => (c + 1) % slides.length), 4000);
  };

  useEffect(() => { startTimer(); return () => clearInterval(timer.current); }, []);

  const handleArrow = (dir) => { go(cur + dir); startTimer(); };
  const handleDot = (i) => { go(i); startTimer(); };

  const s = slides[cur];

  return (
    <div style={{ position: "relative", width: "100%", height: 550, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: s.bg,
        transition: "background 0.8s ease",
      }} />
      {s.img && (
        <img src={s.img} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", filter: "brightness(0.45)",
        }} />
      )}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to right, rgba(0,77,50,0.6) 0%, transparent 60%)",
      }} />

      <div style={{
        position: "relative", zIndex: 2, height: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "0 20px",
        animation: "fadeIn 0.6s ease-out",
      }}>
        <span style={{
          display: "inline-block", background: "#c9a84c", color: "#004d32",
          fontSize: 11, fontWeight: 700, padding: "4px 14px",
          borderRadius: 20, marginBottom: 12, letterSpacing: "0.5px",
        }}>{s.badge}</span>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 10, textShadow: "0 2px 8px rgba(0,0,0,.4)" }}>
          {s.title}
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", textShadow: "0 1px 4px rgba(0,0,0,.3)" }}>
          {s.desc}
        </p>
      </div>

      {[[-1, "‹", { left: 16 }], [1, "›", { right: 16 }]].map(([dir, sym, pos]) => (
        <button key={dir} onClick={() => handleArrow(dir)} style={{
          position: "absolute", top: "50%", transform: "translateY(-50%)",
          ...pos, background: "rgba(255,255,255,0.15)",
          border: "1.5px solid rgba(255,255,255,0.3)", color: "#fff",
          width: 38, height: 38, borderRadius: "50%", fontSize: 22,
          cursor: "pointer", zIndex: 10, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>{sym}</button>
      ))}

      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => handleDot(i)} style={{
            width: i === cur ? 22 : 8, height: 8, borderRadius: 4,
            background: i === cur ? "#c9a84c" : "rgba(255,255,255,0.4)",
            border: "none", cursor: "pointer",
            transition: "all 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="#006341"/>
          <rect x="13" y="3" width="8" height="8" rx="2" fill="#006341" opacity="0.5"/>
          <rect x="3" y="13" width="8" height="8" rx="2" fill="#006341" opacity="0.5"/>
          <rect x="13" y="13" width="8" height="8" rx="2" fill="#c9a84c"/>
        </svg>
      ),
      title: "Track & Monitor",
      desc: "Keep tabs on all your medical assets across every department.",
      bg: "#eaf5ef",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#c9a84c" strokeWidth="2"/>
          <path d="M12 7V12L15 15" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: "Schedule Maintenance",
      desc: "Plan and manage maintenance tasks before problems arise.",
      bg: "#fef9ec",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10" stroke="#006341" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 3L20 7V12C20 16.4 16.4 20.4 12 21C7.6 20.4 4 16.4 4 12V7L12 3Z" stroke="#006341" strokeWidth="2"/>
        </svg>
      ),
      title: "Ensure Compliance",
      desc: "Stay fully compliant with health regulations and standards.",
      bg: "#eaf5ef",
    },
  ];

  return (
    <div className="home-container">

      {/* SLIDER */}
      <HeroSlider />

      {/* FEATURE STRIP - مع أنيميشن للكروت الثلاثة */}
      <div className="home-features">
        {features.map((f, i) => (
          <div className="feature-card animated-card" key={i} style={{ background: f.bg }}>
            <div className="feature-icon">{f.icon}</div>
            <div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* WHY SECTION */}
      <div className="home-why">
        <h2 className="home-why-title">Why Choose EquipCare?</h2>
      </div>
      
      <div className="why-details">
        <div className="why-card">
          <div className="why-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="7" height="7" rx="2" fill="#006341"/>
              <rect x="13" y="4" width="7" height="7" rx="2" fill="#006341" opacity="0.5"/>
              <rect x="4" y="13" width="7" height="7" rx="2" fill="#006341" opacity="0.5"/>
              <rect x="13" y="13" width="7" height="7" rx="2" fill="#c9a84c"/>
            </svg>
          </div>
          <h3>Centralized Management</h3>
          <p>Central Management Manage all hospital equipment from a single unified control panel easily and quickly.</p>
        </div>

        <div className="why-card">
          <div className="why-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#c9a84c" strokeWidth="2"/>
              <path d="M12 8V12L15 14" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>Smart Maintenance</h3>
          <p>Automatic reminders and scheduling to avoid unexpected breakdowns.</p>
        </div>

        <div className="why-card">
          <div className="why-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V10" stroke="#006341" strokeWidth="2"/>
              <path d="M10 20V4" stroke="#006341" strokeWidth="2"/>
              <path d="M16 20V14" stroke="#006341" strokeWidth="2"/>
              <circle cx="4" cy="10" r="2" fill="#c9a84c"/>
              <circle cx="10" cy="4" r="2" fill="#c9a84c"/>
              <circle cx="16" cy="14" r="2" fill="#c9a84c"/>
            </svg>
          </div>
          <h3>Data Insights</h3>
          <p>Get detailed reports and analytics to improve decision-making.</p>
        </div>

        <div className="why-card">
          <div className="why-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L20 7V12C20 16.5 16.5 20.5 12 21C7.5 20.5 4 16.5 4 12V7L12 3Z" stroke="#006341" strokeWidth="2"/>
              <path d="M9 12L11 14L15 10" stroke="#006341" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>Secure System</h3>
          <p>Protect sensitive medical data with high-level security standards.</p>
        </div>
      </div>

    </div>
  );
}

export default Home;