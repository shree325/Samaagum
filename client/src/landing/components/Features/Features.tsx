import React from "react";
import { FeatureCard } from "../../ui/FeatureCard";
import { SectionHeader } from "../../ui/SectionHeader";

export function Features() {
  const GROUP_FEATURES = [
    { title: "Dedicated Groups", description: "Create, join, and govern group pages with unique namespaces.", icon: "👥" },
    { title: "Rich Discussions", description: "Threaded conversations, polls, and pinning to keep files and links handy.", icon: "💬" },
    { title: "Real-time Messaging", description: "Chat directly with friends or discuss live in group channels.", icon: "⚡" }
  ];

  const ORGANIZE_FEATURES = [
    { title: "Event Hosting", description: "Schedule online/offline meetups with check-ins, ticketing, and RSVPs.", icon: "📅" },
    { title: "Role Management", description: "Define custom roles: Owners, Admins, Moderators, and Members.", icon: "🛡️" },
    { title: "Moderation Controls", description: "Keep spaces friendly with automated warnings and message deletion.", icon: "⚙️" }
  ];

  const GROW_FEATURES = [
    { title: "Analytics Dashboard", description: "Track group growth, monthly active members, and messages.", icon: "📈" },
    { title: "Waitlists & Invites", description: "Manage exclusive invites and launch waitlists for premium events.", icon: "🎟️" },
    { title: "Instant Notifications", description: "Push alerts for new events, posts, replies, and mentions.", icon: "🔔" }
  ];

  return (
    <section className="section" id="features" style={{ background: "var(--bg)", padding: "80px 0" }}>
      <div className="wrap">
        <SectionHeader
          eyebrow="Why Samaagum"
          title={
            <span>
              Everything your group <span style={{ color: "var(--primary)" }}>needs.</span>
            </span>
          }
          subtitle="More than an event site. Build relationships through structured discussions, instant chats, role management, and rich dashboards."
        />

        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 32,
            marginTop: 48
          }}
        >
          {/* Column 1: Group */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "var(--primary)", borderBottom: "2px solid rgba(108, 77, 246, 0.1)", paddingBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>💬</span> Group
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {GROUP_FEATURES.map((f, i) => (
                <FeatureCard key={i} title={f.title} description={f.description} icon={f.icon} gradient="rgba(108, 77, 246, 0.05)" />
              ))}
            </div>
          </div>

          {/* Column 2: Organize */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#ff4d8d", borderBottom: "2px solid rgba(255, 77, 141, 0.1)", paddingBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🛠️</span> Organize
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {ORGANIZE_FEATURES.map((f, i) => (
                <FeatureCard key={i} title={f.title} description={f.description} icon={f.icon} gradient="rgba(255, 77, 141, 0.05)" />
              ))}
            </div>
          </div>

          {/* Column 3: Grow */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: "#10b981", borderBottom: "2px solid rgba(16, 185, 129, 0.1)", paddingBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span>📈</span> Grow
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {GROW_FEATURES.map((f, i) => (
                <FeatureCard key={i} title={f.title} description={f.description} icon={f.icon} gradient="rgba(16, 185, 129, 0.05)" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Features;
