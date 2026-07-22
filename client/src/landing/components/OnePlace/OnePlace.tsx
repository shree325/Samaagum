import React from "react";
import { SectionHeader } from "../../ui/SectionHeader";

export function OnePlace() {
  const STEPS = [
    { label: "Create Group", desc: "Set up your space in seconds.", icon: "🌱" },
    { label: "Invite Members", desc: "Share custom onboarding invites.", icon: "👥" },
    { label: "Host Events", desc: "Organize meets & workshops.", icon: "📅" },
    { label: "Discuss Together", desc: "Run discussions and polls.", icon: "💬" },
    { label: "Chat Instantly", desc: "Real-time channels & messages.", icon: "⚡" },
    { label: "Track Growth", desc: "Review user dashboards.", icon: "📈" }
  ];

  return (
    <section className="section" id="one-place" style={{ background: "var(--border-2)", padding: "80px 0" }}>
      <div className="wrap">
        <SectionHeader
          eyebrow="Ecosystem Pipeline"
          title={
            <span>
              One platform. <span style={{ color: "var(--primary)" }}>Everything you need.</span>
            </span>
          }
          subtitle="Stop duct-taping Zoom, Discord, Eventbrite, and Google Forms together. Samaagum connects every step of the group lifecycle."
        />

        <div
          className="one-place-flow"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            gap: 20,
            marginTop: 48,
            flexWrap: "wrap"
          }}
        >
          {STEPS.map((step, idx) => (
            <React.Fragment key={idx}>
              <div
                className="glass-card step-card"
                style={{
                  flex: "1 1 160px",
                  padding: 24,
                  borderRadius: 20,
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.01)"
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(108, 77, 246, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20
                  }}
                >
                  {step.icon}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>{step.label}</h4>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.4 }}>{step.desc}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="flow-connector"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ink-3)",
                    fontSize: 16
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
export default OnePlace;
