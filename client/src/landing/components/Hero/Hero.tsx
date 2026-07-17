import React from "react";
import { CTAButton, I_arrow } from "../../ui/CTAButton";
import { useReveal } from "../../hooks/useReveal";
import { useMouseParallax } from "../../hooks/useMouseParallax";

const AUTH_PATH = "/pages/Samaagum Auth.html";

export function Hero() {
  const { ref: textRef, show: showText } = useReveal();
  const cardRef = useMouseParallax(8);

  return (
    <header className="hero" id="top" style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "85vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 100, paddingBottom: 60 }}>
      {/* Soft floating background shapes */}
      <div className="hero-mesh" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <div className="hero-blob" style={{ width: 600, height: 600, top: "-10%", left: "-10%", background: "rgba(108, 77, 246, 0.08)", filter: "blur(80px)", borderRadius: "50%", position: "absolute" }} />
        <div className="hero-blob" style={{ width: 500, height: 500, top: "20%", right: "-10%", background: "rgba(255, 77, 141, 0.06)", filter: "blur(80px)", borderRadius: "50%", position: "absolute" }} />
      </div>

      <div className="wrap" style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", width: "100%" }}>
        {/* Left Column: Storytelling Headline */}
        <div
          ref={textRef as React.RefObject<HTMLDivElement>}
          style={{
            opacity: showText ? 1 : 0,
            transform: showText ? "none" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <span className="eyebrow-pill" style={{ marginBottom: 20 }}>
            <span className="pulse" />
            Now live in 100+ cities
          </span>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.1, color: "var(--ink)", margin: "0 0 20px" }}>
            Discover Communities.<br />
            Build Friendships.<br />
            Create <span style={{ background: "linear-gradient(135deg, var(--primary), #ff4d8d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Memories.</span>
          </h1>
          <p style={{ fontSize: 16.5, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 32px", maxWidth: 500 }}>
            Join local communities, attend amazing events, participate in rich discussions, and meet people who share your true interests. All in one place.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <CTAButton
              href={`${AUTH_PATH}#signup`}
              variant="primary"
              size="lg"
              trackingName="Hero Primary CTA Clicked"
            >
              Get Started
              <I_arrow style={{ marginLeft: 6 }} />
            </CTAButton>
            <CTAButton
              href="#search"
              variant="ghost"
              size="lg"
              trackingName="Hero Secondary CTA Clicked"
            >
              Explore Communities
            </CTAButton>
          </div>
        </div>

        {/* Right Column: Dynamic Interactive Application Mockup */}
        <div className="hero-preview-container" style={{ display: "flex", justifyContent: "center", position: "relative" }}>
          <div
            ref={cardRef as React.RefObject<HTMLDivElement>}
            className="glass-card product-mockup"
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 20,
              border: "1px solid var(--card-border)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
              background: "var(--card-bg)",
              overflow: "hidden",
              transition: "transform 0.1s ease-out"
            }}
          >
            {/* Mock Window Bar */}
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: 6, background: "var(--border-2)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }} />
              <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", fontFamily: "monospace" }}>samaagum.app/photography-club</span>
            </div>

            {/* Mock Inside Content */}
            <div style={{ padding: 20 }}>
              {/* Header block */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6c4df6, #ff4d8d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>📷</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--ink)" }}>Photography Club BLR</h4>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Active community · 3.2K members</div>
                </div>
              </div>

              {/* Event card */}
              <div style={{ padding: 14, background: "rgba(108, 77, 246, 0.04)", border: "1px solid rgba(108, 77, 246, 0.08)", borderRadius: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Upcoming Event</div>
                <h5 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>Nandi Hills Sunrise Trek</h5>
                <div style={{ fontSize: 12, color: "var(--ink-2)" }}>Saturday · 5:30 AM · Cubbon Meeting point</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ display: "flex", marginLeft: 4 }}>
                      {["AR", "DK", "MS"].map((init, i) => (
                        <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: "#6C4DF6", border: "2px solid var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#fff", fontWeight: 700, marginLeft: i > 0 ? -6 : 0 }}>{init}</div>
                      ))}
                    </div>
                    <span style={{ fontSize: 11.5, color: "var(--ink-3)", marginLeft: 6 }}>+42 going</span>
                  </div>
                  <span className="tag-pill sm" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", color: "var(--ink-2)", fontSize: 10.5 }}>RSVP'd ✓</span>
                </div>
              </div>

              {/* Latest discussion */}
              <div style={{ padding: 12, border: "1px solid var(--card-border)", borderRadius: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Recent Discussion</div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #a855f7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 9 }}>LP</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>Leo Park <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)" }}>4m ago</span></div>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--ink-2)" }}>"Which lenses are you guys bringing for low light?"</p>
                  </div>
                </div>
              </div>

              {/* Live status badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--ink-3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                  <span>24 members online now</span>
                </div>
                <span>View Dashboard →</span>
              </div>
            </div>
          </div>

          {/* Floating badge shape */}
          <div className="glass-card float-badge" style={{ position: "absolute", bottom: -20, left: -20, padding: "10px 16px", borderRadius: 14, boxShadow: "0 10px 20px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 8, background: "var(--card-bg)", zIndex: 10 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Discussions and messaging included!</div>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Hero;
