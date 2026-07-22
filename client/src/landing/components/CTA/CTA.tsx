import React from "react";
import { CTAButton, I_arrow } from "../../ui/CTAButton";
import { useReveal } from "../../hooks/useReveal";
import { APP_ROUTES } from "../../constants/APP_ROUTES";

const AUTH_PATH = "/pages/Samaagum Auth.html";

export function CTA() {
  const { ref, show } = useReveal();

  return (
    <section
      className="cta-final"
      style={{
        background: "var(--bg)",
        padding: "100px 0",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid var(--card-border)",
        borderBottom: "1px solid var(--card-border)"
      }}
    >
      {/* Overlapping decorative concentric rings */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 1, opacity: 0.25 }}>
        {[260, 480, 720, 960].map((d) => (
          <div
            key={d}
            style={{
              width: d,
              height: d,
              borderRadius: "50%",
              border: "1px dashed var(--primary)",
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)"
            }}
          />
        ))}
      </div>

      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className="wrap"
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          maxWidth: 680,
          opacity: show ? 1 : 0,
          transform: show ? "none" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <span className="eyebrow-pill" style={{ marginBottom: 24 }}>
          <span className="grad-dot" />
          Your people are waiting
        </span>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.2, margin: "0 0 16px", color: "var(--ink)" }}>
          Start Building Your<br />
          <span style={{ background: "linear-gradient(135deg, var(--primary), #ff4d8d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Group Today.</span>
        </h2>
        <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 36px" }}>
          Whether you're a college club, company, NGO, startup, hobby group, or local organization, Samaagum gives you everything you need to build an active group.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <CTAButton
            href={`${AUTH_PATH}#signup`}
            variant="primary"
            size="lg"
            trackingName="CTA Section Primary Clicked"
          >
            Create Group
            <I_arrow style={{ marginLeft: 6 }} />
          </CTAButton>
          <CTAButton
            href={APP_ROUTES.discover(undefined, "groups")}
            variant="ghost"
            size="lg"
            trackingName="CTA Section Secondary Clicked"
          >
            Explore Groups
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
export default CTA;
