import React, { useEffect, useState } from "react";
import { ActivityItemData } from "../../types/activity";
import { LandingService } from "../../services/landing.service";
import { useActivityFeed } from "../../hooks/useActivityFeed";
import { ActivityItem } from "../../ui/ActivityItem";
import { SectionHeader } from "../../ui/SectionHeader";
import { useReveal } from "../../hooks/useReveal";

export function Activity() {
  const [initialActs, setInitialActs] = useState<ActivityItemData[]>([]);
  const { ref: feedContainerRef, show: showFeed } = useReveal();

  useEffect(() => {
    LandingService.getInitialActivities().then((data) => {
      setInitialActs(data);
    });
  }, []);

  const activities = useActivityFeed(initialActs);

  return (
    <section className="section" id="activity" style={{ background: "var(--bg)", padding: "80px 0" }}>
      <div className="wrap">
        <SectionHeader
          eyebrow="Live Ticker"
          title={
            <span>
              A platform that's <span style={{ color: "var(--primary)" }}>always alive.</span>
            </span>
          }
          subtitle="Real-time activity logs show exactly what's happening. Communities forming, registrations happening, and discussions firing right now."
        />

        <div
          ref={feedContainerRef as React.RefObject<HTMLDivElement>}
          className="glass-card"
          style={{
            maxWidth: 600,
            margin: "40px auto 0",
            borderRadius: 20,
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.03)",
            overflow: "hidden",
            opacity: showFeed ? 1 : 0,
            transform: showFeed ? "none" : "translateY(20px)",
            transition: "all 0.6s ease"
          }}
        >
          {/* Header block */}
          <div style={{ padding: "16px 20px", borderBottom: "2px solid var(--card-border)", background: "var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 1.5s infinite" }} />
              <strong style={{ fontSize: 13.5, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--ink-2)" }}>Live Activity Stream</strong>
            </div>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Updated instantly</span>
          </div>

          {/* Activities list container */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {activities.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)" }}>Connecting to stream...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {activities.map((act) => (
                  <ActivityItem key={act.id} activity={act} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
export default Activity;
