import React, { useState, useEffect } from "react";
import { CTAButton, I_arrow } from "../../ui/CTAButton";
import { useReveal } from "../../hooks/useReveal";
import { HeroCarousel } from "../../../home-feed";

const AUTH_PATH = "/pages/Samaagum Auth.html";

export function Hero() {
  const { ref: textRef, show: showText } = useReveal();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    fetch(`${apiBase}/api/dashboard/hero-events`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setEvents(res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load hero events:", err);
        setLoading(false);
      });
  }, []);

  const dummyGo = () => {
    window.location.href = `/pages/Samaagum Auth.html#login`;
  };

  return (
    <header className="hero" id="top" style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "85vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 100, paddingBottom: 60 }}>
      {/* Soft floating background shapes */}
      <div className="hero-mesh" style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <div className="hero-blob" style={{ width: 600, height: 600, top: "-10%", left: "-10%", background: "rgba(108, 77, 246, 0.08)", filter: "blur(80px)", borderRadius: "50%", position: "absolute" }} />
        <div className="hero-blob" style={{ width: 500, height: 500, top: "20%", right: "-10%", background: "rgba(255, 77, 141, 0.06)", filter: "blur(80px)", borderRadius: "50%", position: "absolute" }} />
      </div>

      <div className="wrap" style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center", width: "100%" }}>
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

        {/* Right Column: Hero Carousel */}
        <div style={{ width: "100%", minWidth: 0 }}>
          {loading ? (
            <div className="hero-carousel" style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 20 }} />
            </div>
          ) : (
            <HeroCarousel
              events={events}
              go={dummyGo}
              wishlisted={new Set()}
              wishlistCounts={{}}
              toggleWishlist={() => {}}
              registered={new Set()}
            />
          )}
        </div>
      </div>
    </header>
  );
}
export default Hero;
