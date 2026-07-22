import React, { useState } from "react";
import { SectionHeader } from "../../ui/SectionHeader";
import { useReveal } from "../../hooks/useReveal";

type TabType = "discussions" | "events" | "gallery" | "announcements";

export function CommunityPreview() {
  const [activeTab, setActiveTab] = useState<TabType>("discussions");
  const { ref: containerRef, show } = useReveal();

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "discussions", label: "Discussions", icon: "💬" },
    { id: "events", label: "Upcoming Events", icon: "📅" },
    { id: "gallery", label: "Gallery", icon: "🖼️" },
    { id: "announcements", label: "Announcements", icon: "📢" }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "discussions":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6C4DF6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>AR</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Aanya Rao <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)" }}>12m ago</span></div>
                <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 2 }}>"Who's attending the landscape photography session this weekend?"</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span className="tag-pill sm" style={{ fontSize: 10 }}>👍 12 reactions</span>
                  <span className="tag-pill sm" style={{ fontSize: 10 }}>💬 5 replies</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid var(--card-border)" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ff4d8d", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>MS</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Mira Shah <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)" }}>45m ago</span></div>
                <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 2 }}>"Just shared my edit from the sunrise trek. Check the gallery! 🌅"</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span className="tag-pill sm" style={{ fontSize: 10 }}>🔥 24 reactions</span>
                  <span className="tag-pill sm" style={{ fontSize: 10 }}>💬 8 replies</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "events":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(108, 77, 246, 0.03)", borderRadius: 12, border: "1px solid rgba(108, 77, 246, 0.05)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Landscape Photo Walk</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>June 25, 2026 · Cubbon Park</div>
              </div>
              <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>64 RSVP'd</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--card-bg)", borderRadius: 12, border: "1px solid var(--card-border)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Post-Processing Workshop</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>July 2, 2026 · Online (Zoom)</div>
              </div>
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>32 RSVP'd</span>
            </div>
          </div>
        );
      case "gallery":
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {["Nandi Hills", "City Lights", "Macro Nature", "Abstract Pattern", "Street Life", "Portraits"].map((cap, i) => (
              <div key={i} className="gallery-mock-item" style={{ aspectRatio: "4/3", borderRadius: 8, background: `linear-gradient(135deg, rgba(108, 77, 246, ${0.1 + i * 0.05}), rgba(255, 77, 141, ${0.1 + i * 0.05}))`, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--card-border)", position: "relative", overflow: "hidden" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", zIndex: 2 }}>{cap}</span>
              </div>
            ))}
          </div>
        );
      case "announcements":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: 14, background: "rgba(245, 159, 0, 0.1)", border: "1px solid rgba(245, 159, 0, 0.25)", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>📌</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F59F00", textTransform: "uppercase" }}>Pinned Announcement</span>
              </div>
              <h5 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#FFF9DB" }}>Rules update for Photo walks</h5>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.4 }}>Please carry your identity badges during all upcoming physical treks for security clearance.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <section className="section" id="community-preview" style={{ background: "var(--bg)", padding: "80px 0" }}>
      <div className="wrap">
        <SectionHeader
          eyebrow="Inside a Community"
          title={
            <span>
              See how a community <span style={{ color: "var(--primary)" }}>operates.</span>
            </span>
          }
          subtitle="Explore the shared workspace where communities connect. Everything from event RSVPs to photos and discussions happens right here."
        />

        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          className="glass-card community-dashboard-preview"
          style={{
            maxWidth: 800,
            margin: "48px auto 0",
            borderRadius: 20,
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.04)",
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            overflow: "hidden",
            opacity: show ? 1 : 0,
            transform: show ? "none" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {/* Dashboard Header Bar */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--card-border)", background: "var(--border-2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6C4DF6, #ff4d8d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>📷</div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Photography Club</h4>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Public Group · 3.2K Members</div>
              </div>
            </div>
            <span className="tag-pill sm" style={{ background: "#22c55e", color: "#fff" }}>Active</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: 320 }} className="preview-grid-layout">
            {/* Sidebar Navigation */}
            <div style={{ borderRight: "1px solid var(--card-border)", padding: 12, display: "flex", flexDirection: "column", gap: 4, background: "var(--border-2)" }} className="preview-sidebar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: activeTab === tab.id ? "rgba(108, 77, 246, 0.08)" : "transparent",
                    color: activeTab === tab.id ? "var(--primary)" : "var(--ink-2)",
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: 13.5,
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div style={{ padding: 24, background: "var(--card-bg)" }}>{renderTabContent()}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default CommunityPreview;
